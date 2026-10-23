import { createServer } from "node:http";

const PORT = Number(process.env.PORT || process.env.API_PORT || 3001);
const HOST = process.env.API_HOST || "0.0.0.0";
const CACHE_TTL = 12 * 60 * 60 * 1000;
const MAX_FEED_BYTES = 5 * 1024 * 1024;

let cachedNews = null;
let cachedAt = 0;
let refreshPromise = null;
let cachedSaberNews = null;
let cachedSaberAt = 0;
let cachedAgroNews = null;
let cachedAgroAt = 0;

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    .replace(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi, (anchor, attributes) => {
      const href = attributes.match(/\bhref=["']([^"']+)["']/i)?.[1];
      try {
        const hostname = new URL(href).hostname.toLowerCase();
        if (
          hostname === "youtu.be" ||
          hostname.endsWith(".youtu.be") ||
          hostname === "youtube.com" ||
          hostname.endsWith(".youtube.com") ||
          hostname === "youtube-nocookie.com" ||
          hostname.endsWith(".youtube-nocookie.com")
        ) {
          return " ";
        }
      } catch {
        // Mantém links sem endereço reconhecível.
      }
      return anchor;
    })
    .replace(/<br\b[^>]*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6]|blockquote|section|article)\s*>/gi, "\n")
    .replace(/<(?:p|div|li|h[1-6]|blockquote|section|article)\b[^>]*>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function cleanNewsContent(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(
      /(?:https?:\/\/|www\.)?(?:www\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\S*/gi,
      " ",
    )
    .replace(/\b(?:https?:\/\/|www\.)[^\s<>"']+/gi, " ")
    .replace(
      /^\s*\+\s*Entenda como funciona(?: a política brasileira)?(?: no guia)? de? Oeste\.?\s*$/gim,
      "",
    )
    .replace(/^\s*Leia também\s*:\s*.*$/gim, "")
    .replace(/^\s*Edição\s+\d+.*Revista Oeste.*$/gim, "")
    .replace(/\bEdição\s+\d+\s+(?:da\s+)?Revista Oeste\b/gi, "")
    .replace(
      /\n?\s*O post\b[\s\S]*?\bapareceu primeiro em\s*\.?\s*$/i,
      "",
    )
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/ *([,.;:!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .split(/\n+/)
    .filter((paragraph) => !/\bRevista Oeste\b/i.test(paragraph))
    .join("\n\n");
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
      const categories = [...item.matchAll(/<category\b([^>]*?)(?:\/>|>([\s\S]*?)<\/category\s*>)/gi)]
        .map(([, attributes, content]) => {
          const term = attributes.match(/\bterm=["']([^"']+)["']/i)?.[1];
          return decodeXml(term || content || "").replace(/<[^>]*>/g, "").trim();
        })
        .filter(Boolean);

      try {
        const url = new URL(link);
        const allowedHost = sourceHost.toLowerCase().replace(/^www\./, "");
        const articleHost = url.hostname.toLowerCase().replace(/^www\./, "");
        const isAllowedHost =
          articleHost === allowedHost || articleHost.endsWith(`.${allowedHost}`);
        if (url.protocol !== "https:" || !isAllowedHost) return null;
        if (!title) return null;

        return {
          title,
          content: cleanNewsContent(description),
          sourceUrl: url.href,
          imageUrl,
          publishedAt,
          categories,
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

  const articlesByUrl = new Map();

  const feedXml = await fetchFeedText(feedUrl.href);
  const feedArticles = parseFeed(feedXml, feedUrl.hostname);
  for (const article of feedArticles) {
    articlesByUrl.set(article.sourceUrl, article);
  }

  const categoryPaths = [
    "/category/no-ponto/feed/",
    "/no-ponto/feed/",
    "/category/no-ponto/feed/?paged=2",
    "/category/no-ponto/page/2/feed/",
    "/no-ponto/feed/?paged=2",
  ];

  for (const path of categoryPaths) {
    try {
      const categoryUrl = new URL(path, "https://revistaoeste.com");
      const xml = await fetchFeedText(categoryUrl.href);
      const categoryArticles = parseFeed(xml, categoryUrl.hostname);
      console.info(`[notícias] ${path}: ${categoryArticles.length} matérias válidas`);

      for (const article of categoryArticles) {
        const existing = articlesByUrl.get(article.sourceUrl);
        articlesByUrl.set(article.sourceUrl, {
          ...(existing || article),
          ...article,
          categories: [
            ...new Set([
              ...(existing?.categories || []),
              ...(article.categories || []),
              "No Ponto",
            ]),
          ],
        });
      }
    } catch (error) {
      console.warn(
        `[notícias] Falha ao consultar ${path}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  cachedNews = [...articlesByUrl.values()].sort((a, b) => {
    const dateA = Date.parse(a.publishedAt || "") || 0;
    const dateB = Date.parse(b.publishedAt || "") || 0;
    return dateB - dateA;
  });
  cachedAt = Date.now();
  console.info(`[notícias] Resultado: ${cachedNews.length} matérias recebidas`);
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

async function getSaberNews() {
  if (cachedSaberNews && Date.now() - cachedSaberAt < CACHE_TTL) {
    return cachedSaberNews;
  }

  const feedUrl = "https://www.gazetadopovo.com.br/saber/feed/";
  const xml = await fetchFeedText(feedUrl);
  cachedSaberNews = parseFeed(xml, "gazetadopovo.com.br")
    .sort((a, b) => (Date.parse(b.publishedAt || "") || 0) - (Date.parse(a.publishedAt || "") || 0))
    .slice(0, 12);
  cachedSaberAt = Date.now();
  return cachedSaberNews;
}

async function getAgroNews() {
  if (cachedAgroNews && Date.now() - cachedAgroAt < CACHE_TTL) {
    return cachedAgroNews;
  }

  const feedPaths = [
    "/agronegocio/feed/",
    "/category/agronegocio/feed/",
  ];

  for (const path of feedPaths) {
    try {
      const xml = await fetchFeedText(new URL(path, "https://revistaoeste.com").href);
      const items = parseFeed(xml, "revistaoeste.com")
        .sort((a, b) => (Date.parse(b.publishedAt || "") || 0) - (Date.parse(a.publishedAt || "") || 0))
        .slice(0, 8);

      if (items.length > 0) {
        cachedAgroNews = items;
        cachedAgroAt = Date.now();
        return cachedAgroNews;
      }
    } catch {
      // Tenta o endereço alternativo do feed da editoria.
    }
  }

  throw new Error("Feed de Agronegócio indisponível");
}

function isAllowedCheckoutUrl(value) {
  try {
    const url = new URL(value);
    const allowedHosts = [
      "cakto.com.br",
      "hotmart.com",
      "kiwify.com.br",
      "kiwify.app",
      "stripe.com",
      "mercadopago.com",
      "mercadopago.com.br",
      "mpago.la",
    ];
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return (
      url.protocol === "https:" &&
      allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))
    );
  } catch {
    return false;
  }
}

function decodeMetaValue(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

async function getProductImage(checkoutUrl) {
  if (!isAllowedCheckoutUrl(checkoutUrl)) {
    throw new Error("Endereço de checkout não permitido");
  }

  const page = await fetchWithTimeout(checkoutUrl, {
    headers: { Accept: "text/html,application/xhtml+xml" },
  });

  if (!page.ok || !isAllowedCheckoutUrl(page.url)) return null;

  const html = (await page.text()).slice(0, 2 * 1024 * 1024);
  const metaTags = html.match(/<meta\\b[^>]*>/gi) || [];

  for (const tag of metaTags) {
    const attributes = Object.fromEntries(
      [...tag.matchAll(/([\\w:-]+)\\s*=\\s*["']([^"']*)["']/g)].map(
        ([, name, value]) => [name.toLowerCase(), decodeMetaValue(value)],
      ),
    );
    const property = (attributes.property || attributes.name || "").toLowerCase();

    if (property === "og:image" || property === "twitter:image") {
      try {
        const imageUrl = new URL(attributes.content || "", page.url);
        if (imageUrl.protocol === "https:") return imageUrl.href;
      } catch {
        // Continua procurando uma imagem Open Graph válida.
      }
    }
  }

  return null;
}

async function getUsdBrlHistory() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  const formatDate = (date) => date.toISOString().slice(0, 10);
  const url = `https://api.frankfurter.dev/v1/${formatDate(start)}..${formatDate(end)}?base=USD&symbols=BRL`;
  const response = await fetchWithTimeout(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Cotação indisponível");

  const data = await response.json();
  return Object.entries(data.rates || {}).map(([date, rates]) => ({
    date,
    value: rates.BRL,
  }));
}

function extractElementInner(html, tagName, openingPattern) {
  const opening = openingPattern.exec(html);
  if (!opening) return "";

  const tokens = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tokens.lastIndex = opening.index;
  let depth = 0;
  let token;

  while ((token = tokens.exec(html))) {
    if (token[0].startsWith("</")) {
      depth -= 1;
    } else if (!token[0].endsWith("/>")) {
      depth += 1;
    }

    if (depth === 0) {
      return html.slice(opening.index + opening[0].length, token.index);
    }
  }

  return "";
}

function readArticleMeta(html, names) {
  for (const [, tag] of html.matchAll(/<meta\\b[^>]*>/gi)) {
    const attributes = Object.fromEntries(
      [...tag.matchAll(/([\\w:-]+)\\s*=\\s*["']([^"']*)["']/g)].map(
        ([, name, value]) => [name.toLowerCase(), value],
      ),
    );
    const key = (attributes.name || attributes.property || "").toLowerCase();
    if (names.includes(key) && attributes.content) {
      return decodeXml(attributes.content);
    }
  }

  return "";
}

async function getFullArticle(articleUrl) {
  const allowedHost = "revistaoeste.com";
  const articleHost = articleUrl.hostname.toLowerCase().replace(/^www\\./, "");
  if (
    articleUrl.protocol !== "https:" ||
    (articleHost !== allowedHost && !articleHost.endsWith(`.${allowedHost}`))
  ) {
    throw new Error("Endereço de matéria inválido");
  }

  const page = await fetchWithTimeout(articleUrl.href, {
    headers: { Accept: "text/html,application/xhtml+xml" },
  });
  if (!page.ok) throw new Error("Matéria indisponível");

  const finalUrl = new URL(page.url);
  const finalHost = finalUrl.hostname.toLowerCase().replace(/^www\\./, "");
  if (
    finalUrl.protocol !== "https:" ||
    (finalHost !== allowedHost && !finalHost.endsWith(`.${allowedHost}`))
  ) {
    throw new Error("Endereço de matéria inválido");
  }

  const html = await page.text();
  const articleHtml =
    extractElementInner(html, "article", /<article\\b[^>]*>/i) ||
    extractElementInner(
      html,
      "div",
      /<div\\b(?=[^>]*\\bclass=["'][^"']*\\b(?:entry-content|post-content|article-content|content__body)\\b)[^>]*>/i,
    );

  const titleMatch = html.match(/<h1\\b[^>]*>([\\s\\S]*?)<\\/h1\\s*>/i);
  const title = cleanNewsContent(decodeXml(titleMatch?.[1] || "")) ||
    readArticleMeta(html, ["og:title"]);
  const subtitle = cleanNewsContent(
    readArticleMeta(html, ["description", "og:description"]),
  );
  const cleanedHtml = articleHtml.replace(
    /<(script|style|noscript|nav|aside|footer|form)\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>/gi,
    " ",
  );
  const content = cleanNewsContent(decodeXml(cleanedHtml));

  if (!content) throw new Error("Texto completo indisponível");
  return { title, subtitle, content };
}

const server = createServer(async (request, response) => {
  // Cabeçalhos de Segurança e CORS liberado para requisições do Zenly / Navegador
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Tratamento da verificação prévia do navegador (Preflight OPTIONS)
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== "GET") {
    response.writeHead(405, { Allow: "GET" });
    response.end();
    return;
  }

  if (request.url === "/health") {
    try {
      const news = await getNews();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(
        JSON.stringify({
          status: "ok",
          source: "Revista Oeste",
          updatedAt: cachedAt,
          itemCount: news.length,
        }),
      );
    } catch (error) {
      console.error("Falha ao verificar o serviço de notícias:", error);
      response.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ status: "error", message: "Serviço ou feed indisponível." }));
    }
    return;
  }

  if (request.url === "/api/agronegocio") {
    try {
      const items = await getAgroNews();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ source: "Revista Oeste — Agronegócio", items }));
    } catch (error) {
      console.error("Falha ao carregar notícias de Agronegócio:", error);
      response.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Notícias de Agronegócio indisponíveis." }));
    }
    return;
  }

  if (request.url === "/api/saber") {
    try {
      const items = await getSaberNews();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ source: "Gazeta do Povo — Saber", items }));
    } catch (error) {
      console.error("Falha ao carregar notícias de Saber:", error);
      response.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Notícias de Saber indisponíveis." }));
    }
    return;
  }

  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (requestUrl.pathname === "/api/product-image") {
    const checkoutUrl = requestUrl.searchParams.get("url") || "";
    if (!isAllowedCheckoutUrl(checkoutUrl)) {
      response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Endereço de checkout não permitido." }));
      return;
    }

    try {
      const imageUrl = await getProductImage(checkoutUrl);
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ imageUrl }));
    } catch (error) {
      console.warn("Não foi possível obter a imagem do produto:", error);
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ imageUrl: null }));
    }
    return;
  }

  if (request.url === "/api/usd-brl") {
    try {
      const items = await getUsdBrlHistory();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ source: "Frankfurter — referência diária", items }));
    } catch (error) {
      console.error("Falha ao carregar cotação USD/BRL:", error);
      response.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Cotação indisponível." }));
    }
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
  console.log(`Servidor ativo na porta ${PORT}`);
});
