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

## Autenticação Supabase

Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY` com os valores públicos do projeto Supabase. A chave
`anon` é destinada ao cliente e deve ser protegida por políticas RLS; nunca
adicione `service_role`, senhas ou outras credenciais administrativas ao frontend.

A tela `/cadastro-login` usa `signInWithPassword` para entrar e `signUp` para
criar contas. Configure a confirmação de e-mail nas opções de autenticação do
Supabase conforme a necessidade do projeto. Para criar perfis isolados por
usuário, execute `supabase/profiles.sql` no editor SQL do projeto. Mantenha o RLS
ativado em todas as tabelas expostas e use políticas baseadas em `auth.uid()`;
não confie em identificadores enviados pelo navegador para autorizar acesso.

