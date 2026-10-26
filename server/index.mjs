import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json());

const parser = new Parser();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Portais de Notícias (Viés de Esquerda / Progressista)
const RSS_FEEDS = [
  { url: 'https://www.brasil247.com/feed', source: 'Brasil 247', defaultCategory: 'Geral' },
  { url: 'https://vermelho.org.br/feed/', source: 'Vermelho', defaultCategory: 'Agronegócio' },
  { url: 'https://esquerdaonline.com.br/feed/', source: 'Esquerda Online', defaultCategory: 'Geral' }
];

let cachedNews = [];
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function rewriteWithGemini(title, content) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { title: cleanText(title), body: cleanText(content) };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
Você é um jornalista sênior especialista em reescrita de notícias para um portal de notícias progressista/de esquerda no Brasil.
Reescreva a notícia a seguir de forma totalmente autoral, atraente, factual e engajadora.

REGRAS OBRIGATÓRIAS:
1. Mantenha os fatos principais, nomes e dados com total precisão.
2. Adote um tom jornalístico sério, alinhado com pautas sociais, trabalhistas e progressistas.
3. REMOVA completamente qualquer menção ao veículo original, nomes de colunistas ou propagandas.
4. NÃO inclua nenhum link externo ou URL.
5. Responda ESTRITAMENTE em formato JSON válido com as chaves "title" e "body".

Título original: ${title}
Conteúdo original: ${content}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: cleanText(parsed.title || title),
        body: cleanText(parsed.body || content)
      };
    }
    return { title: cleanText(title), body: cleanText(content) };
  } catch (error) {
    console.error('Erro ao reescrever com Gemini:', error.message);
    return { title: cleanText(title), body: cleanText(content) };
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/news', async (req, res) => {
  const now = Date.now();

  if (cachedNews.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
    return res.json(cachedNews);
  }

  try {
    let allItems = [];

    for (const feedConfig of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedConfig.url);
        const items = (feed.items || []).slice(0, 5).map(item => ({
          title: item.title,
          content: item.contentSnippet || item.content || item.summary || '',
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          source: feedConfig.source,
          category: feedConfig.defaultCategory,
          imageUrl: item.enclosure?.url || item['media:content']?.$.url || null
        }));
        allItems.push(...items);
      } catch (err) {
        console.error(`Erro ao buscar feed de ${feedConfig.source}:`, err.message);
      }
    }

    const processedNews = await Promise.all(
      allItems.map(async (item, index) => {
        const rewritten = await rewriteWithGemini(item.title, item.content);
        return {
          id: `news-${index}-${Date.now()}`,
          title: rewritten.title,
          content: rewritten.body,
          summary: rewritten.body.substring(0, 160) + '...',
          date: item.pubDate,
          category: item.category,
          categories: [item.category, 'Geral'],
          imageUrl: item.imageUrl
        };
      })
    );

    if (processedNews.length > 0) {
      cachedNews = processedNews;
      lastFetchTime = now;
    }

    res.json(cachedNews);
  } catch (error) {
    console.error('Erro no processamento das notícias:', error);
    res.status(500).json({ error: 'Erro ao carregar feed de notícias.' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
