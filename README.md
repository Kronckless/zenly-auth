# React + Tailwind template (Zenith)

Base template used to scaffold new projects.

- Vite + React 18 + TypeScript
- Tailwind CSS

## Serviço local de notícias

O serviço de notícias usa apenas conexões HTTPS e fica limitado a `127.0.0.1`
por padrão. Configure as variáveis de ambiente antes de iniciar:

- `RSS_FEED_URL`: feed RSS/Atom da fonte.
- `REWRITE_API_URL`: endpoint HTTPS compatível que recebe `title`, `content` e `source_url`, e retorna `title` e `content`.
- `REWRITE_API_KEY`: chave privada do serviço de reescrita. Mantenha-a somente no servidor.
- `API_PORT`: porta opcional (padrão `3001`).

Inicie com `npm run server`. O endpoint local `/api/news` conserva os resultados
em cache por 12 horas. Sem serviço de reescrita configurado, os textos originais
do feed são devolvidos sem serem apresentados como reescritos. O servidor ainda
precisa ser conectado à página e implantado atrás de HTTPS para uso público.

