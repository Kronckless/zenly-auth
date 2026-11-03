import { useEffect, useRef, useState } from "react";
import { Download, FileText, Paperclip, Plus, Sparkles } from "lucide-react";
import AppNavigation from "@/components/AppNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
};

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
  const [error, setError] = useState("");
  const [postText, setPostText] = useState("");
  const [hasCategory, setHasCategory] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function loadMfoFeed() {
      if (isPreviewOrDevelopment()) {
        const now = Date.now();
        setMessages([
          {
            id: "mfo-example-1",
            user_id: "example-user-1",
            nome_usuario: "Marina Costa",
            conteudo:
              "Exemplo de publicação: quais sinais mostram que uma mudança econômica pode afetar o cotidiano? Compartilhe fontes e análises para abrir a conversa.",
            created_at: new Date(now - 1000 * 60 * 18).toISOString(),
            is_super_chat: false,
            dossier_url: null,
            dossier_name: null,
            dossier_size: null,
            isExample: true,
          },
          {
            id: "mfo-example-2",
            user_id: "example-user-2",
            nome_usuario: "Rafael Mendes",
            conteudo:
              "Exemplo de dossiê: panorama de temas em debate, com contexto e perguntas para aprofundar a análise da comunidade.",
            created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
            is_super_chat: false,
            dossier_url: null,
            dossier_name: null,
            dossier_size: null,
            isExample: true,
          },
          {
            id: "mfo-example-3",
            user_id: "example-user-3",
            nome_usuario: "Ana Ribeiro",
            conteudo:
              "Exemplo de publicação: uma boa análise começa por comparar diferentes perspectivas e conferir os dados disponíveis.",
            created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
            is_super_chat: false,
            dossier_url: null,
            dossier_name: null,
            dossier_size: null,
            isExample: true,
          },
        ]);
        setLoading(false);
        return;
      }

      if (!supabase) {
        setError("O serviço da comunidade não está configurado.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        setError("Entre na sua conta para acessar esta área.");
        setLoading(false);
        return;
      }

      const { data, error: messagesError } = await supabase
        .from("mensagens_comunidade")
        .select(
          "id, user_id, nome_usuario, conteudo, created_at, is_super_chat, dossier_url, dossier_name, dossier_size",
        )
        .or("dossier_url.not.is.null,is_super_chat.eq.true")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!active) return;

      if (messagesError) {
        setError("Não foi possível carregar o mural agora.");
      } else {
        setMessages((data ?? []) as CommunityMessage[]);
      }
      setLoading(false);
    }

    void loadMfoFeed();

    return () => {
      active = false;
    };
  }, []);

  function publishPost() {
    const content = postText.trim();
    if (!content && !selectedFile) return;

    const now = new Date().toISOString();
    const newPost: CommunityMessage = {
      id: `local-post-${Date.now()}`,
      user_id: "current-user",
      nome_usuario: "Você",
      conteudo: `${hasCategory ? "#Análise " : ""}${content || "Dossiê compartilhado."}`,
      created_at: now,
      is_super_chat: false,
      dossier_url: null,
      dossier_name: selectedFile?.name ?? null,
      dossier_size: selectedFile?.size ?? null,
    };

    setMessages((current) => [newPost, ...current]);
    setPostText("");
    setSelectedFile(null);
    setHasCategory(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

        {!loading && !error && (
          <Card className="rounded-xl border-border bg-card shadow-sm">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Avatar className="mt-1">
                  <AvatarFallback>VC</AvatarFallback>
                </Avatar>
                <Textarea
                  value={postText}
                  onChange={(event) => setPostText(event.target.value)}
                  placeholder="No que você deseja analisar hoje?"
                  aria-label="Escreva uma publicação"
                  className="min-h-20 resize-y rounded-xl bg-muted/40"
                />
              </div>

              {selectedFile && (
                <div className="ml-11 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="size-4" aria-hidden="true" />
                  <span className="min-w-0 truncate">{selectedFile.name}</span>
                  <span>({formatFileSize(selectedFile.size)})</span>
                </div>
              )}

              {hasCategory && (
                <Badge variant="secondary" className="ml-11">#Análise</Badge>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    aria-label="Anexar dossiê em PDF"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4" aria-hidden="true" />
                    Anexar Dossiê (PDF)
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
                  disabled={!postText.trim() && !selectedFile}
                >
                  Publicar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="py-8 text-sm text-muted-foreground" role="status">
            Verificando seu acesso...
          </p>
        ) : error ? (
          <div className="rounded-xl border border-border p-5">
            <p className="text-sm text-destructive" role="alert">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <p className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
            Ainda não há dossiês ou destaques para exibir.
          </p>
        ) : (
          <section aria-label="Dossiês e destaques da comunidade" className="space-y-4">
            {messages.map((message) => (
              <Card
                key={message.id}
                className={
                  "rounded-xl border-border bg-card shadow-sm"
                }
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

                  {message.dossier_url && (
                    <a
                      href={message.dossier_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="size-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {message.dossier_name || "Dossiê anexado"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {message.dossier_size ? formatFileSize(message.dossier_size) : "Arquivo"}
                        </span>
                      </span>
                      <Download className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    </a>
                  )}

                  {!message.dossier_url && message.dossier_name && (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                        <FileText className="size-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{message.dossier_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {message.dossier_size ? formatFileSize(message.dossier_size) : "Arquivo anexado"}
                        </span>
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}