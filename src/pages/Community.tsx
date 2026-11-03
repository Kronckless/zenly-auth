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
import {
  Download,
  FileText,
  LockKeyhole,
  MessageSquare,
  Paperclip,
  Send,
  Smile,
  Sparkles,
  UsersRound,
} from "lucide-react";
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

export default function Community() {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [hasMfo, setHasMfo] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [superChatEnabled, setSuperChatEnabled] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      .select("id, user_id, nome_usuario, conteudo, created_at, is_super_chat, dossier_url, dossier_name, dossier_size")
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

    if ((!content && !selectedFile) || sending) return;

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

    let dossierUrl: string | null = null;
    let dossierName: string | null = null;
    let dossierSize: number | null = null;
    let uploadedPath: string | null = null;

    if (selectedFile) {
      if (!hasMfo) {
        setError("O envio de Dossiês é exclusivo do Modo Formador de Opinião.");
        setSending(false);
        return;
      }

      if (selectedFile.size > 20 * 1024 * 1024) {
        setError("O arquivo deve ter no máximo 20 MB.");
        setSending(false);
        return;
      }

      const safeName = selectedFile.name.replace(/[\\/]/g, "_");
      uploadedPath = `${userId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("dossiers")
        .upload(uploadedPath, selectedFile, {
          contentType: selectedFile.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        setError("Não foi possível enviar o arquivo. Tente novamente.");
        setSending(false);
        return;
      }

      dossierUrl = supabase.storage.from("dossiers").getPublicUrl(uploadedPath).data.publicUrl;
      dossierName = selectedFile.name;
      dossierSize = selectedFile.size;
    }

    const { error: sendError } = await supabase
      .from("mensagens_comunidade")
      .insert({
        user_id: userId,
        nome_usuario: profileName || "Membro",
        conteudo: content,
        is_super_chat: hasMfo && superChatEnabled,
        dossier_url: dossierUrl,
        dossier_name: dossierName,
        dossier_size: dossierSize,
        created_at: new Date().toISOString(),
      });

    if (sendError) {
      if (uploadedPath) {
        await supabase.storage.from("dossiers").remove([uploadedPath]);
      }
      setError("Não foi possível enviar sua mensagem. Tente novamente.");
    } else {
      setMessageText("");
      setSelectedFile(null);
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
                      {message.dossier_url && (
                        <a
                          href={message.dossier_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mb-2 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FileText className="size-5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {message.dossier_name || "Dossiê anexado"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {message.dossier_size
                                ? formatFileSize(message.dossier_size)
                                : "Arquivo"}
                            </span>
                          </span>
                          <Download className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        </a>
                      )}
                      <div className="flex items-end gap-3">
                        {message.conteudo && (
                          <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {message.conteudo}
                          </p>
                        )}
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.odt,.rtf,.txt,.xls,.xlsx,.ppt,.pptx,image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              if (file && file.size > 20 * 1024 * 1024) {
                setError("O arquivo deve ter no máximo 20 MB.");
                setSelectedFile(null);
              } else {
                setError("");
                setSelectedFile(file);
              }
              event.currentTarget.value = "";
            }}
          />
          <Button
            type="button"
            variant={hasMfo ? "ghost" : "outline"}
            size="icon"
            aria-label={hasMfo ? "Anexar Dossiê" : "Dossiê exclusivo do Modo Formador de Opinião"}
            title={hasMfo ? "Anexar Dossiê" : "Recurso exclusivo do Modo Formador de Opinião"}
            disabled={sending}
            onClick={() => {
              if (!hasMfo) {
                setUpgradeDialogOpen(true);
                return;
              }
              fileInputRef.current?.click();
            }}
            className="shrink-0 rounded-full text-muted-foreground"
          >
            {hasMfo ? (
              <Paperclip className="size-5" aria-hidden="true" />
            ) : (
              <LockKeyhole className="size-5" aria-hidden="true" />
            )}
          </Button>
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
          <div className="min-w-0 flex-1">
            {selectedFile && (
              <div className="mb-1 flex items-center gap-2 px-3 text-xs text-muted-foreground">
                <FileText className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{selectedFile.name}</span>
                <button
                  type="button"
                  className="font-semibold text-destructive"
                  aria-label="Remover arquivo anexado"
                  onClick={() => setSelectedFile(null)}
                >
                  Remover
                </button>
              </div>
            )}
            <Input
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder="Mensagem"
              aria-label="Sua mensagem"
              maxLength={2000}
              disabled={sending}
              className="h-11 rounded-full bg-muted/50 px-4"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            aria-label="Enviar mensagem"
            disabled={(!messageText.trim() && !selectedFile) || sending}
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
              O Super Chat e o envio de Dossiês são exclusivos do Modo Formador de Opinião. Faça o upgrade para acessar esses recursos.
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