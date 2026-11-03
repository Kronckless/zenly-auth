import { useEffect, useState } from "react";
import { FileText, Link2, Loader2, Newspaper, Plus, Search, Sparkles, X } from "lucide-react";
import AppNavigation from "@/components/AppNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

type CommunityMessage = {
  id: string;
  user_id: string;
  nome_usuario: string;
  conteudo: string;
  created_at: string;
  is_super_chat: boolean;
  dossier_url: string | null;
  dossier_name: string | null;
  dossier_size: number | null;
  isExample?: boolean;
  isNew?: boolean;
};

type PortalNews = {
  categoria: string;
  titulo: string;
  resumo: string;
  conteudo_completo: string;
  created_at: string;
};

function encodePortalNews(news: PortalNews) {
  return `portal-news:${encodeURIComponent(JSON.stringify(news))}`;
}

function decodePortalNews(value: string | null): PortalNews | null {
  if (!value?.startsWith("portal-news:")) return null;

  try {
    const news = JSON.parse(decodeURIComponent(value.slice("portal-news:".length))) as PortalNews;
    return typeof news.titulo === "string" ? news : null;
  } catch {
    return null;
  }
}

function isPreviewOrDevelopment() {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost") ||
    hostname.includes("stackblitz") ||
    /preview|dev/.test(hostname)
  ) {
    return true;
  }

  if (window.self === window.top) return false;

  return Array.from(window.location.ancestorOrigins ?? []).some((origin) => {
    try {
      const ancestorHostname = new URL(origin).hostname.toLowerCase();
      return ancestorHostname === "zenly.cloud" || ancestorHostname.endsWith(".zenly.cloud");
    } catch {
      return false;
    }
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MFO() {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [hasCategory, setHasCategory] = useState(false);
  const [selectedNews, setSelectedNews] = useState<PortalNews | null>(null);
  const [newsOptions, setNewsOptions] = useState<PortalNews[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsSearch, setNewsSearch] = useState("");
  const [newsPickerOpen, setNewsPickerOpen] = useState(false);
  const [openedNews, setOpenedNews] = useState<PortalNews | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMfoFeed() {
      const isPreview = isPreviewOrDevelopment();

      try {
        if (!supabase) {
          setMessages([]);
          setLoading(false);
          return;
        }

        if (!isPreview) {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (!active) return;

          if (userError || !user) {
            setMessages([]);
            setLoading(false);
            return;
          }
        }

        const { data, error: messagesError } = await supabase
          .from("mensagens_comunidade")
          .select(
            "id, user_id, nome_usuario, conteudo, created_at, is_super_chat, dossier_url, dossier_name, dossier_size",
          )
          .order("created_at", { ascending: false })
          .limit(50);

        if (!active) return;

        setMessages(messagesError ? [] : ((data ?? []) as CommunityMessage[]));
        setLoading(false);
      } catch {
        if (!active) return;
        setMessages([]);
        setLoading(false);
      }
    }

    void loadMfoFeed();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!newsPickerOpen) return;

    let active = true;

    async function loadPortalNews() {
      if (!supabase) {
        setNewsOptions([]);
        return;
      }

      setNewsLoading(true);
      try {
        const { data, error } = await supabase
          .from("panoramas")
          .select("categoria, titulo, resumo, conteudo_completo, created_at")
          .order("created_at", { ascending: false })
          .limit(40);

        if (!active) return;
        setNewsOptions(
          error
            ? []
            : (data ?? []).map((row) => ({
                categoria: row.categoria ?? "",
                titulo: row.titulo ?? "",
                resumo: row.resumo ?? "",
                conteudo_completo: row.conteudo_completo ?? "",
                created_at: row.created_at ?? "",
              })),
        );
      } catch {
        if (active) setNewsOptions([]);
      } finally {
        if (active) setNewsLoading(false);
      }
    }

    void loadPortalNews();
    return () => {
      active = false;
    };
  }, [newsPickerOpen]);

  async function publishPost() {
    const content = postText.trim();
    const previewMode = isPreviewOrDevelopment();
    if (posting || (!content && !selectedNews) || (!supabase && !previewMode)) return;

    setPosting(true);
    let published = false;

    try {
      let user = null;
      if (supabase) {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        user = currentUser;
      }

      const messageContent = `${hasCategory ? "#Análise " : ""}${content || "Notícia vinculada."}`;
      const linkedNewsUrl = selectedNews ? encodePortalNews(selectedNews) : null;

      if (!user && previewMode) {
        setMessages((current) => [
          {
            id: `preview-${Date.now()}`,
            user_id: "preview-user",
            nome_usuario: "Você",
            conteudo: messageContent,
            created_at: new Date().toISOString(),
            is_super_chat: false,
            dossier_url: linkedNewsUrl,
            dossier_name: selectedNews?.titulo ?? null,
            dossier_size: null,
            isExample: true,
            isNew: true,
          },
          ...current,
        ]);
        published = true;
      } else if (user && supabase) {
        const { data, error: publishError } = await supabase
          .from("mensagens_comunidade")
          .insert({
            user_id: user.id,
            nome_usuario:
              user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário",
            conteudo: messageContent,
            is_super_chat: false,
            dossier_url: linkedNewsUrl,
            dossier_name: selectedNews?.titulo ?? null,
            dossier_size: null,
          })
          .select(
            "id, user_id, nome_usuario, conteudo, created_at, is_super_chat, dossier_url, dossier_name, dossier_size",
          )
          .single();

        if (publishError || !data) return;
        setMessages((current) => [{ ...(data as CommunityMessage), isNew: true }, ...current]);
        published = true;
      }
    } catch {
      // Mantém o texto e a notícia vinculada para que a publicação possa ser tentada novamente.
    } finally {
      if (published) {
        setPostText("");
        setSelectedNews(null);
        setHasCategory(false);
      }
      setPosting(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
      <AppNavigation />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <Card className="rounded-xl border-border bg-card shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <header>
              <Badge variant="secondary" className="mb-3 gap-1.5">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Modo Formador de Opinião
              </Badge>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Mural MFO
              </h1>
              <p className="mt-2 text-muted-foreground">
                Dossiês compartilhados e destaques da comunidade.
              </p>
            </header>
          </CardContent>
        </Card>

        {(
          <Card className="rounded-xl border-border bg-card shadow-sm">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Avatar className="mt-1">
                  <AvatarFallback>VC</AvatarFallback>
                </Avatar>
                <Textarea
                  value={postText}
                  onChange={(event) => setPostText(event.target.value)}
                  placeholder="Qual é a sua opinião ou pauta hoje?"
                  aria-label="Escreva uma publicação"
                  className="min-h-20 resize-y rounded-xl bg-muted/40"
                />
              </div>

              {selectedNews && (
                <div className="relative ml-11 flex items-center gap-3 rounded-xl border border-border bg-card p-3 pr-11 shadow-sm">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-primary">
                    <Newspaper className="size-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold leading-snug">
                      {selectedNews.titulo}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedNews.categoria || "Notícia do portal"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 size-7"
                    aria-label="Remover notícia vinculada"
                    onClick={() => setSelectedNews(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}

              {hasCategory && (
                <Badge variant="secondary" className="ml-11">#Análise</Badge>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewsPickerOpen(true)}
                  >
                    <Link2 className="size-4" aria-hidden="true" />
                    Vincular Notícia do Portal
                  </Button>
                  <Button
                    type="button"
                    variant={hasCategory ? "secondary" : "outline"}
                    size="sm"
                    aria-pressed={hasCategory}
                    onClick={() => setHasCategory((current) => !current)}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Adicionar Categoria (#)
                  </Button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={publishPost}
                  disabled={posting || (!postText.trim() && !selectedNews)}
                >
                  {posting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {posting ? "Publicando..." : "Publicar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="py-8 text-sm text-muted-foreground" role="status">
            Verificando seu acesso...
          </p>
        ) : messages.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhuma opinião publicada ainda. Seja o primeiro a compartilhar!
          </p>
        ) : (
          <section aria-label="Dossiês e destaques da comunidade" className="space-y-4">
            {messages.map((message) => {
              const linkedNews = decodePortalNews(message.dossier_url);
              return (
              <Card
                key={message.id}
                className={`rounded-xl border-border bg-card shadow-sm ${
                  message.isNew ? "animate-mfo-post-enter" : ""
                }`}
              >
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{message.nome_usuario}</span>
                      {message.isExample && (
                        <Badge variant="outline">Exemplo</Badge>
                      )}
                      {message.is_super_chat && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="size-3" aria-hidden="true" />
                          Super Chat
                        </Badge>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground" dateTime={message.created_at}>
                      {new Date(message.created_at).toLocaleString("pt-BR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>

                  {message.conteudo && (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.conteudo}
                    </p>
                  )}

                  {linkedNews && (
                    <button
                      type="button"
                      onClick={() => setOpenedNews(linkedNews)}
                      className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/40 p-2 text-left transition-colors hover:bg-muted"
                      aria-label={`Abrir notícia: ${linkedNews.titulo}`}
                    >
                      <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                        <Newspaper className="size-7" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block line-clamp-2 text-sm font-semibold">
                          {linkedNews.titulo}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {linkedNews.categoria || "Notícia do portal"} · Ler notícia completa
                        </span>
                      </span>
                      <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </button>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </section>
        )}

        <Dialog open={newsPickerOpen} onOpenChange={setNewsPickerOpen}>
          <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Vincular notícia do portal</DialogTitle>
              <DialogDescription>
                Pesquise e selecione uma notícia para incluir na sua publicação.
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={newsSearch}
                onChange={(event) => setNewsSearch(event.target.value)}
                placeholder="Buscar por manchete ou categoria..."
                aria-label="Buscar notícias do portal"
                className="pl-9"
              />
            </div>
            <div className="space-y-2">
              {newsLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground" role="status">
                  Carregando notícias...
                </p>
              ) : newsOptions.filter((news) =>
                  `${news.titulo} ${news.categoria} ${news.resumo}`
                    .toLocaleLowerCase("pt-BR")
                    .includes(newsSearch.trim().toLocaleLowerCase("pt-BR")),
                ).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma notícia disponível para selecionar.
                </p>
              ) : (
                newsOptions
                  .filter((news) =>
                    `${news.titulo} ${news.categoria} ${news.resumo}`
                      .toLocaleLowerCase("pt-BR")
                      .includes(newsSearch.trim().toLocaleLowerCase("pt-BR")),
                  )
                  .map((news, index) => (
                    <button
                      key={`${news.created_at}-${index}`}
                      type="button"
                      onClick={() => {
                        setSelectedNews(news);
                        setNewsPickerOpen(false);
                        setNewsSearch("");
                      }}
                      className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
                    >
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                        <Newspaper className="size-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-muted-foreground">
                          {news.categoria || "Notícia"}
                        </span>
                        <span className="mt-1 block text-sm font-semibold leading-snug">
                          {news.titulo}
                        </span>
                        {news.resumo && (
                          <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">
                            {news.resumo}
                          </span>
                        )}
                      </span>
                    </button>
                  ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openedNews !== null} onOpenChange={(open) => !open && setOpenedNews(null)}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
            {openedNews && (
              <>
                <DialogHeader>
                  <Badge variant="secondary" className="mb-2 w-fit">
                    {openedNews.categoria || "Notícia"}
                  </Badge>
                  <DialogTitle className="text-xl leading-snug sm:text-2xl">
                    {openedNews.titulo}
                  </DialogTitle>
                  <DialogDescription>{openedNews.resumo}</DialogDescription>
                </DialogHeader>
                <article className="whitespace-pre-wrap text-sm leading-7 text-foreground sm:text-base">
                  {openedNews.conteudo_completo || openedNews.resumo}
                </article>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}