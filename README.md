# React + Tailwind template (Zenith)

Base template used to scaffold new projects.

- Vite + React 18 + TypeScript
- Tailwind CSS

## Serviço local de notícias

O serviço de notícias usa apenas conexões HTTPS e fica limitado a `127.0.0.1`
por padrão. Configure as variáveis de ambiente antes de iniciar:

- `RSS_FEED_URL`: feed RSS/Atom da fonte (opcional; por padrão, usa o feed da Revista Oeste).
- `API_PORT`: porta opcional (padrão `3001`).

Inicie o serviço com `npm run server`. O endpoint `/api/news` conserva as notícias
originais do feed em cache por 12 horas. Para atualizar as notícias no site público,
o serviço precisa estar em uma hospedagem compatível com Node.js e conectado ao site.

