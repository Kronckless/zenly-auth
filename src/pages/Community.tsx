import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import AppNavigation from "@/components/AppNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LockKeyhole, MessageSquare, Send, Smile, Sparkles, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

type CommunityMessage = {
  id: string;
  user_id: string;
  nome_usuario: string;
  conteudo: string;
  created_at: string;
  is_super_chat: boolean;
};

export default function Community() {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [hasMfo, setHasMfo] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [superChatEnabled, setSuperChatEnabled] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const quickEmojis = ["😀", "😂", "❤️", "👍", "🎉", "🙏"];

  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) {
      messageList.scrollTo({
        top: messageList.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  const loadMessages = useCallback(async () => {
    if (!supabase) return;

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error: fetchError } = await supabase
      .from("mensagens_comunidade")
      .select("id, user_id, nome_usuario, conteudo, created_at, is_super_chat")
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
          .select("display_name, has_mfo")
          .eq("id", user.id)
          .maybeSingle();

        if (active) {
          setProfileName(
            profile?.display_name?.trim() ||
              user.user_metadata?.full_name ||
              "Membro",
          );
          setHasMfo(profile?.has_mfo === true);
        }
      } else if (active) {
        setHasMfo(false);
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

    if (!content || sending) return;

    if (!supabase) {
      setError("O serviço de mensagens não está configurado.");
      return;
    }

    if (!userId) {
      setError("Entre na sua conta para enviar mensagens.");
      return;
    }

    setSending(true);
    setError("");

    const { error: sendError } = await supabase
      .from("mensagens_comunidade")
      .insert({
        user_id: userId,
        nome_usuario: profileName || "Membro",
        conteudo: content,
        is_super_chat: hasMfo && superChatEnabled,
        created_at: new Date().toISOString(),
      });

    if (sendError) {
      setError("Não foi possível enviar sua mensagem. Tente novamente.");
    } else {
      setMessageText("");
      setSuperChatEnabled(false);
      await loadMessages();
    }

    setSending(false);
  };

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppNavigation />
      <section className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col border-x border-border bg-muted/30 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3 sm:px-6">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <UsersRound className="size-5" aria-hidden="true" />
          </div>

        </header>

        <div
          ref={messageListRef}
          aria-live="polite"
          className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6"
        >
          {loading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Carregando mensagens...
            </p>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-center">
              <MessageSquare className="size-6 text-muted-foreground" aria-hidden="true" />

            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage = message.user_id === userId;

                return (
                  <article
                    key={message.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2 shadow-sm sm:max-w-[75%] ${
                        message.is_super_chat
                          ? "border-2 border-primary/60 bg-gradient-to-br from-primary/15 to-background text-foreground"
                          : isOwnMessage
                            ? "rounded-br-md bg-primary/15 text-foreground"
                            : "rounded-bl-md border border-border bg-card text-card-foreground"
                      }`}
                    >
                      <h2 className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-primary">
                        <span>{message.nome_usuario}</span>
                        {isOwnMessage && hasMfo && (
                          <Badge
                            variant="secondary"
                            className="h-5 gap-1 px-1.5 text-[10px] font-medium"
                          >
                            <Sparkles aria-hidden="true" />
                            Formador de Opinião
                          </Badge>
                        )}
                      </h2>
                      <div className="flex items-end gap-3">
                        <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {message.conteudo}
                        </p>
                        <time
                          dateTime={message.created_at}
                          className="shrink-0 pb-0.5 text-[10px] text-muted-foreground"
                        >
                          {new Date(message.created_at).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </time>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="shrink-0 px-4 pb-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <form
          onSubmit={sendMessage}
          className="relative flex shrink-0 items-center gap-2 border-t border-border bg-background px-3 py-3 sm:px-5"
        >
          <Button
            type="button"
            variant={superChatEnabled ? "default" : "outline"}
            aria-pressed={hasMfo ? superChatEnabled : undefined}
            aria-label={
              hasMfo
                ? "Ativar ou desativar Super Chat"
                : "Super Chat exclusivo do Modo Formador de Opinião"
            }
            onClick={() => {
              if (!hasMfo) {
                setUpgradeDialogOpen(true);
                return;
              }
              setSuperChatEnabled((enabled) => !enabled);
            }}
            disabled={sending}
            className="shrink-0 gap-1.5 rounded-full px-3"
          >
            {hasMfo ? (
              <Sparkles className="size-4" aria-hidden="true" />
            ) : (
              <LockKeyhole className="size-4" aria-hidden="true" />
            )}
            <span className="hidden text-xs sm:inline">Super Chat</span>
          </Button>
          {emojiPickerOpen && (
            <div
              role="group"
              aria-label="Escolher emoji"
              className="absolute bottom-full left-3 mb-2 flex gap-1 rounded-xl border border-border bg-background p-2 shadow-lg sm:left-5"
            >
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`Inserir ${emoji}`}
                  className="rounded-md p-1.5 text-lg transition-colors hover:bg-muted"
                  onClick={() => {
                    setMessageText((current) => `${current}${emoji}`);
                    setEmojiPickerOpen(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={emojiPickerOpen ? "Fechar emojis" : "Abrir emojis"}
            aria-expanded={emojiPickerOpen}
            disabled={!userId || sending}
            onClick={() => setEmojiPickerOpen((open) => !open)}
            className="shrink-0 rounded-full text-muted-foreground"
          >
            <Smile className="size-5" />
          </Button>
          <Input
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Mensagem"
            aria-label="Sua mensagem"
            maxLength={2000}
            disabled={sending}
            className="h-11 rounded-full bg-muted/50 px-4"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Enviar mensagem"
            disabled={!messageText.trim() || sending}
            className="size-10 shrink-0 rounded-full"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </section>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Super Chat exclusivo</DialogTitle>
            <DialogDescription>
              O Super Chat é exclusivo do Modo Formador de Opinião. Faça o
              upgrade para destacar suas mensagens no chat.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setUpgradeDialogOpen(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}