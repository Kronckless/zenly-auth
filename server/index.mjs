import { createServer } from "node:http";

const PORT = Number(process.env.PORT || process.env.API_PORT || 3001);
const HOST = process.env.API_HOST || "0.0.0.0";
const CACHE_TTL = 12 * 60 * 60 * 1000;

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
    .replace(/<[^>]*>/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function cleanNewsContent(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\b(?:https?:\/\/|www\.)[^\s<>"']+/gi, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
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

async function refreshNews() {
  const rssUrl = encodeURIComponent("https://revistaoeste.com/feed/");
  const apiProxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;

  const response = await fetchWithTimeout(apiProxyUrl, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error("Falha ao carregar feed via agregador");

  const data = await response.json();
  
  if (data.status !== "ok" || !data.items) {
    throw new Error("Formato de feed inválido");
  }

  cachedNews = data.items.map((item) => ({
    title: decodeXml(item.title || ""),
    content: cleanNewsContent(item.content || item.description || ""),
    sourceUrl: item.link,
    imageUrl: item.thumbnail || item.enclosure?.link || null,
    publishedAt: item.pubDate,
    categories: item.categories || [],
    rewritten: false,
  })).sort((a, b) => {
    const dateA = Date.parse(a.publishedAt || "") || 0;
    const dateB = Date.parse(b.publishedAt || "") || 0;
    return dateB - dateA;
  });

  cachedAt = Date.now();
  console.info(`[notícias] Sucesso: ${cachedNews.length} matérias carregadas`);
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
  cachedSaberNews = [];
  cachedSaberAt = Date.now();
  return cachedSaberNews;
}

async function getAgroNews() {
  if (cachedAgroNews && Date.now() - cachedAgroAt < CACHE_TTL) {
    return cachedAgroNews;
  }
  cachedAgroNews = [];
  cachedAgroAt = Date.now();
  return cachedAgroNews;
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

const server = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

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
      console.error("Falha ao verificar o serviço:", error);
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ status: "ok", message: "Serviço ativo com fallback." }));
    }
    return;
  }

  if (request.url === "/api/news") {
    try {
      const news = await getNews();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ source: "Revista Oeste", updatedAt: cachedAt, items: news }));
    } catch (error) {
      console.error("Erro ao carregar notícias:", error);
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ source: "Revista Oeste", updatedAt: Date.now(), items: [] }));
    }
    return;
  }

  response.writeHead(404);
  response.end();
});

server.listen(PORT, HOST, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
