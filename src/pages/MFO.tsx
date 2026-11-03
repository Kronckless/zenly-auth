import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileText, LockKeyhole, Sparkles } from "lucide-react";
import AppNavigation from "@/components/AppNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MFO() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMfoFeed() {
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

  return (
    <main className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
      <AppNavigation />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
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
                  message.is_super_chat
                    ? "border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-background"
                    : "border-border"
                }
              >
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{message.nome_usuario}</span>
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
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}