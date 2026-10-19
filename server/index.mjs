import { createServer } from "node:http";

const PORT = Number(process.env.API_PORT || 3001);
const HOST = process.env.API_HOST || "127.0.0.1";
const CACHE_TTL = 12 * 60 * 60 * 1000;
const MAX_FEED_BYTES = 5 * 1024 * 1024;

let cachedNews = null;
let cachedAt = 0;
let refreshPromise = null;

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    .replace(/\s+/g, " ")
    .trim();
}

function readTag(xml, tag) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(
    new RegExp(`<${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTag}\\s*>`, "i"),
  );
  return match ? decodeXml(match[1]) : "";
}

function parseFeed(xml, sourceHost) {
  const items = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>[\s\S]*?<\/\1\s*>/gi)];

  return items
    .map(([item]) => {
      const title = readTag(item, "title");
      const linkTags = [...item.matchAll(/<link\b([^>]*?)(?:\/>|>([\s\S]*?)<\/link\s*>)/gi)];
      const link =
        linkTags
          .map(([, attributes, content]) => {
            const href = attributes.match(/\bhref=["']([^"']+)["']/i)?.[1];
            const rel = attributes.match(/\brel=["']([^"']+)["']/i)?.[1];
            return {
              value: href || decodeXml(content || ""),
              rel: rel?.toLowerCase(),
            };
          })
          .find(({ value, rel }) => value && (!rel || rel === "alternate"))
          ?.value || "";
      const description =
        readTag(item, "content:encoded") ||
        readTag(item, "description") ||
        readTag(item, "summary") ||
        readTag(item, "content");
      const imageUrl = [...item.matchAll(/<(?:media:content|media:thumbnail|enclosure)\b([^>]*?)\/?>/gi)]
        .map(([, attributes]) => attributes.match(/\burl=["']([^"']+)["']/i)?.[1])
        .find((url) => {
          try {
            return url && new URL(url).protocol === "https:";
          } catch {
            return false;
          }
        });
      const publishedAt =
        readTag(item, "pubDate") ||
        readTag(item, "published") ||
        readTag(item, "updated");

      try {
        const url = new URL(link);
        const isRevistaOeste =
          url.hostname === "revistaoeste.com" ||
          url.hostname.endsWith(".revistaoeste.com");
        if (url.protocol !== "https:" || !isRevistaOeste) return null;
        if (!title || !description) return null;

        return {
          title,
          content: description,
          sourceUrl: url.href,
          imageUrl,
          publishedAt,
          rewritten: false,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFeedText(feedUrl) {
  const response = await fetchWithTimeout(feedUrl, {
    headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
  });

  if (!response.ok) throw new Error("Feed indisponível");

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Feed inválido");

  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_FEED_BYTES) {
      await reader.cancel();
      throw new Error("Feed excede o tamanho permitido");
    }
    chunks.push(value);
  }

  return new TextDecoder().decode(
    chunks.reduce((all, chunk) => {
      const combined = new Uint8Array(all.length + chunk.length);
      combined.set(all);
      combined.set(chunk, all.length);
      return combined;
    }, new Uint8Array()),
  );
}



async function refreshNews() {
  const feedUrl = new URL(
    process.env.RSS_FEED_URL || "https://revistaoeste.com/feed/",
  );
  if (feedUrl.protocol !== "https:") throw new Error("Fonte RSS inválida");

  const xml = await fetchFeedText(feedUrl.href);
  const articles = parseFeed(xml, feedUrl.hostname);

  cachedNews = articles;
  cachedAt = Date.now();
  return cachedNews;
}

async function getNews() {
  if (cachedNews && Date.now() - cachedAt < CACHE_TTL) return cachedNews;
  if (!refreshPromise) {
    refreshPromise = refreshNews().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

const server = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET") {
    response.writeHead(405, { Allow: "GET" });
    response.end();
    return;
  }

  if (request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (request.url !== "/api/news") {
    response.writeHead(404);
    response.end();
    return;
  }

  try {
    const news = await getNews();
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ source: "Revista Oeste", updatedAt: cachedAt, items: news }));
  } catch {
    response.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Notícias indisponíveis no momento." }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Servidor local ativo em http://${HOST}:${PORT}`);
});