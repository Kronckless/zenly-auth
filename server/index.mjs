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

async function fetchFeedViaProxy(targetRssUrl, sourceName) {
  const apiProxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetRssUrl)}`;
  const response = await fetchWithTimeout(apiProxyUrl, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error(`Falha ao carregar ${sourceName}`);

  const data = await response.json();
  if (data.status !== "ok" || !data.items) {
    throw new Error(`Formato inválido para ${sourceName}`);
  }

  return data.items.map((item) => ({
    title: decodeXml(item.title || ""),
    content: cleanNewsContent(item.content || item.description || ""),
    sourceUrl: item.link,
    imageUrl: item.thumbnail || item.enclosure?.link || null,
    publishedAt: item.pubDate,
    categories: item.categories || [sourceName],
    rewritten: false,
  }));
}

async function refreshNews() {
  // Lista de fontes autorizadas (Revista Oeste, Gazeta do Povo e Direita Online)
  const sources = [
    { name: "Revista Oeste", url: "https://revistaoeste.com/feed/" },
    { name: "Gazeta do Povo", url: "https://www.gazetadopovo.com.br/feed/" },
    { name: "Direita Online", url: "https://direitaonline.com.br/feed/" },
  ];

  let allArticles = [];

  // Tenta recolher notícias de todas as fontes disponíveis de forma segura
  for (const source of sources) {
    try {
      const items = await fetchFeedViaProxy(source.url, source.name);
      allArticles.push(...items);
    } catch (error) {
      console.warn(`[notícias] Aviso: Não foi possível carregar de ${source.name}:`, error.message);
    }
  }

  // Se por algum motivo todas falharem, garante um array limpo
  if (allArticles.length === 0) {
    throw new Error("Nenhuma notícia disponível em nenhuma das fontes no momento.");
  }

  // Ordena da mais recente para a mais antiga
  cachedNews = allArticles.sort((a, b) => {
    const dateA = Date.parse(a.publishedAt || "") || 0;
    const dateB = Date.parse(b.publishedAt || "") || 0;
    return dateB - dateA;
  });

  cachedAt = Date.now();
  console.info(`[notícias] Sincronização concluída: ${cachedNews.length} matérias carregadas.`);
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
          source: "Multi-Portais (Oeste, Gazeta, Direita Online)",
          updatedAt: cachedAt,
          itemCount: news.length,
        }),
      );
    } catch {
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ status: "ok", message: "Serviço ativo." }));
    }
    return;
  }

  if (request.url === "/api/news") {
    try {
      const news = await getNews();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ source: "Rede de Portais", updatedAt: cachedAt, items: news }));
    } catch (error) {
      console.error("Erro ao carregar notícias:", error);
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ source: "Rede de Portais", updatedAt: Date.now(), items: [] }));
    }
    return;
  }

  response.writeHead(404);
  response.end();
});

server.listen(PORT, HOST, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
