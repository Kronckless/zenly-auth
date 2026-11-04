import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppNavigation from "@/components/AppNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
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
  Crosshair,
  MessageSquare,
  Paperclip,
  Send,
  Smile,
  Sparkles,
  UsersRound,
  Zap,
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
  author_has_mfo?: boolean;
};

type PortalArticle = {
  categoria: string;
  titulo: string;
  resumo: string;
  conteudo_completo: string;
  created_at: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SUPER_CHAT_COOLDOWN_MS = 5 * 60 * 1000;
const SUPER_CHAT_DAILY_LIMIT = 10;
const mfoCheckoutUrl = "https://pay.cakto.com.br/y5pewwd_1277398";

type SuperChatUsage = {
  day: string;
  count: number;
  lastSentAt: number;
};

function getLocalDayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getSuperChatStorageKey(userId: string) {
  return `community-super-chat-usage-${userId}`;
}

function readSuperChatUsage(userId: string): SuperChatUsage {
  const today = getLocalDayKey();

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(getSuperChatStorageKey(userId)) || "null",
    ) as Partial<SuperChatUsage> | null;

    if (!stored || stored.day !== today) {
      return { day: today, count: 0, lastSentAt: 0 };
    }

    return {
      day: today,
      count: Math.max(0, Number(stored.count) || 0),
      lastSentAt: Math.max(0, Number(stored.lastSentAt) || 0),
    };
  } catch {
    return { day: today, count: 0, lastSentAt: 0 };
  }
}

