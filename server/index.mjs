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
      const linkTag = item.match(/<link\b[^>]*>/i)?.[0] || "";
      const link =
        readTag(item, "link") ||
        linkTag.match(/\bhref=["']([^"']+)["']/i)?.[1] ||
        "";
      const description =
        readTag(item, "content:encoded") ||
        readTag(item, "description") ||
        readTag(item, "summary") ||
        readTag(item, "content");
      const publishedAt =
        readTag(item, "pubDate") ||
        readTag(item, "published") ||
        readTag(item, "updated");

      try {
        const url = new URL(link);
        if (url.protocol !== "https:" || url.hostname !== sourceHost) return null;
        if (!title || !description) return null;

        return {
          title,
          content: description,
          sourceUrl: url.href,
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

async function rewriteArticle(article) {
  const endpoint = process.env.REWRITE_API_URL;
  const apiKey = process.env.REWRITE_API_KEY;

  if (!endpoint || !apiKey) return article;

  const url = new URL(endpoint);
  if (url.protocol !== "https:") throw new Error("Endpoint de reescrita inválido");

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      title: article.title,
      content: article.content,
      source_url: article.sourceUrl,
    }),
  });

  if (!response.ok) throw new Error("Serviço de reescrita indisponível");

  const result = await response.json();
  if (typeof result.title !== "string" || typeof result.content !== "string") {
    throw new Error("Resposta inválida do serviço de reescrita");
  }

  return { ...article, title: result.title, content: result.content, rewritten: true };
}

async function refreshNews() {
  if (!process.env.RSS_FEED_URL) throw new Error("Fonte RSS não configurada");

  const feedUrl = new URL(process.env.RSS_FEED_URL);
  if (feedUrl.protocol !== "https:") throw new Error("Fonte RSS inválida");

  const xml = await fetchFeedText(feedUrl.href);
  const articles = parseFeed(xml, feedUrl.hostname);
  const news = [];

  for (const article of articles) {
    try {
      news.push(await rewriteArticle(article));
    } catch {
      news.push(article);
    }
  }

  cachedNews = news;
  cachedAt = Date.now();
  return news;
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