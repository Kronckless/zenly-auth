# React + Tailwind template (Zenith)

Base template used to scaffold new projects.

- Vite + React 18 + TypeScript
- Tailwind CSS

## Serviço local de notícias

O serviço de notícias usa apenas conexões HTTPS e fica limitado a `127.0.0.1`
por padrão. Configure as variáveis de ambiente antes de iniciar:

- `RSS_FEED_URL`: feed RSS/Atom da fonte (opcional; por padrão, usa o feed da Revista Oeste).
- `OPENAI_API_KEY`: chave privada da API da OpenAI. Mantenha-a somente no servidor.
- `OPENAI_MODEL`: modelo opcional (padrão `gpt-4o-mini`).
- `API_PORT`: porta opcional (padrão `3001`).

Configure `OPENAI_API_KEY` no ambiente do servidor e inicie com `npm run server`.
O endpoint local `/api/news` conserva os resultados em cache por 12 horas. Sem
uma chave configurada, os textos originais
do feed são devolvidos sem serem apresentados como reescritos. O servidor ainda
precisa ser conectado à página e implantado atrás de HTTPS para uso público.