function formatCooldown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function Community() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [hasMfo, setHasMfo] = useState(false);
  const [mfoFilterEnabled, setMfoFilterEnabled] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<PortalArticle | null>(null);
  const [portalArticles, setPortalArticles] = useState<PortalArticle[]>([]);
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState("");
  const [superChatEnabled, setSuperChatEnabled] = useState(false);
  const [superChatCooldownSeconds, setSuperChatCooldownSeconds] = useState(0);
  const [dailySuperChatCount, setDailySuperChatCount] = useState(0);
  const [pinnedSuperChatId, setPinnedSuperChatId] = useState<string | null>(null);
  const [animatingSuperChatId, setAnimatingSuperChatId] = useState<string | null>(null);
  const [superChatLimitMessage, setSuperChatLimitMessage] = useState("");
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeStep, setUpgradeStep] = useState<1 | 2>(1);
  const [upgradeFeature, setUpgradeFeature] = useState<"super-chat" | "dossier">("super-chat");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const quickEmojis = ["😀", "😂", "❤️", "👍", "🎉", "🙏"];
  const pinTimeoutRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pinTimeoutRef.current !== null) window.clearTimeout(pinTimeoutRef.current);
      if (animationTimeoutRef.current !== null) window.clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!articleDialogOpen || !supabase) return;

    let active = true;
    setArticleLoading(true);
    setArticleError("");

    const loadPortalArticles = async () => {
      const { data, error: queryError } = await supabase
        .from("panoramas")
        .select("categoria, titulo, resumo, conteudo_completo, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!active) return;

      if (queryError) {
        setArticleError("Não foi possível carregar as matérias do portal.");
      } else {
        setPortalArticles((data ?? []) as PortalArticle[]);
      }
      setArticleLoading(false);
    };

    void loadPortalArticles();
    return () => {
      active = false;
    };
  }, [articleDialogOpen]);

  useEffect(() => {
    if (!userId) {
      setSuperChatCooldownSeconds(0);
      setDailySuperChatCount(0);
      setSuperChatLimitMessage("");
      return;
    }

    const refreshSuperChatStatus = () => {
      const usage = readSuperChatUsage(userId);
      const remainingMs = Math.max(
        0,
        SUPER_CHAT_COOLDOWN_MS - (Date.now() - usage.lastSentAt),
      );

      setDailySuperChatCount(usage.count);
      setSuperChatCooldownSeconds(Math.ceil(remainingMs / 1000));
      setSuperChatLimitMessage(
        usage.count >= SUPER_CHAT_DAILY_LIMIT
          ? "Limite diário de 10 Super Chats atingido. Volte amanhã!"
          : "",
      );

      if (
        usage.count >= SUPER_CHAT_DAILY_LIMIT ||
        remainingMs > 0
      ) {
        setSuperChatEnabled(false);
      }
    };

    refreshSuperChatStatus();
    const interval = window.setInterval(refreshSuperChatStatus, 1000);
    return () => window.clearInterval(interval);
  }, [userId]);

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

    const loadedMessages = (data ?? []) as CommunityMessage[];
    const authorIds = [...new Set(loadedMessages.map((message) => message.user_id))];
    let mfoUserIds = new Set<string>();

    if (authorIds.length > 0) {
      const { data: mfoProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("has_mfo", true)
        .in("id", authorIds);

      mfoUserIds = new Set((mfoProfiles ?? []).map((profile) => profile.id));
    }

    setMessages(
      loadedMessages.map((message) => ({
        ...message,
        author_has_mfo: mfoUserIds.has(message.user_id),
      })),
    );
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

    if ((!content && !selectedArticle) || sending) return;

    if (!supabase) {
      setError("O serviço de mensagens não está configurado.");
      return;
    }

    if (!userId) {
      setError("Entre na sua conta para enviar mensagens.");
      return;
    }

    const isSuperChatMessage = hasMfo && superChatEnabled;
    if (isSuperChatMessage) {
      const usage = readSuperChatUsage(userId);
      const remainingMs = Math.max(
        0,
        SUPER_CHAT_COOLDOWN_MS - (Date.now() - usage.lastSentAt),
      );

      if (usage.count >= SUPER_CHAT_DAILY_LIMIT) {
        setSuperChatLimitMessage(
          "Limite diário de 10 Super Chats atingido. Volte amanhã!",
        );
        setSuperChatEnabled(false);
        return;
      }

      if (remainingMs > 0) {
        setSuperChatCooldownSeconds(Math.ceil(remainingMs / 1000));
        setSuperChatEnabled(false);
        return;
      }
    }

    setSending(true);
    setError("");

    const dossierUrl: string | null = null;
    const dossierName = selectedArticle?.titulo ?? null;
    const dossierSize: number | null = null;

    const { data: insertedMessage, error: sendError } = await supabase
      .from("mensagens_comunidade")
      .insert({
        user_id: userId,
        nome_usuario: profileName || "Membro",
        conteudo: content,
        is_super_chat: isSuperChatMessage,
        dossier_url: dossierUrl,
        dossier_name: dossierName,
        dossier_size: dossierSize,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (sendError) {
      setError("Não foi possível enviar sua mensagem. Tente novamente.");
    } else {
      if (isSuperChatMessage && insertedMessage?.id && !mfoFilterEnabled) {
        setPinnedSuperChatId(insertedMessage.id);
        setAnimatingSuperChatId(insertedMessage.id);

        if (pinTimeoutRef.current !== null) window.clearTimeout(pinTimeoutRef.current);
        if (animationTimeoutRef.current !== null) window.clearTimeout(animationTimeoutRef.current);

        animationTimeoutRef.current = window.setTimeout(() => {
          setAnimatingSuperChatId(null);
        }, 1500);

        pinTimeoutRef.current = window.setTimeout(() => {
          setPinnedSuperChatId(null);
        }, 3500);
      }

      setMessageText("");
      setSelectedArticle(null);
      setSuperChatEnabled(false);

      if (isSuperChatMessage) {
        const previousUsage = readSuperChatUsage(userId);
        const nextUsage: SuperChatUsage = {
          day: getLocalDayKey(),
          count: previousUsage.count + 1,
          lastSentAt: Date.now(),
        };

        try {
          window.localStorage.setItem(
            getSuperChatStorageKey(userId),
            JSON.stringify(nextUsage),
          );
        } catch {
          // Keep the chat usable if browser storage is unavailable.
        }

        setDailySuperChatCount(nextUsage.count);
        setSuperChatCooldownSeconds(Math.ceil(SUPER_CHAT_COOLDOWN_MS / 1000));
        setSuperChatLimitMessage(
          nextUsage.count >= SUPER_CHAT_DAILY_LIMIT
            ? "Limite diário de 10 Super Chats atingido. Volte amanhã!"
            : "",
        );
      }

      await loadMessages();
    }

    setSending(false);
  };

  const orderedMessages = pinnedSuperChatId && !mfoFilterEnabled
    ? [
        ...messages.filter((message) => message.id === pinnedSuperChatId),
        ...messages.filter((message) => message.id !== pinnedSuperChatId),
      ]
    : messages;
  const visibleMessages = mfoFilterEnabled
    ? orderedMessages.filter((message) => message.author_has_mfo)
    : orderedMessages;

  return (
    <main
      className={`flex h-dvh flex-col overflow-hidden transition-colors duration-300 ${
        mfoFilterEnabled ? "bg-muted/50" : "bg-background"
      }`}
    >
      <AppNavigation />
      <section
        className={`mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col border-x pb-[calc(5rem+env(safe-area-inset-bottom))] transition-all duration-300 sm:pb-0 ${
          mfoFilterEnabled
            ? "border-primary/20 bg-muted/40 shadow-xl ring-1 ring-inset ring-border/60 backdrop-blur-xl"
            : "border-border bg-muted/30"
        }`}
      >
        <header
          className={`flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 transition-all duration-300 sm:px-6 ${
            mfoFilterEnabled
              ? "bg-background/75 shadow-sm backdrop-blur-xl"
              : "bg-background"
          }`}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <UsersRound className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">Chat da comunidade</h1>
            {mfoFilterEnabled && (
              <Badge variant="secondary" className="mt-1 h-5 gap-1 px-2 text-[10px]">
                <Sparkles aria-hidden="true" />
                FOCO ATIVADO
              </Badge>
            )}
          </div>
          <div
            role="group"
            aria-label="Modo de visualização do chat"
            className="relative grid h-[52px] w-[104px] shrink-0 grid-cols-2 rounded-full border border-border bg-muted/70 p-1 shadow-inner"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute left-1 top-1 size-11 rounded-full bg-primary shadow-[inset_0_1px_2px_hsl(var(--background)/0.35),0_1px_4px_hsl(var(--foreground)/0.12)] transition-transform duration-300 ease-out ${
                mfoFilterEnabled ? "translate-x-11" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              aria-label="Chat geral"
              aria-pressed={!mfoFilterEnabled}
              onClick={() => setMfoFilterEnabled(false)}
              className={`relative z-10 flex size-11 items-center justify-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                !mfoFilterEnabled ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Modo Foco MFO"
              aria-pressed={mfoFilterEnabled}
              onClick={() => setMfoFilterEnabled(true)}
              className={`relative z-10 flex size-11 items-center justify-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                mfoFilterEnabled ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Crosshair className="size-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div
          ref={messageListRef}
          aria-live="polite"
          className={`min-h-0 flex-1 overflow-y-auto px-3 py-5 transition-all duration-300 ease-in-out sm:px-6 ${
            mfoFilterEnabled
              ? "bg-muted/60 backdrop-blur-md"
              : "bg-background backdrop-blur-0"
          }`}
        >
          {loading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Carregando mensagens...
            </p>
          ) : visibleMessages.length === 0 ? (
            <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-center">
              <MessageSquare className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                {mfoFilterEnabled && messages.length > 0
                  ? "Nenhuma mensagem de Formador de Opinião para exibir."
                  : "Ainda não há mensagens. Seja o primeiro a participar!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleMessages.map((message) => {
                const isOwnMessage = message.user_id === userId;

                return (
                  <article
                    key={message.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} ${
                      !mfoFilterEnabled && message.id === pinnedSuperChatId
                        ? "sticky top-0 z-10"
                        : ""
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2 shadow-sm sm:max-w-[75%] ${
                        message.is_super_chat
                          ? !mfoFilterEnabled && message.id === animatingSuperChatId
                            ? "border-2 border-transparent bg-gradient-to-r from-primary via-destructive to-primary text-primary-foreground animate-[pulse_1.5s_ease-in-out]"
                            : mfoFilterEnabled
                              ? "border-2 border-destructive bg-gradient-to-br from-destructive/10 to-background text-foreground"
                              : "border-2 border-destructive/70 bg-gradient-to-br from-primary/15 to-background text-foreground"
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
                      {(message.dossier_url || message.dossier_name) && (
                        message.dossier_url ? (
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
                        ) : (
                          <div className="mb-2 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <FileText className="size-5" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[10px] font-semibold uppercase tracking-wide text-primary">
                                Matéria do portal
                              </span>
                              <span className="block truncate text-sm font-semibold">
                                {message.dossier_name}
                              </span>
                            </span>
                          </div>
                        )
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
        {superChatLimitMessage && (
          <p role="status" className="shrink-0 px-4 pb-2 text-center text-xs text-muted-foreground">
            {superChatLimitMessage}
          </p>
        )}

        <form
          onSubmit={sendMessage}
          className={`relative flex shrink-0 items-center gap-2 border-t border-border px-3 py-3 transition-all duration-300 sm:px-5 ${
            mfoFilterEnabled
              ? "bg-background/75 shadow-[0_-4px_18px_hsl(var(--foreground)/0.04)] backdrop-blur-xl"
              : "bg-background"
          }`}
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
                setUpgradeFeature("super-chat");
                setUpgradeDialogOpen(true);
                return;
              }
              setSuperChatEnabled((enabled) => !enabled);
            }}
            disabled={
              sending ||
              (hasMfo &&
                (superChatCooldownSeconds > 0 ||
                  dailySuperChatCount >= SUPER_CHAT_DAILY_LIMIT))
            }
            className="shrink-0 gap-1.5 rounded-full px-3"
          >
            <span className="relative inline-flex">
              <Zap className="size-4" aria-hidden="true" />
              {!hasMfo && (
                <LockKeyhole className="absolute -bottom-1 -right-1 size-2.5 rounded-full bg-background" aria-hidden="true" />
              )}
            </span>
            <span className="hidden text-xs sm:inline">
              {superChatCooldownSeconds > 0
                ? `Aguarde ${formatCooldown(superChatCooldownSeconds)}`
                : "Super Chat"}
            </span>
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
            variant={hasMfo ? "ghost" : "outline"}
            size="icon"
            aria-label={hasMfo ? "Selecionar matéria do portal" : "Envio de Dossiês exclusivo do Modo Formador de Opinião"}
            title={hasMfo ? "Selecionar matéria do portal" : "Recurso exclusivo do Modo Formador de Opinião"}
            disabled={sending}
            onClick={() => {
              if (!hasMfo) {
                setUpgradeFeature("dossier");
                setUpgradeDialogOpen(true);
                return;
              }
              setArticleDialogOpen(true);
            }}
            className="shrink-0 rounded-full text-muted-foreground"
          >
            <span className="relative inline-flex">
              <Paperclip className="size-5" aria-hidden="true" />
              {!hasMfo && (
                <LockKeyhole className="absolute -bottom-1 -right-1 size-2.5 rounded-full bg-background" aria-hidden="true" />
              )}
            </span>
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
            {selectedArticle && (
              <div className="mb-1 flex items-center gap-2 px-3 text-xs text-muted-foreground">
                <FileText className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{selectedArticle.titulo}</span>
                <button
                  type="button"
                  className="font-semibold text-destructive"
                  aria-label="Remover matéria selecionada"
                  onClick={() => setSelectedArticle(null)}
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
            disabled={(!messageText.trim() && !selectedArticle) || sending}
            className="size-10 shrink-0 rounded-full"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </section>

      <Dialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Selecionar matéria do portal</DialogTitle>
            <DialogDescription>
              Escolha uma notícia para citar e iniciar o debate no chat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {articleLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Carregando matérias...
              </p>
            ) : articleError ? (
              <p role="alert" className="py-4 text-sm text-destructive">
                {articleError}
              </p>
            ) : portalArticles.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma matéria disponível no momento.
              </p>
            ) : (
              portalArticles.map((article, index) => (
                <button
                  key={`${article.created_at}-${index}`}
                  type="button"
                  onClick={() => {
                    setSelectedArticle(article);
                    setArticleDialogOpen(false);
                  }}
                  className="w-full rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {article.categoria && (
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {article.categoria}
                    </span>
                  )}
                  <span className="block font-semibold leading-snug">
                    {article.titulo}
                  </span>
                  {article.resumo && (
                    <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                      {article.resumo}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArticleDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        body:has([data-mfo-upgrade-dialog="true"]) [data-slot="dialog-overlay"] {
          background-color: hsl(var(--background) / 0.22) !important;
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
        }
      `}</style>
      <Dialog
        open={upgradeDialogOpen}
        onOpenChange={(open) => {
          setUpgradeDialogOpen(open);
          if (!open) setUpgradeStep(1);
        }}
      >
        <DialogContent
          data-mfo-upgrade-dialog="true"
          className="!fixed !inset-0 !left-0 !top-0 !z-50 !flex !h-dvh !w-screen !max-w-none !translate-x-0 !translate-y-0 !flex-col !items-center !justify-center !rounded-none !border-0 !px-6 !pb-6 !pt-20 !shadow-none relative overflow-y-auto overscroll-contain scroll-smooth !bg-gradient-to-br !from-background/95 !via-background/95 !to-muted/80 text-foreground backdrop-blur-2xl [&>[data-slot=dialog-close]]:hidden sm:!max-w-none sm:!px-10 sm:!pb-10 sm:!pt-20"
        >
          <DialogClose
            aria-label="Fechar"
            className="absolute right-4 top-4 z-[9999] flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/10 text-black backdrop-blur-md transition-all hover:bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg
              className="size-5 stroke-current stroke-[2.5]"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M18 6 6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </DialogClose>
          {upgradeStep === 1 ? (
            <>
              <DialogHeader className="shrink-0 items-center text-center">
                <DialogTitle className="text-center text-2xl leading-tight text-foreground sm:text-3xl">
                  Sua voz tem muito a somar por aqui.
                </DialogTitle>
                <DialogDescription className="text-center text-muted-foreground">
                  Desbloqueie o Modo Formador de Opinião (MFO) para colocar suas opiniões em um alcance nunca antes visto!
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-6 justify-center">
                <Button onClick={() => setUpgradeStep(2)}>
                  Desbloquear MFO
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader className="shrink-0 text-center">
                <DialogTitle className="text-xl text-foreground">
                  Desbloquear Modo Formador de Opinião
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Checkout seguro da Cakto · R$ 197, pagamento único.
                </DialogDescription>
              </DialogHeader>
              {mfoCheckoutUrl ? (
                <iframe
                  title="Checkout MFO da Cakto"
                  src={mfoCheckoutUrl}
                  className="mt-4 min-h-[calc(100dvh-12rem)] w-full flex-1 rounded-xl border border-border bg-background"
                  allow="payment *"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <p role="status" className="rounded-xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
                  O checkout da Cakto ainda não está configurado.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}