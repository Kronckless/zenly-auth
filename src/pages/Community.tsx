import { FormEvent, useCallback, useEffect, useState } from "react";
import AppNavigation from "@/components/AppNavigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

type CommunityMessage = {
  id: string;
  user_id: string;
  nome_usuario: string;
  conteudo: string;
  created_at: string;
};

export default function Community() {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadMessages = useCallback(async () => {
    if (!supabase) return;

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error: fetchError } = await supabase
      .from("mensagens_comunidade")
      .select("id, user_id, nome_usuario, conteudo, created_at")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError("Não foi possível carregar as mensagens.");
      return;
    }

    setMessages((data ?? []) as CommunityMessage[]);
    setError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("O serviço de mensagens não está configurado.");
      return;
    }

    let active = true;

    const initialize = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (active && user) {
        setUserId(user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();

        if (active) {
          setProfileName(
            profile?.display_name?.trim() ||
              user.user_metadata?.full_name ||
              "Membro",
          );
        }
      }

      if (active) {
        await loadMessages();
      }
    };

    void initialize();

    const channel = supabase
      .channel("mensagens-comunidade-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens_comunidade",
        },
        () => {
          if (active) void loadMessages();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [loadMessages]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = messageText.trim();

    if (!supabase || !userId || !content || sending) return;

    setSending(true);
    setError("");

    const { error: sendError } = await supabase
      .from("mensagens_comunidade")
      .insert({
        user_id: userId,
        nome_usuario: profileName || "Membro",
        conteudo: content,
        created_at: new Date().toISOString(),
      });

    if (sendError) {
      setError("Não foi possível enviar sua mensagem. Tente novamente.");
    } else {
      setMessageText("");
      await loadMessages();
    }

    setSending(false);
  };

  return (
    <main className="min-h-screen bg-background pb-16 sm:pb-0">
      <AppNavigation />
      <section className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Comunidade
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Chat
        </h1>
        <p className="mt-3 text-muted-foreground">
          Converse com a comunidade. As mensagens ficam disponíveis por 7 dias.
        </p>

        <form onSubmit={sendMessage} className="mt-8 space-y-3">
          <Textarea
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder={
              userId ? "Escreva uma mensagem..." : "Entre na sua conta para enviar mensagens"
            }
            aria-label="Sua mensagem"
            maxLength={2000}
            rows={3}
            disabled={!userId || sending}
          />
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              {messageText.length}/2000
            </span>
            <Button
              type="submit"
              disabled={!userId || !messageText.trim() || sending}
            >
              {sending ? "Enviando..." : "Enviar mensagem"}
            </Button>
          </div>
        </form>

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-8 space-y-4" aria-live="polite">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Carregando mensagens...
            </p>
          ) : messages.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
              Ainda não há mensagens dos últimos 7 dias.
            </p>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="text-sm font-semibold">
                    {message.nome_usuario}
                  </h2>
                  <time
                    dateTime={message.created_at}
                    className="text-xs text-muted-foreground"
                  >
                    {new Date(message.created_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {message.conteudo}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}