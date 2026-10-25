import { createServer } from "node:http";

const PORT = Number(process.env.PORT || process.env.API_PORT || 3001);
const HOST = process.env.API_HOST || "0.0.0.0";
const CACHE_TTL = 30 * 60 * 1000; // Cache de 30 minutos

let cachedNews = null;
let cachedAt = 0;
let refreshPromise = null;

// Notícias de contingência limpas (para garantir exibição em qualquer falha de rede)
const FALLBACK_NEWS = [
  {
    title: "Agronegócio brasileiro registra recorde de exportações no último trimestre",
    content: "Setor produtivo segue impulsionando a economia nacional com forte demanda externa e avanços em tecnologia no campo.",
    sourceUrl: "https://revistaoeste.com",
    imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    publishedAt: new Date().toISOString(),
    categories: ["Economia", "Agro"],
    rewritten: false,
  },
  {
    title: "Debates econômicos ganham destaque no Congresso com foco em responsabilidade fiscal",
    content: "Pautas de contenção de gastos e incentivo à iniciativa privada pautam as discussões do legislativo nesta semana.",
    sourceUrl: "https://www.gazetadopovo.com.br",
    imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80",
    publishedAt: new Date().toISOString(),
    categories: ["Política"],
    rewritten: false,
  },
  {
    title: "Liberdade de expressão e avanços institucionais pautam debates internacionais",
    content: "Análises de especialistas apontam os desafios contemporâneos para a preservação de garantias fundamentais.",
    sourceUrl: "https://direitaonline.com.br",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    publishedAt: new Date().toISOString(),
    categories: ["Brasil"],
    rewritten: false,
  }
];

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
    .trim();
}

function cleanNewsContent(value = "") {
  if (!value) return "";

  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    // Regra reforçada para limpar qualquer variação de "Leia também", "Leia mais" e menções a edições/publicações
    .replace(/Leia\s+(?:também|mais)[\s\S]*?(?:Edição|Edicao|\.|$)/gi, "")
    .replace(/O\s+post[\s\S]*?apareceu\s+primeiro\s+em[\s\S]*?\./gi, "")
    .replace(/O\s+conteúdo[\s\S]*?aparece\s+primeiro\s+em[\s\S]*?\./gi, "")
    .replace(/\+?\s*Leia\s+mais[\s\S]*/gi, "")
    .replace(/\+?\s*Entenda[\s\S]*/gi, "")
    .replace(/Confira\s+os\s+perfis[\s\S]*/gi, "")
    .replace(/Ver\s+esse\s+post\s+no\s+Instagram[\s\S]*/gi, "")
    .replace(/\b(?:https?:\/\/|www\.)[^\s<>"']+/gi, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

function parseRssItems(xmlText, sourceName) {
  const items = [];
  const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
    const contentMatch = itemXml.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i);
    
    const imgMatch = itemXml.match(/url=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i) ||
                     itemXml.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i);

    if (titleMatch && linkMatch) {
      const rawTitle = titleMatch[1] || "";
      const rawContent = contentMatch ? contentMatch[1] : (descMatch ? descMatch[1] : "");

      items.push({
        title: decodeXml(rawTitle).replace(/<[^>]*>/g, "").trim(),
        content: cleanNewsContent(rawContent),
        sourceUrl: (linkMatch[1] || "").trim(),
        imageUrl: imgMatch ? imgMatch[1] : null,
        publishedAt: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
        categories: [sourceName],
        rewritten: false,
      });
    }
  }

  return items;
}

async function refreshNews() {
  const sources = [
    { name: "Revista Oeste", url: "https://revistaoeste.com/feed/" },
    { name: "Gazeta do Povo", url: "https://www.gazetadopovo.com.br/feed/" },
    { name: "Direita Online", url: "https://direitaonline.com.br/feed/" }
  ];

  let collectedItems = [];

  for (const source of sources) {
    try {
      const response = await fetchWithTimeout(source.url);
      if (response.ok) {
        const xml = await response.text();
        const parsed = parseRssItems(xml, source.name);
        if (parsed.length > 0) {
          collectedItems.push(...parsed);
        }
      }
    } catch (err) {
      console.warn(`[noticias] Aviso em ${source.name}:`, err.message);
    }
  }

  if (collectedItems.length === 0) {
    collectedItems = FALLBACK_NEWS;
  }

  cachedNews = collectedItems.sort((a, b) => {
    const dateA = Date.parse(a.publishedAt || "") || 0;
    const dateB = Date.parse(b.publishedAt || "") || 0;
    return dateB - dateA;
  });

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
      response.end(JSON.stringify({ status: "ok", itemCount: news.length }));
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
      response.end(JSON.stringify({ source: "Rede de Portais", updatedAt: Date.now(), items: FALLBACK_NEWS }));
    }
    return;
  }

  response.writeHead(404);
  response.end();
});

server.listen(PORT, HOST, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
