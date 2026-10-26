import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const parser = new Parser();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Fontes de RSS Mapeadas
const FEEDS = [
  // 1. NA ÍNTEGRA
  {
    urls: ['https://vermelho.org.br/movimentos/feed/'],
    category: 'Na Íntegra',
    source: 'Vermelho - Movimentos'
  },
  // 2. AGRONEGÓCIO
  {
    urls: ['https://www.brasil247.com/tag/agronegocio/feed'],
    category: 'Agronegócio',
    source: 'Brasil 247 - Agro'
  },
  // 3. NO SEU RADAR (Tenta LGBTQI+ do Esquerda Online e, se falhar, usa Sul Global do Brasil 247)
  {
    urls: [
      'https://esquerdaonline.com.br/category/lgbtqi/feed/',
      'https://esquerdaonline.com.br/feed/',
      'https://www.brasil247.com/tag/sul-global/feed'
    ],
    category: 'No Seu Radar',
    source: 'No Seu Radar'
  },
  // 4. GERAL
  {
    urls: ['https://www.brasil247.com/feed'],
    category: 'Geral',
    source: 'Brasil 247'
  },
  {
    urls: ['https://vermelho.org.br/feed/'],
    category: 'Geral',
    source: 'Vermelho'
  },
  {
    urls: ['https://esquerdaonline.com.br/feed/'],
    category: 'Geral',
    source: 'Esquerda Online'
  }
];

async function rewriteWithGemini(title, contentSnippet) {
  if (!process.env.GEMINI_API_KEY) {
    return { title, summary: contentSnippet || title };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Reescreva a seguinte notícia de forma jornalística e neutra. Retorne apenas JSON válido no formato: {"title": "novo título", "summary": "resumo de até 3 frases"}.\n\nTítulo: ${title}\nConteúdo: ${contentSnippet}`;

    const result = await model.generateContent(prompt);
    const cleanedText = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    return { title, summary: contentSnippet || title };
  }
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/news', async (req, res) => {
  try {
    const allArticles = [];

    for (const feedConfig of FEEDS) {
      let feedItems = [];

      // Testa as URLs configuradas para o feed até encontrar uma que funcione
      for (const feedUrl of feedConfig.urls) {
        try {
          const feed = await parser.parseURL(feedUrl);
          if (feed && feed.items && feed.items.length > 0) {
            feedItems = feed.items;
            break; // Encontrou dados, sai do loop de URLs alternativas
          }
        } catch (err) {
          console.error(`Erro ao acessar feed ${feedUrl}:`, err.message);
        }
      }

      const items = feedItems.slice(0, 5);

      for (const item of items) {
        const titleText = (item.title || '').trim();
        
        // Filtro sanitizador: ignora conteúdos vazios ou títulos pequenos/incompletos
        if (titleText.length < 6 || titleText.toLowerCase() === 'agro') {
          continue;
        }

        let imageUrl = null;
        if (item.enclosure?.url) imageUrl = item.enclosure.url;
        else if (item['media:content']?.$.url) imageUrl = item['media:content'].$.url;
        else {
          const imgMatch = (item.content || item['content:encoded'] || '').match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) imageUrl = imgMatch[1];
        }

        const rewritten = await rewriteWithGemini(titleText, item.contentSnippet || item.content || '');

        allArticles.push({
          id: `news-${feedConfig.category}-${Math.random().toString(36).substr(2, 6)}`,
          title: rewritten.title || titleText,
          content: item.contentSnippet || item.content || '',
          summary: rewritten.summary || item.contentSnippet || titleText,
          date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          category: feedConfig.category,
          categories: [feedConfig.category, 'Geral'],
          imageUrl: imageUrl,
          source: feedConfig.source,
          link: item.link
        });
      }
    }

    res.json(allArticles);
  } catch (error) {
    console.error('Erro geral ao processar notícias:', error);
    res.status(500).json({ error: 'Erro ao processar as notícias' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
