import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const parser = new Parser();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
  // 3. NO SEU RADAR
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

// Função sanitizadora de texto RSS
function cleanRawText(text) {
  if (!text) return '';
  return text
    .replace(/O post .* apareceu primeiro em .*/gi, '') // Remove assinatura de RSS
    .replace(/\[\.\.\.\]/g, '')                         // Remove [...]
    .replace(/<[^>]*>?/gm, '')                          // Remove tags HTML soltas
    .trim();
}

async function rewriteWithGemini(title, contentSnippet) {
  const cleanSnippet = cleanRawText(contentSnippet);

  if (!process.env.GEMINI_API_KEY) {
    return { 
      title, 
      summary: cleanSnippet || title,
      fullContent: cleanSnippet || title
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `Você é um jornalista profissional. Reescreva a seguinte matéria de forma completa, fluida, clara e em tom jornalístico neutro e elegante.
Elimine qualquer menção a feeds, blogs ou links.
Retorne EXATAMENTE um JSON válido no seguinte formato:
{
  "title": "Um título envolvente e bem redigido",
  "summary": "Um resumo de 2 frases impactantes para os cards da home",
  "fullContent": "A matéria reescrita e expandida com 2 a 3 parágrafos bem elaborados e fáceis de ler, sem trechos cortados."
}

Título Original: ${title}
Rascunho/Trecho: ${cleanSnippet}`;

    const result = await model.generateContent(prompt);
    const cleanedText = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Erro no Gemini:', error.message);
    return { 
      title: title, 
      summary: cleanSnippet || title,
      fullContent: cleanSnippet || title
    };
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

      for (const feedUrl of feedConfig.urls) {
        try {
          const feed = await parser.parseURL(feedUrl);
          if (feed && feed.items && feed.items.length > 0) {
            feedItems = feed.items;
            break;
          }
        } catch (err) {
          console.error(`Erro ao acessar feed ${feedUrl}:`, err.message);
        }
      }

      const items = feedItems.slice(0, 5);

      for (const item of items) {
        const titleText = (item.title || '').trim();
        
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

        const rawContent = item['content:encoded'] || item.content || item.contentSnippet || '';
        const rewritten = await rewriteWithGemini(titleText, rawContent);

        allArticles.push({
          id: `news-${feedConfig.category}-${Math.random().toString(36).substr(2, 6)}`,
          title: rewritten.title || titleText,
          summary: rewritten.summary || cleanRawText(rawContent),
          content: rewritten.fullContent || cleanRawText(rawContent),
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
