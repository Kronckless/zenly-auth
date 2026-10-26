import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const parser = new Parser();

// Permite requisições de qualquer origem (CORS)
app.use(cors());
app.use(express.json());

// Inicializa a API do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Lista de fontes RSS categorizadas
const FEEDS = [
  // 1. Feed para a seção "NA ÍNTEGRA"
  {
    url: 'https://vermelho.org.br/movimentos/feed/',
    category: 'Na Íntegra',
    source: 'Vermelho - Movimentos'
  },
  // 2. Feed para a seção "AGRONEGÓCIO"
  {
    url: 'https://www.brasil247.com/tag/agronegocio/feed',
    category: 'Agronegócio',
    source: 'Brasil 247 - Agro'
  },
  // 3. Feeds Gerais
  {
    url: 'https://www.brasil247.com/feed',
    category: 'Geral',
    source: 'Brasil 247'
  },
  {
    url: 'https://vermelho.org.br/feed/',
    category: 'Geral',
    source: 'Vermelho'
  },
  {
    url: 'https://esquerdaonline.com.br/feed/',
    category: 'Geral',
    source: 'Esquerda Online'
  }
];

// Função para reescrever/resumir o artigo usando o Gemini
async function rewriteWithGemini(title, contentSnippet) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      title: title,
      summary: contentSnippet || title
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Reescreva a seguinte notícia de forma jornalística, concisa e neutra. Retorne apenas um JSON válido no formato: {"title": "novo título", "summary": "resumo de até 3 frases"}.\n\nTítulo: ${title}\nConteúdo: ${contentSnippet}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Limpa a resposta para garantir que seja um JSON válido
    const cleanedText = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Erro ao reescrever com Gemini:', error.message);
    return {
      title: title,
      summary: contentSnippet || title
    };
  }
}

// Endpoint de verificação de saúde do servidor
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Endpoint principal das notícias
app.get('/api/news', async (req, res) => {
  try {
    const allArticles = [];

    for (const feedConfig of FEEDS) {
      try {
        const feed = await parser.parseURL(feedConfig.url);
        
        // Pega até 5 itens por feed
        const items = feed.items.slice(0, 5);

        for (const item of items) {
          // Extrai imagem do feed se disponível
          let imageUrl = null;
          if (item.enclosure && item.enclosure.url) {
            imageUrl = item.enclosure.url;
          } else if (item['media:content'] && item['media:content'].$) {
            imageUrl = item['media:content'].$.url;
          } else {
            // Tenta encontrar tag de imagem dentro do HTML do conteúdo
            const imgMatch = (item.content || item['content:encoded'] || '').match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
              imageUrl = imgMatch[1];
            }
          }

          // Reescreve a notícia com o Gemini
          const rewritten = await rewriteWithGemini(item.title, item.contentSnippet || item.content || '');

          allArticles.push({
            id: `news-${feedConfig.category}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: rewritten.title || item.title,
            content: item.contentSnippet || item.content || '',
            summary: rewritten.summary || item.contentSnippet || item.title,
            date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            category: feedConfig.category,
            categories: [feedConfig.category, 'Geral'],
            imageUrl: imageUrl,
            source: feedConfig.source,
            link: item.link
          });
        }
      } catch (feedError) {
        console.error(`Erro ao buscar o feed ${feedConfig.url}:`, feedError.message);
      }
    }

    res.json(allArticles);
  } catch (error) {
    console.error('Erro ao processar as notícias:', error);
    res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
});

// Porta do servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
