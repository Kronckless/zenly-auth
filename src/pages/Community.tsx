import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
  Crosshair,
  MessageSquare,
  MessageSquarePlus,
  Paperclip,
  Pin,
  Search,
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

type CommunityRoom = {
  id: string;
  name: string;
  creator: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SUPER_CHAT_COOLDOWN_MS = 5 * 60 * 1000;
const SUPER_CHAT_DAILY_LIMIT = 10;

function MfoStep3Checkout({ email }: { email: string }) {
  const checkoutUrl = new URL("https://pay.cakto.com.br/y5pewwd_1277398");
  checkoutUrl.searchParams.set("email", email);

  return (
    <div className="w-full space-y-3 px-2 pb-3 sm:space-y-4 sm:px-6 sm:pb-4">
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-left">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-sm font-bold text-destructive"
          >
            ✓
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Confira seu e-mail antes de pagar
            </p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "#000000" }}>
              <strong>Use o mesmo e-mail cadastrado</strong> no VOZ DO POVO para liberar seu acesso automaticamente.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden border border-border bg-background shadow-sm">
        <iframe
          src={checkoutUrl.toString()}
          title="Checkout Cakto para desbloquear o Modo Formador de Opinião"
          sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
          allow="payment; clipboard-write"
          className="block h-[55dvh] min-h-[320px] max-h-[480px] w-full bg-background sm:h-[650px] sm:max-h-none"
        />
      </div>

      <div className="text-center">
        <a
          href={checkoutUrl.toString()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:bg-muted hover:text-foreground"
        >
          ⚠️ Está com problemas para carregar corretamente? Clique aqui.
        </a>
      </div>
    </div>
  );
}

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
  const location = useLocation();
  const { roomId } = useParams<{ roomId: string }>();
  const isConversationOpen =
    location.pathname === "/comunidade/geral" || Boolean(roomId);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [hasMfo, setHasMfo] = useState(false);
  const [isSocio, setIsSocio] = useState(false);
  const [communityRooms, setCommunityRooms] = useState<CommunityRoom[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [createRoomDialogOpen, setCreateRoomDialogOpen] = useState(false);
  const [socioDialogOpen, setSocioDialogOpen] = useState(false);
  const [roomLimitDialogOpen, setRoomLimitDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomIsPrivate, setRoomIsPrivate] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [createRoomError, setCreateRoomError] = useState("");
  const [mfoFilterEnabled, setMfoFilterEnabled] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
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
  const [upgradeStep, setUpgradeStep] = useState<1 | 2 | 3>(1);
  const [emailDraft, setEmailDraft] = useState("");
  const [confirmedEmail, setConfirmedEmail] = useState("");
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


  const loadCommunityRooms = useCallback(async () => {
    if (!supabase) return;

    const { data: rooms, error: roomsError } = await supabase
      .from("salas_comunidade")
      .select("id, name, creator_name, is_private, created_at")
      .order("created_at", { ascending: false });

    if (roomsError) return;

    const readTimes = new Map<string, string>();
    if (userId) {
      const { data: reads } = await supabase
        .from("leituras_salas")
        .select("conversation_id, last_read_at")
        .eq("user_id", userId);

      (reads ?? []).forEach((read) => {
        readTimes.set(read.conversation_id, read.last_read_at);
      });
    }

    const fallbackReadAt = new Date(0).toISOString();
    let generalUnreadCount = 0;

    if (userId) {
      const { count } = await supabase
        .from("mensagens_comunidade")
        .select("id", { count: "exact", head: true })
        .is("room_id", null)
        .gt("created_at", readTimes.get("general") ?? fallbackReadAt)
        .neq("user_id", userId);

      generalUnreadCount = count ?? 0;
    }

    const roomsWithUnread = await Promise.all(
      (rooms ?? []).map(async (room) => {
        const readAt = readTimes.get(room.id) ?? fallbackReadAt;
        const [countResult, latestResult] = await Promise.all([
          userId
            ? supabase
                .from("mensagens_comunidade")
                .select("id", { count: "exact", head: true })
                .eq("room_id", room.id)
                .gt("created_at", readAt)
                .neq("user_id", userId)
            : Promise.resolve({ count: 0 }),
          supabase
            .from("mensagens_comunidade")
            .select("nome_usuario, conteudo, dossier_name, created_at")
            .eq("room_id", room.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const latestMessage = latestResult.data;
        return {
          id: room.id,
          name: room.name,
          creator: room.creator_name,
          lastMessage: latestMessage
            ? `${latestMessage.nome_usuario}: ${latestMessage.conteudo || latestMessage.dossier_name || "Matéria do portal"}`
            : "Nova sala",
          lastMessageAt: latestMessage?.created_at ?? null,
          unreadCount: countResult.count ?? 0,
        };
      }),
    );

    setCommunityRooms(roomsWithUnread);
    setUnreadCounts({
      general: generalUnreadCount,
      ...Object.fromEntries(roomsWithUnread.map((room) => [room.id, room.unreadCount])),
    });
  }, [userId]);

  useEffect(() => {
    void loadCommunityRooms();
  }, [loadCommunityRooms]);

  useEffect(() => {
    if (!isConversationOpen || !userId || !supabase) return;

    const conversationId = roomId ?? "general";
    const lastReadAt = new Date().toISOString();
    setUnreadCounts((counts) => ({ ...counts, [conversationId]: 0 }));
    void supabase.from("leituras_salas").upsert(
      {
        user_id: userId,
        conversation_id: conversationId,
        last_read_at: lastReadAt,
      },
      { onConflict: "user_id,conversation_id" },
    );
  }, [isConversationOpen, roomId, userId]);

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

    let messagesQuery = supabase
      .from("mensagens_comunidade")
      .select("id, user_id, nome_usuario, conteudo, created_at, is_super_chat, dossier_url, dossier_name, dossier_size")
      .gte("created_at", sevenDaysAgo);

    messagesQuery = roomId
      ? messagesQuery.eq("room_id", roomId)
      : messagesQuery.is("room_id", null);

    const { data, error: fetchError } = await messagesQuery.order(
      "created_at",
      { ascending: true },
    );

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
  }, [roomId]);

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
        setEmailDraft(user.email ?? "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, has_mfo, is_socio")
          .eq("id", user.id)
          .maybeSingle();

        if (active) {
          setProfileName(
            profile?.display_name?.trim() ||
              user.user_metadata?.full_name ||
              "Membro",
          );
          setHasMfo(profile?.has_mfo === true);
          setIsSocio(profile?.is_socio === true);
        }
      } else if (active) {
        setHasMfo(false);
        setIsSocio(false);
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
          if (active) {
            void loadMessages();
            void loadCommunityRooms();

            if (isConversationOpen && userId) {
              const conversationId = roomId ?? "general";
              const lastReadAt = new Date().toISOString();
              setUnreadCounts((counts) => ({ ...counts, [conversationId]: 0 }));
              void supabase.from("leituras_salas").upsert(
                {
                  user_id: userId,
                  conversation_id: conversationId,
                  last_read_at: lastReadAt,
                },
                { onConflict: "user_id,conversation_id" },
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [loadMessages, loadCommunityRooms, isConversationOpen, roomId, userId]);

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
        room_id: roomId ?? null,
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
  const latestCommunityMessage = messages[messages.length - 1] ?? null;
  const activeRoom = roomId
    ? communityRooms.find((room) => room.id === roomId)
    : null;
  const conversationSearchTerm = conversationSearch.trim().toLocaleLowerCase();
  const showCommunityConversation = "chat da comunidade".includes(conversationSearchTerm);
  const filteredCommunityRooms = communityRooms.filter((room) =>
    room.name.toLocaleLowerCase().includes(conversationSearchTerm),
  );
  const firstName = profileName.trim().split(/\s+/)[0] || "Membro";
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft.trim());
  const closeModal = () => {
    setUpgradeDialogOpen(false);
    setUpgradeStep(1);
  };

  const openRoomCreation = async () => {
    if (!isSocio) {
      setSocioDialogOpen(true);
      return;
    }

    if (!supabase || !userId) {
      setCreateRoomError("Entre na sua conta para criar uma sala.");
      setRoomLimitDialogOpen(true);
      return;
    }

    const { count, error: countError } = await supabase
      .from("salas_comunidade")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", userId);

    if (countError) {
      setCreateRoomError("Não foi possível verificar quantas salas você criou.");
      setRoomLimitDialogOpen(true);
      return;
    }

    if ((count ?? 0) >= 2) {
      setCreateRoomError("Você atingiu o limite máximo de 2 salas.");
      setRoomLimitDialogOpen(true);
      return;
    }

    setCreateRoomError("");
    setRoomName("");
    setRoomIsPrivate(false);
    setCreateRoomDialogOpen(true);
  };

  const createCommunityRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = roomName.trim();
    if (!name || !supabase || !userId || creatingRoom) return;

    setCreatingRoom(true);
    setCreateRoomError("");

    const { data, error: insertError } = await supabase
      .from("salas_comunidade")
      .insert({
        creator_id: userId,
        creator_name: profileName || "Membro",
        name,
        is_private: roomIsPrivate,
      })
      .select("id, name, creator_name, is_private")
      .single();

    if (insertError || !data) {
      setCreateRoomError("Não foi possível criar a sala. Tente novamente.");
      setCreatingRoom(false);
      return;
    }

    setCommunityRooms((rooms) => [
      {
        id: data.id,
        name: data.name,
        creator: data.creator_name,
        lastMessage: "Nova sala",
        lastMessageAt: null,
        unreadCount: 0,
      },
      ...rooms,
    ]);
    setCreateRoomDialogOpen(false);
    setCreatingRoom(false);
  };

  return (
    <main
      className={`flex h-dvh flex-col overflow-hidden transition-colors duration-300 ${
        mfoFilterEnabled ? "bg-muted/50" : "bg-background"
      }`}
    >
      <AppNavigation />
      {isConversationOpen ? (
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
            <h1 className="truncate text-sm font-semibold">
              {activeRoom?.name ?? (roomId ? "Sala de conversa" : "Chat da comunidade")}
            </h1>
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
      ) : (
        <>
        <section className="flex min-h-0 w-full flex-1 flex-col bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
          <header className="shrink-0 bg-background pt-6">
            <h1 className="px-4 pb-3 text-2xl font-bold text-foreground">Conversas</h1>
            <label className="mx-4 mb-4 flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2.5 text-sm text-zinc-500">
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <Input
                type="search"
                value={conversationSearch}
                onChange={(event) => setConversationSearch(event.target.value)}
                placeholder="Pesquisar..."
                aria-label="Pesquisar conversas"
                className="h-auto min-w-0 border-0 bg-transparent p-0 text-sm text-zinc-500 shadow-none placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </label>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-border bg-background">
            {showCommunityConversation && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setUnreadCounts((counts) => ({ ...counts, general: 0 }));
                  navigate("/comunidade/geral");
                }}
                className="h-auto w-full justify-start gap-3 rounded-none px-4 py-3.5 text-left hover:bg-muted/50"
              >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <UsersRound className="size-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="truncate text-base font-semibold text-foreground">
                    Chat da comunidade
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      {latestCommunityMessage && (
                        <time>
                          {new Date(latestCommunityMessage.created_at).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </time>
                      )}
                      <Pin className="size-3.5" aria-label="Conversa fixada" />
                    </span>
                    {(unreadCounts.general ?? 0) > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">
                        {unreadCounts.general}
                      </span>
                    )}
                  </span>
                </span>
                <span className="mt-1 block truncate text-sm font-normal text-muted-foreground">
                  {loading
                    ? "Carregando a última mensagem..."
                    : latestCommunityMessage
                      ? `${latestCommunityMessage.nome_usuario}: ${latestCommunityMessage.conteudo || latestCommunityMessage.dossier_name || "Matéria do portal"}`
                      : "Ainda não há mensagens. Toque para abrir a conversa."}
                </span>
              </span>
              </Button>
            )}

            {filteredCommunityRooms.map((room) => (
              <Button
                key={room.id}
                type="button"
                variant="ghost"
                onClick={() => {
                  setUnreadCounts((counts) => ({ ...counts, [room.id]: 0 }));
                  navigate(`/comunidade/salas/${room.id}`);
                }}
                className="h-auto w-full justify-start gap-3 rounded-none px-4 py-3.5 text-left hover:bg-muted/50"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <UsersRound className="size-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className="truncate text-base font-semibold text-foreground">
                      {room.name}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                      {room.lastMessageAt && (
                        <time>
                          {new Date(room.lastMessageAt).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </time>
                      )}
                      {room.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">
                          {room.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-sm font-normal text-muted-foreground">
                    {room.lastMessage}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </section>
        <Button
          type="button"
          size="icon"
          aria-label="Criar sala"
          onClick={() => void openRoomCreation()}
          className="fixed bottom-24 right-5 z-30 size-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 text-white shadow-lg shadow-black/20 transition-all duration-150 active:scale-95"
        >
          <MessageSquarePlus className="size-6" strokeWidth={2.2} aria-hidden="true" />
        </Button>

        <Dialog open={socioDialogOpen} onOpenChange={setSocioDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Torne-se sócio</DialogTitle>
              <DialogDescription>
                Seja sócio do Portal Voz do Povo para criar suas próprias salas de conversa.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSocioDialogOpen(false)}>
                Agora não
              </Button>
              <Button
                onClick={() => {
                  setSocioDialogOpen(false);
                  navigate("/home", { state: { openSocioModal: true } });
                }}
              >
                Quero me tornar sócio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={createRoomDialogOpen} onOpenChange={setCreateRoomDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova sala</DialogTitle>
              <DialogDescription>
                Dê um nome à sala e escolha quem poderá encontrá-la.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createCommunityRoom} className="space-y-4">
              <Input
                autoFocus
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                placeholder="Nome da sala"
                aria-label="Nome da sala"
                maxLength={60}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={roomIsPrivate ? "outline" : "default"}
                  onClick={() => setRoomIsPrivate(false)}
                >
                  Pública
                </Button>
                <Button
                  type="button"
                  variant={roomIsPrivate ? "default" : "outline"}
                  onClick={() => setRoomIsPrivate(true)}
                >
                  Privada
                </Button>
              </div>
              {createRoomError && (
                <p role="alert" className="text-sm text-destructive">{createRoomError}</p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateRoomDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!roomName.trim() || creatingRoom}>
                  {creatingRoom ? "Criando..." : "Criar sala"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={roomLimitDialogOpen} onOpenChange={setRoomLimitDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Não foi possível criar uma sala</DialogTitle>
              <DialogDescription>{createRoomError}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setRoomLimitDialogOpen(false)}>Entendi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>
      )}

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

        @property --mfo-border-angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }

        .mfo-email-modal-border {
          isolation: isolate;
        }

        .mfo-email-modal-border::before {
          position: absolute;
          inset: 0;
          z-index: 0;
          padding: 2px;
          border-radius: inherit;
          background: conic-gradient(
            from var(--mfo-border-angle),
            #833ab4,
            #fd1d1d,
            #fcb045,
            #ffdc80,
            #fd1d1d,
            #833ab4
          );
          content: "";
          pointer-events: none;
          opacity: 0;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: mfo-email-border-entry 2s cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }

        .mfo-email-modal-border > * {
          position: relative;
          z-index: 1;
        }

        @keyframes mfo-email-border-entry {
          0% { opacity: 0; --mfo-border-angle: 0deg; }
          12% { opacity: 1; }
          85% { opacity: 1; --mfo-border-angle: 310deg; }
          100% { opacity: 0; --mfo-border-angle: 360deg; }
        }

        @keyframes community-button-shine {
          from { transform: translateX(-150%) skewX(-12deg); }
          to { transform: translateX(450%) skewX(-12deg); }
        }

        @keyframes community-button-pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(88, 101, 242, 0.25); }
          50% { box-shadow: 0 0 14px rgba(88, 101, 242, 0.45); }
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
          className={`!fixed !inset-0 !left-0 !top-0 !z-50 !flex !h-dvh !w-screen !max-w-none !translate-x-0 !translate-y-0 !flex-col !items-center !justify-center !rounded-none !border-0 !px-6 !pb-4 !pt-14 !shadow-none relative overflow-hidden [&>button[data-slot=dialog-close]]:hidden overflow-y-auto overscroll-contain scroll-smooth !bg-gradient-to-br !from-background/95 !via-background/95 !to-muted/80 text-foreground backdrop-blur-2xl sm:!max-w-none sm:!px-10 sm:!pb-6 sm:!pt-16 ${
            upgradeStep === 3 ? "!px-2 !pb-2" : ""
          } ${
            upgradeStep === 2 ? "mfo-email-modal-border" : ""
          }`}
        >
          <button
            type="button"
            onClick={closeModal}
            className="!absolute !right-4 !top-4 z-50 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none bg-muted p-2 text-muted-foreground shadow-none transition-colors hover:text-foreground cursor-pointer"
            aria-label="Fechar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {upgradeStep === 1 ? (
            <div className="-translate-y-4">
              <DialogHeader className="shrink-0 items-center text-center">
                <DialogTitle className="text-center text-2xl leading-tight text-foreground sm:text-3xl">
                  Sua voz tem muito a somar por aqui.
                </DialogTitle>
                <DialogDescription className="text-center text-muted-foreground">
                  Desbloqueie o Modo Formador de Opinião (MFO) para colocar suas opiniões em um alcance nunca antes visto!
                </DialogDescription>
              </DialogHeader>
              <ul className="mt-5 w-full max-w-lg list-disc space-y-3.5 rounded-lg border border-border bg-[#f4f5f7] p-7 pl-11 text-sm font-semibold leading-relaxed text-foreground shadow-sm sm:p-8 sm:pl-12">
                <li>Dê voz às suas ideias</li>
                <li>Super chats (destaque visual nas mensagens)</li>
                <li>Cite dossiês no chat</li>
                <li>Espaço próprio para pendurar suas falas</li>
                <li>Tag de Formador de Opinião vitalícia</li>
                <li>Acesso imediato às ferramentas de opinião</li>
              </ul>
              <DialogFooter className="mt-5 justify-center">
                <Button
                  onClick={() => setUpgradeStep(2)}
                  className="h-12 min-w-56 bg-[#5865F2] px-8 text-base font-semibold text-white transition-colors hover:bg-[#4752C4]"
                >
                  Desbloquear MFO
                </Button>
              </DialogFooter>
            </div>
          ) : upgradeStep === 2 ? (
            <div className="w-full max-w-lg rounded-3xl border border-border bg-muted/70 p-6 shadow-xl sm:p-8">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-bold text-foreground sm:text-2xl">
                  {firstName}, atenção ao seu e-mail!
                </DialogTitle>
                <DialogDescription className="pt-2 leading-relaxed text-muted-foreground">
                  Muitas pessoas que adquiriram o MFO preencheram com um e-mail diferente do que usam no VOZ DO POVO. Para garantir que seu acesso seja liberado automaticamente sem dificuldades, confirme seu e-mail abaixo:
                </DialogDescription>
              </DialogHeader>
              <form
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const email = emailDraft.trim();
                  if (!email) return;
                  setConfirmedEmail(email);
                  setUpgradeStep(3);
                }}
              >
                <label htmlFor="mfo-confirm-email" className="block text-sm font-medium text-foreground">
                  E-mail da sua conta
                </label>
                <Input
                  id="mfo-confirm-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={emailDraft}
                  onChange={(event) => setEmailDraft(event.target.value)}
                  className="h-12 rounded-xl bg-background"
                />
                <Button
                  type="submit"
                  disabled={!emailDraft.trim() || !emailIsValid}
                  className={`h-12 w-full rounded-xl bg-[#5865F2] font-semibold text-white transition-colors hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:bg-[#5865F2] disabled:text-white disabled:opacity-60 ${
                    emailIsValid
                      ? "relative isolate cursor-pointer overflow-hidden shadow-[0_0_12px_rgba(88,101,242,0.3)] animate-[community-button-pulse_0.5s_ease-in-out_infinite]"
                      : ""
                  }`}
                >
                  {emailIsValid && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[community-button-shine_1.5s_ease-in-out_infinite]"
                    />
                  )}
                  <span className="relative z-10">Continuar</span>
                </Button>
              </form>
            </div>
          ) : (
            <DialogHeader className="shrink-0 text-center">
              <DialogTitle className="mx-auto max-w-[85%] px-10 text-xl font-bold text-foreground">
                Desbloquear Modo Formador de Opinião
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Duração: Vitalício
              </DialogDescription>
            </DialogHeader>
          )}
          {upgradeStep === 3 && <MfoStep3Checkout email={confirmedEmail} />}
        </DialogContent>
      </Dialog>
    </main>
  );
}