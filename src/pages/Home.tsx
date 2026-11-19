import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Copy,
  Gift,
  Headset,
  LayoutDashboard,
  Megaphone,
  Menu,
  TrendingUp,
  UserPlus,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AppNavigation from "@/components/AppNavigation";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const carouselStories = [
  {
    title: "Patrimônio e cultura ganham novos olhares",
    category: "CULTURA",
    image:
      "https://images.pexels.com/photos/39722022/pexels-photo-39722022.jpeg?auto=compress&cs=tinysrgb&w=1600",
    credit: "HÜSEYİN AVCI",
  },
  {
    title: "Repórteres acompanham os acontecimentos ao vivo",
    category: "MUNDO",
    image:
      "https://images.pexels.com/photos/10464798/pexels-photo-10464798.jpeg?auto=compress&cs=tinysrgb&w=1600",
    credit: "cottonbro studio",
  },
  {
    title: "Mercados de inverno iluminam a noite",
    category: "CIDADES",
    image:
      "https://images.pexels.com/photos/29912749/pexels-photo-29912749.jpeg?auto=compress&cs=tinysrgb&w=1600",
    credit: "Ahmet Yüksek ✪",
  },
  {
    title: "A força da imprensa em tempos de mudança",
    category: "ANÁLISE",
    image:
      "https://images.pexels.com/photos/22039751/pexels-photo-22039751.jpeg?auto=compress&cs=tinysrgb&w=1600",
    credit: "Paul Espinoza",
  },
  {
    title: "Profissionais preparados para cuidar",
    category: "SAÚDE",
    image:
      "https://images.pexels.com/photos/28123668/pexels-photo-28123668.jpeg?auto=compress&cs=tinysrgb&w=1600",
    credit: "Mikhail Nilov",
  },
];

type NewsItem = {
  title: string;
  content: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt?: string;
  categories?: string[];
  category?: string;
  source?: string;
  summary?: string;
  rewritten?: boolean;
  subtitle?: string;
};

type NewsResponse = {
  source?: string;
  updatedAt?: number;
  items?: NewsItem[];
};

type CurrencyPoint = {
  date: string;
  value: number;
};

function hideSourceTerms(value = "") {
  return value
    .replace(/\brevista\s+oeste\b/gi, "a publicação")
    .replace(/\b(?:revista|oeste)\b/gi, "a publicação")
    .replace(/&#8211;|&ndash;/gi, "–")
    .replace(/[ \t]+/g, " ")
    .replace(/ *([,.;:!?])/g, "$1")
    .trim();
}

function cleanJournalisticText(value = "") {
  return value
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(
      (paragraph) =>
        paragraph &&
        !/^(?:(?:not[ií]cia|mat[eé]ria|conte[uú]do|texto)\s+(?:do|da|de)\s+(?:feed|fonte)|publicad[ao]\s+(?:pela|por)\s+fonte|fonte\s*:)/i.test(
          paragraph,
        ),
    )
    .join("\n\n");
}

function matchesNewsCategory(
  item: NewsItem,
  category: string,
  source: string,
) {
  const normalize = (value = "") =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const labels = [
    ...(item.categories || []),
    item.category,
    item.source,
  ].filter(Boolean);

  return labels.some(
    (label) =>
      normalize(label) === normalize(category) ||
      normalize(label) === normalize(source),
  );
}

function NewsThumbnail({ imageUrl, title }: { imageUrl?: string; title: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageUrl || imageFailed) {
    return (
      <div
        role="img"
        aria-label={`Capa indisponível: ${title}`}
        className="flex h-full w-full items-center justify-center rounded-lg bg-muted"
      >
        <span className="font-display text-lg font-bold tracking-[0.2em] text-primary">
          NOVIDADE
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={title}
      loading="lazy"
      onError={() => setImageFailed(true)}
      className="h-full w-full rounded-lg object-cover"
    />
  );
}

function shouldShowReferralInPreview() {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname.toLowerCase();
  if (hostname === "poderdaconsciencia.zenly.cloud") return false;

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

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSocioModalOpen, setIsSocioModalOpen] = useState(false);
  const [modalIndiqueEGanheAberto, setModalIndiqueEGanheAberto] = useState(false);
  const [fechouModalIndiqueEGanhe, setFechouModalIndiqueEGanhe] = useState(false);
  const [isAffiliateLinkOpen, setIsAffiliateLinkOpen] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState("");
  const [affiliateLinkError, setAffiliateLinkError] = useState("");
  const [affiliateLinkSaved, setAffiliateLinkSaved] = useState(false);
  const [affiliateLinkSaving, setAffiliateLinkSaving] = useState(false);

  const [referralCopyStatus, setReferralCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const [referralPeople, setReferralPeople] = useState(1);
  const [isReferralSliderInteracting, setIsReferralSliderInteracting] = useState(false);
  const [referralLinkCopied, setReferralLinkCopied] = useState(false);
  const [isSocio, setIsSocio] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isBooster, setIsBooster] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState(false);
  const articleRequestRef = useRef(0);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saberNews, setSaberNews] = useState<NewsItem[]>([]);
  const [currencyHistory, setCurrencyHistory] = useState<CurrencyPoint[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fiscalAlertOpen, setFiscalAlertOpen] = useState(false);
  const [textoIndex, setTextoIndex] = useState(0);
  const [comDestaque, setComDestaque] = useState(false);
  const socioFinalTitleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const shouldOpenSocioModal = (
      location.state as { openSocioModal?: boolean } | null
    )?.openSocioModal;

    if (!shouldOpenSocioModal) return;

    setIsSocioModalOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    const loadBoosterStatus = async (userId?: string) => {
      if (!userId) {
        if (active) {
          setIsBooster(false);
          setIsSocio(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_booster, is_socio, link_afiliado")
        .eq("id", userId)
        .maybeSingle();

      if (active) {
        setIsBooster(!error && data?.is_booster === true);
        setIsSocio(!error && data?.is_socio === true);
        const savedLink =
          !error && typeof data?.link_afiliado === "string"
            ? data.link_afiliado
            : "";
        setAffiliateLink(savedLink);
      }
    };

    void supabase.auth.getUser().then(({ data: { user } }) => {
      void loadBoosterStatus(user?.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void loadBoosterStatus(session?.user.id);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleReferralOpenChange(open: boolean) {
    if (open) {
      setModalIndiqueEGanheAberto(true);
      setFechouModalIndiqueEGanhe(false);
      setIsAffiliateLinkOpen(false);
      return;
    }

    if (!modalIndiqueEGanheAberto) return;

    setModalIndiqueEGanheAberto(false);
    setFechouModalIndiqueEGanhe(true);

    if (!supabase) {
      if (!affiliateLink.trim()) setIsAffiliateLinkOpen(true);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (!affiliateLink.trim()) setIsAffiliateLinkOpen(true);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("link_afiliado")
      .eq("id", user.id)
      .maybeSingle();

    if (error) return;

    const savedLink =
      typeof data?.link_afiliado === "string" ? data.link_afiliado : "";
    setAffiliateLink(savedLink);
    if (!savedLink.trim()) setIsAffiliateLinkOpen(true);
  }

  async function saveAffiliateLink() {
    const link = affiliateLink.trim();
    if (!link.startsWith("https://cakto.app")) {
      setAffiliateLinkError("O link precisa começar com https://cakto.app");
      setAffiliateLinkSaved(false);
      return;
    }

    if (!supabase) {
      setAffiliateLinkError("Não foi possível conectar ao serviço. Tente novamente.");
      return;
    }

    setAffiliateLinkSaving(true);
    setAffiliateLinkError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAffiliateLinkError("Entre na sua conta para salvar o link.");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({ link_afiliado: link })
        .eq("id", user.id)
        .select("link_afiliado")
        .maybeSingle();

      if (error || !data) {
        setAffiliateLinkError("Não foi possível salvar o link. Tente novamente.");
        return;
      }

      setAffiliateLink(data.link_afiliado);
      setAffiliateLinkSaved(true);
      window.setTimeout(() => setIsAffiliateLinkOpen(false), 900);
    } finally {
      setAffiliateLinkSaving(false);
    }
  }

  useEffect(() => {
    let destaqueTimeout: number | undefined;

    const labelInterval = window.setInterval(() => {
      setComDestaque(true);
      setTextoIndex((current) => (current === 0 ? 1 : 0));

      if (destaqueTimeout !== undefined) window.clearTimeout(destaqueTimeout);
      destaqueTimeout = window.setTimeout(() => setComDestaque(false), 900);
    }, 6000);

    return () => {
      window.clearInterval(labelInterval);
      if (destaqueTimeout !== undefined) window.clearTimeout(destaqueTimeout);
    };
  }, []);


  useEffect(() => {
    let isCurrent = true;

    async function loadNews() {
      setNewsLoading(true);
      setNewsError(false);

      try {
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 10000);

          try {
            const response = await fetch("https://zenly-auth-8osq.onrender.com/api/news", {
              mode: "cors",
              signal: controller.signal,
            });
            if (!response.ok) {
              throw new Error(`API de notícias respondeu com status ${response.status}`);
            }
            const payload: unknown = await response.json();
            const responseItems = Array.isArray(payload)
              ? payload
              : payload && typeof payload === "object"
                ? (payload as Record<string, unknown>).items ??
                  (payload as Record<string, unknown>).data
                : null;

            if (!Array.isArray(responseItems)) {
              throw new Error("Formato inesperado na resposta de notícias");
            }

            if (isCurrent) {
              setNewsItems(
                responseItems.map((item) => {
                  const article = item as Record<string, unknown>;
                  const category =
                    typeof article.category === "string"
                      ? hideSourceTerms(article.category)
                      : "";
                  const content =
                    typeof article.content === "string"
                      ? article.content
                      : typeof article.fullContent === "string"
                        ? article.fullContent
                        : "";

                  return {
                    ...article,
                    title: hideSourceTerms(
                      typeof article.title === "string" ? article.title : "",
                    ),
                    content: hideSourceTerms(content),
                    summary: hideSourceTerms(
                      typeof article.summary === "string" ? article.summary : "",
                    ),
                    sourceUrl:
                      typeof article.sourceUrl === "string"
                        ? article.sourceUrl
                        : typeof article.link === "string"
                          ? article.link
                          : "",
                    publishedAt:
                      typeof article.publishedAt === "string"
                        ? article.publishedAt
                        : typeof article.date === "string"
                          ? article.date
                          : undefined,
                    imageUrl:
                      typeof article.imageUrl === "string"
                        ? article.imageUrl
                        : undefined,
                    categories: Array.isArray(article.categories)
                      ? article.categories
                          .filter((label): label is string => typeof label === "string")
                          .map(hideSourceTerms)
                      : category
                        ? [category]
                        : [],
                  } as NewsItem;
                }),
              );
            }
            return;
          } catch (error) {
            console.error(`[notícias] Tentativa ${attempt}/3 falhou:`, error);
            if (attempt < 3) {
              await new Promise((resolve) => window.setTimeout(resolve, 700 * attempt));
            }
          } finally {
            window.clearTimeout(timeout);
          }
        }

        if (isCurrent) setNewsError(true);
      } finally {
        if (isCurrent) setNewsLoading(false);
      }
    }

    loadNews();
    const timer = window.setInterval(loadNews, 12 * 60 * 60 * 1000);

    return () => {
      isCurrent = false;
      window.clearInterval(timer);
    };
  }, [refreshKey]);



  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % carouselStories.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  const story = carouselStories[activeSlide];
  const latestCurrencyPoint = currencyHistory.reduce<CurrencyPoint | null>(
    (latest, point) =>
      !latest || point.date > latest.date ? point : latest,
    null,
  );
  const editionBulletinPattern =
    /\b(?:jornal|noticiário)\b.*\b(?:edição|assista|acompanhe)\b|\b(?:assista|acompanhe)\s+(?:ao\s+)?(?:noticiário|jornal)\b|\b(?:primeira|segunda|terceira|quarta|última)\s+edição\b/i;
  const seenNews = new Set<string>();
  const feedNews = (Array.isArray(newsItems) ? newsItems : []).filter((item) => {
    if (editionBulletinPattern.test(item.title || "")) return false;

    const normalizedTitle = (item.title || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    let normalizedUrl = item.sourceUrl || "";

    try {
      const url = new URL(normalizedUrl);
      url.hash = "";
      url.search = "";
      normalizedUrl = `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`;
    } catch {
      // Usa o endereço original para identificar itens com URL inválida.
    }

    const identity = normalizedUrl || normalizedTitle;
    if (!identity || seenNews.has(identity) || seenNews.has(`title:${normalizedTitle}`)) {
      return false;
    }

    seenNews.add(identity);
    seenNews.add(`title:${normalizedTitle}`);
    return true;
  });

  const latestNewsItems = feedNews.slice(0, 6);
  const latestNewsUrls = new Set(latestNewsItems.map((item) => item.sourceUrl));
  const generalNewsItems = feedNews.filter((item) =>
    matchesNewsCategory(item, "Geral", "Geral"),
  );
  const fallbackNewsItems =
    generalNewsItems.length > 0 ? generalNewsItems : feedNews;
  const integralCategoryNewsItems = feedNews.filter((item) =>
    matchesNewsCategory(item, "Na Íntegra", "Vermelho - Movimentos"),
  );
  const integralNewsItems = (
    integralCategoryNewsItems.length > 0
      ? integralCategoryNewsItems
      : fallbackNewsItems
  ).slice(0, 4);
  const agroCategoryNewsItems = feedNews.filter((item) =>
    matchesNewsCategory(item, "Agronegócio", "Brasil 247 - Agro"),
  );
  const agroCategoryNews =
    agroCategoryNewsItems.length > 0
      ? agroCategoryNewsItems
      : fallbackNewsItems;
  const displayedNewsUrls = new Set(
    [...latestNewsItems, ...integralNewsItems].map((item) => item.sourceUrl),
  );
  const seenRadarText = new Set<string>();
  const radarNewsItems = feedNews
    .filter((item) =>
      matchesNewsCategory(item, "No Seu Radar", "No Seu Radar"),
    )
    .filter((item) => {
      const normalizeText = (value = "") =>
        value
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();

      const title = normalizeText(item.title);
      const summary = normalizeText(item.summary || item.content);
      const texts = [title, summary].filter(Boolean);

      if (!title || texts.some((text) => seenRadarText.has(text))) {
        return false;
      }

      texts.forEach((text) => seenRadarText.add(text));
      return true;
    })
    .slice(0, 8);
  const radarNewsUrls = new Set(radarNewsItems.map((item) => item.sourceUrl));
  const additionalNewsItems = feedNews
    .filter(
      (item) =>
        !displayedNewsUrls.has(item.sourceUrl) &&
        !radarNewsUrls.has(item.sourceUrl),
    )
    .slice(0, 16);

  useEffect(() => {
    if (newsLoading || radarNewsItems.length > 0) return;

    let isCurrent = true;
    setFallbackLoading(true);
    setSaberNews([]);
    setCurrencyHistory([]);

    async function loadFallbacks() {
      try {
        const response = await fetch("https://zenly-auth-8osq.onrender.com/api/saber");
        if (!response.ok) throw new Error("Gazeta do Povo indisponível");
        const data = (await response.json()) as NewsResponse;
        const items = Array.isArray(data.items) ? data.items : [];

        if (!isCurrent) return;
        if (items.length > 0) {
          setSaberNews(items);
          return;
        }
      } catch (error) {
        console.error("[radar] Não foi possível carregar as notícias alternativas:", error);
        // Se as notícias não estiverem disponíveis, tenta carregar a cotação.
      }

      try {
        const currencyResponse = await fetch("https://zenly-auth-8osq.onrender.com/api/usd-brl");
        if (!currencyResponse.ok) throw new Error("Cotação indisponível");
        const currencyData = (await currencyResponse.json()) as {
          items?: CurrencyPoint[];
        };
        if (isCurrent) setCurrencyHistory(currencyData.items || []);
      } catch (error) {
        console.error("[radar] Não foi possível carregar a cotação:", error);
        if (isCurrent) setCurrencyHistory([]);
      } finally {
        if (isCurrent) setFallbackLoading(false);
      }
    }

    loadFallbacks();
    return () => {
      isCurrent = false;
    };
  }, [newsLoading, radarNewsItems.length]);

async function openNews(item: NewsItem) {
    const requestId = ++articleRequestRef.current;
    setSelectedNews(item);
    setArticleError(false);
    setArticleLoading(false);

    if (!item.sourceUrl.includes("revistaoeste.com")) return;

    setArticleLoading(true);
    try {
      const response = await fetch(
        `https://zenly-auth-8osq.onrender.com/api/article?url=${encodeURIComponent(item.sourceUrl)}`,
      );
      if (!response.ok) throw new Error("Texto completo indisponível");
      const article = (await response.json()) as NewsItem;

      if (articleRequestRef.current === requestId) {
        setSelectedNews((current) =>
          current?.sourceUrl === item.sourceUrl
            ? { ...current, ...article, sourceUrl: item.sourceUrl }
            : current,
        );
      }
    } catch {
      if (articleRequestRef.current === requestId) setArticleError(true);
    } finally {
      if (articleRequestRef.current === requestId) setArticleLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] max-sm:overflow-x-clip sm:pb-0">
      <AppNavigation />


      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8 lg:px-8 lg:py-12">
        <section id="urgente" aria-label="Notícias urgentes">
          <div className="mb-5 flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="gap-2 bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground" />
                NOTÍCIAS URGENTES
              </Badge>
              <span className="text-sm text-muted-foreground">
                Atualização contínua
              </span>
            </div>

            <div className="relative z-50">
              <button
                type="button"
                aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-black shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Menu className="size-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 w-64 rounded-lg border border-white/30 bg-neutral-500/25 p-2 shadow-lg backdrop-blur-xl">
                  {isBooster ? (
                    <div className="rounded-md border border-white/40 bg-white/95 px-3 py-3 text-sm font-medium text-gray-800">
                      Sócio Vitalício Ativo
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setIsSocioModalOpen(true);
                      }}
                      className="block w-full rounded-md border border-white/60 bg-white/95 px-3 py-3 text-left text-gray-900 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="membership-gradient-title block bg-clip-text text-sm font-bold text-transparent">Torne-se sócio</span>
                      <span className="mt-1 block text-xs text-gray-600">
                        Impulsione o Portal Voz do Povo...
                      </span>
                    </button>
                  )}
                  {/* Regra oficial de permissão: isSocio && ( */}
                  {(isSocio || shouldShowReferralInPreview()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setModalIndiqueEGanheAberto(true);
                        setFechouModalIndiqueEGanhe(false);
                        setIsAffiliateLinkOpen(false);
                      }}
                      className="mt-2 block w-full rounded-md border border-white/60 bg-white/95 px-3 py-3 text-left text-gray-900 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex items-center gap-2 text-sm font-bold">
                        <Gift className="size-4" aria-hidden="true" />
                        Indique e ganhe
                      </span>
                    </button>
                  )}
                </div>
              )}
              {isAffiliateLinkOpen &&
                fechouModalIndiqueEGanhe &&
                !affiliateLink.trim() && (
                <div
                  className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[70] max-h-[calc(100dvh-7.5rem)] w-[calc(100vw-2rem)] max-w-[320px] overflow-y-auto rounded-[26px] border-2 p-0 text-white shadow-[0_14px_36px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-2xl sm:bottom-6"
                  style={{
                    borderColor: "rgba(185, 192, 202, 0.78)",
                    background:
                      "linear-gradient(160deg, rgba(150,156,166,0.86) 0%, rgba(91,97,107,0.90) 48%, rgba(48,53,61,0.94) 100%)",
                    backdropFilter: "blur(28px) saturate(180%)",
                    WebkitBackdropFilter: "blur(28px) saturate(180%)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-[26px] bg-gradient-to-b from-white/25 to-transparent"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.10]"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Fechar pop-up"
                    onClick={() => setIsAffiliateLinkOpen(false)}
                    className="absolute right-3 top-3 z-20 size-8 rounded-full text-white hover:bg-white/15 hover:text-white"
                  >
                    <X className="size-4" />
                  </Button>

                  <div className="relative z-10 p-4 pt-10">
                    <div className="text-left">
                      <h2 className="text-lg font-bold leading-tight text-white">
                        Salve seu link de indicação
                      </h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-white/90">
                        Cole abaixo o seu link exclusivo da Cakto para deixá-lo salvo aqui no app.
                      </p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Input
                        type="url"
                        value={affiliateLink}
                        onChange={(event) => {
                          setAffiliateLink(event.target.value);
                          setAffiliateLinkError("");
                          setAffiliateLinkSaved(false);
                        }}
                        placeholder="https://cakto.app/..."
                        aria-label="Link de indicação da Cakto"
                        aria-invalid={Boolean(affiliateLinkError)}
                        className="h-10 rounded-xl border-white bg-white px-3 text-sm text-zinc-950 placeholder:text-zinc-500 focus-visible:ring-white/70"
                      />

                      {affiliateLinkError && (
                        <p
                          role="alert"
                          className="rounded-lg border border-red-200/50 bg-red-950/35 px-2.5 py-1.5 text-xs font-medium text-white"
                        >
                          {affiliateLinkError}
                        </p>
                      )}

                      <Button
                        type="button"
                        onClick={saveAffiliateLink}
                        disabled={affiliateLinkSaving}
                        className="h-10 w-full rounded-xl bg-white text-sm font-bold tracking-wide text-zinc-900 shadow-lg hover:bg-white/90 disabled:opacity-75"
                      >
                        {affiliateLinkSaving
                          ? "SALVANDO..."
                          : affiliateLinkSaved
                            ? "Link salvo!"
                            : "SALVAR MEU LINK"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Dialog
                open={modalIndiqueEGanheAberto}
                onOpenChange={handleReferralOpenChange}
              >
                <DialogContent
                  showCloseButton={false}
                  className="fixed inset-0 left-0 top-0 z-[60] isolate block h-dvh min-h-dvh w-screen max-w-none translate-x-0 translate-y-0 overflow-x-hidden overflow-y-auto overscroll-contain rounded-none border-0 bg-background p-0 opacity-100 shadow-2xl backdrop-blur-none sm:max-w-none"
                  style={{ backgroundColor: "#FFFFFF", opacity: 1, backdropFilter: "none" }}
                >
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Fechar Indique e Ganhe"
                      className="absolute right-4 top-4 z-20 size-10 rounded-xl border border-border bg-background text-foreground shadow-sm transition-all hover:border-destructive hover:bg-muted focus-visible:ring-2 focus-visible:ring-destructive sm:right-6 sm:top-6"
                    >
                      <X className="size-5" />
                    </Button>
                  </DialogClose>

                  <div className="mx-auto w-full max-w-5xl px-4 pb-8 pt-16 sm:px-8 sm:pb-10 sm:pt-16">
                    <DialogHeader className="mx-auto max-w-6xl items-center px-5 py-7 text-center sm:px-8 sm:py-9">
                      <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
                        <Gift className="size-5" aria-hidden="true" />
                      </span>
                      <DialogTitle className="mx-auto w-full max-w-3xl text-center font-display text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
                        Uma conversa leva a Voz do Povo a mais gente...
                      </DialogTitle>
                      <DialogDescription className="mt-3 max-w-2xl text-center text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                        Indique o portal a pessoas que possam se interessar — em uma conversa, grupo ou rede social.{" "}
                        <strong>As novas assinaturas feitas pelo seu link podem gerar comissão.</strong>
                      </DialogDescription>
                    </DialogHeader>

                    <div className="mx-auto mt-5 max-w-4xl space-y-4 px-5 py-4 text-sm leading-7 text-black sm:px-8 sm:py-5 sm:text-base">
                      <p>
                        Ser sócio é muito mais do que ter acesso a um conteúdo exclusivo. É acreditar que a informação deve chegar a todos, que diferentes vozes merecem ser ouvidas e que uma sociedade mais consciente começa pelo conhecimento.
                      </p>
                      <p>
                        O Voz do Povo nasceu para dar espaço a diferentes perspectivas, ampliar o acesso à informação e permitir que cada pessoa forme suas próprias opiniões.
                      </p>
                      <p>
                        Mas uma iniciativa como essa não cresce sozinha. Ela precisa de pessoas que acreditam em seu propósito e estejam dispostas a apresentá-la a outras pessoas.
                      </p>
                      <p>
                        Por isso, fale sobre o Voz do Povo com seus amigos, compartilhe com sua família e apresente o portal às pessoas que fazem parte da sua vida.
                      </p>
                      <p>
                        Você já conhece o nosso trabalho. Agora, ajude outras pessoas a conhecê-lo também.
                      </p>
                      <p>
                        Uma conversa pode despertar a curiosidade. Uma indicação pode conquistar um novo sócio. E cada pessoa alcançada ajuda o Voz do Povo a chegar ainda mais longe.
                      </p>
                    </div>

                    <div className="mx-auto mt-5 max-w-4xl px-5 text-center sm:px-8">
                      <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        Fácil e rápido
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                        Toda grande iniciativa começa com pessoas que acreditam nela.
                      </p>
                    </div>

                    <section
                      aria-label="Passo a passo para indicar"
                      className="mt-4 grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-muted/30 md:grid-cols-3 md:divide-x md:divide-border [&~*]:hidden"
                    >
                      {[
                        {
                          number: "1",
                          title: "Como divulgar",
                          description:
                            "Aprenda a compartilhar o Voz do Povo e apresentar o portal a outras pessoas usando seu link de indicação.",
                          action: "Saiba mais",
                        },
                        {
                          number: "2",
                          title: "Como criar sua conta para receber comissões",
                          description:
                            "Veja como configurar sua conta de afiliado e informar seus dados para receber as comissões pelas indicações.",

                        },
                        {
                          number: "3",
                          title: "Acompanhe seus convites",
                          description:
                            "Descubra como acompanhar suas indicações, verificar novas adesões e consultar suas comissões.",
                        },
                      ].map((step) => (
                        <Card
                          key={step.number}
                          className="flex h-full flex-col rounded-none border-0 bg-transparent shadow-none transition-colors duration-200 hover:bg-background/70"
                        >
                          <CardHeader className="flex-row items-center gap-3 space-y-0 p-4 pb-2 sm:p-5 sm:pb-2">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive text-sm font-bold text-destructive-foreground">
                              {step.number}
                            </span>
                            <CardTitle className="font-display text-sm font-semibold leading-snug tracking-tight sm:text-base">
                              {step.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-1 flex-col px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
                            <p className="text-sm leading-6 text-muted-foreground">
                              {step.description}
                            </p>
                            {step.action && (
                              <div className="mt-auto pt-4">
                                <Button
                                  type="button"
                                  disabled
                                  className="h-auto min-h-11 w-full whitespace-normal rounded-xl bg-gradient-to-r from-[#5865F2] via-[#404EED] to-[#7289DA] py-2.5 text-center font-semibold leading-snug shadow-sm transition-all hover:shadow-md disabled:opacity-100"
                                >
                                  {step.action}
                                </Button>

                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      <section
                        aria-labelledby="referral-first-step-title"
                        className="col-span-full bg-white px-6 py-10 text-center sm:px-10 sm:py-12"
                      >
                        <span
                          aria-hidden="true"
                          className="mx-auto mb-5 block h-1 w-12 rounded-full bg-destructive"
                        />
                        <h2
                          id="referral-first-step-title"
                          className="font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl"
                        >
                          Tudo começa com um primeiro passo.
                        </h2>
                        <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
                          É mais simples do que parece! Preparamos um passo a passo para mostrar como compartilhar o Voz do Povo, convidar novas pessoas e receber comissões por cada adesão realizada através da sua indicação.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate("/comeceporaqui")}
                          className="group relative isolate mx-auto mt-7 flex min-h-24 w-full max-w-3xl items-center justify-center overflow-hidden rounded-2xl border border-[#5865F2]/70 bg-gradient-to-r from-[#5865F2] via-[#404EED] to-[#7289DA] px-12 py-5 text-center text-white shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_10px_28px_rgba(64,78,237,0.38),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25),0_14px_32px_rgba(64,78,237,0.48),inset_0_1px_0_rgba(255,255,255,0.4)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2]/50"
                        >
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-[3px] rounded-[13px] border border-white/35"
                          />
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),transparent_45%,rgba(64,78,237,0.16))]"
                          />
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-[radial-gradient(ellipse_at_left,rgba(255,255,255,0.28),transparent_72%)]"
                          />
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[radial-gradient(ellipse_at_right,rgba(255,255,255,0.3),transparent_72%)]"
                          />
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-2 right-5 w-16 rounded-r-xl bg-[radial-gradient(circle,rgba(255,255,255,0.75)_1px,transparent_1.5px)] [background-size:7px_7px] opacity-50"
                          />
                          <span className="relative z-10 font-display text-base font-extrabold tracking-[0.14em] text-white sm:text-lg">
                            COMECE POR AQUI
                          </span>
                          <ArrowRight
                            className="absolute right-7 z-10 size-6 text-white transition-transform duration-200 group-hover:translate-x-1"
                            aria-hidden="true"
                          />
                        </button>



                        <section
                          aria-labelledby="referral-commission-title"
                          className="mx-auto mt-10 w-full max-w-6xl text-left"
                        >
                          <h2
                            id="referral-commission-title"
                            className="text-center font-display text-3xl font-black leading-tight tracking-tight text-zinc-950 sm:text-4xl md:text-5xl"
                          >
                            Um único convite. Você ganha{" "}
                            <span className="bg-gradient-to-r from-zinc-500 via-zinc-950 to-zinc-500 bg-clip-text text-transparent">
                              90% de comissão!
                            </span>
                          </h2>

                          <div className="relative mt-7 overflow-hidden border border-zinc-500/40 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(105deg,rgba(255,255,255,0.025)_0px,rgba(255,255,255,0.025)_1px,transparent_1px,transparent_4px)]"
                            />
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(rgba(255,255,255,0.8)_0.7px,transparent_0.7px)] [background-size:8px_8px]"
                            />
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/[0.025] blur-3xl"
                            />

                            <div className="relative grid grid-cols-1 lg:grid-cols-2">
                              <div className="p-5 sm:p-7 lg:border-r lg:border-white/15 lg:p-8">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
                                  Seus ganhos
                                </p>
                                <div className="mt-6 space-y-3">
                                  {[
                                    { guests: "5 pessoas convidadas", amount: "R$ 44,55 por mês" },
                                    { guests: "10 pessoas convidadas", amount: "R$ 89,10 por mês" },
                                    { guests: "100 pessoas convidadas", amount: "R$ 891,00 por mês" },
                                  ].map((example) => (
                                    <div
                                      key={example.guests}
                                      className="flex flex-col gap-1 border-b border-white/15 px-3 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-2"
                                    >
                                      <span className="text-sm font-medium text-zinc-300 sm:text-base">
                                        {example.guests}
                                      </span>
                                      <span className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
                                        {example.amount}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="relative flex min-h-[260px] flex-col items-center justify-center overflow-hidden border-t border-white/15 p-6 text-center sm:p-8 lg:border-l lg:border-t-0">
                                <div
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.045),transparent_65%)]"
                                />
                                <p className="relative z-10 max-w-sm text-sm font-medium leading-relaxed text-zinc-200 sm:text-base">
                                  Você indica. O Voz do Povo cresce. E 90% da comissão fica com você!
                                </p>
                                <div className="relative z-10 my-3 font-display text-5xl font-bold leading-none tracking-tight text-[#36B37E] sm:text-6xl">
                                  90%
                                </div>
                                <span className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
                                  da comissão é sua
                                </span>
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute bottom-8 left-1/2 h-px w-36 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                                />
                              </div>
                            </div>
                          </div>

                          <section
                            aria-labelledby="referral-faq-title"
                            className="mt-8 rounded-2xl border border-border bg-muted/30 p-5 text-left sm:p-7"
                          >
                            <header className="mb-3">
                              <h3
                                id="referral-faq-title"
                                className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                              >
                                Ficou com alguma dúvida?
                              </h3>
                              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                Para entender melhor como funciona, tire suas dúvidas aqui.
                              </p>
                            </header>

                            <Accordion type="single" collapsible>
                              {[
                                {
                                  question: "Como funciona o programa de indicações?",
                                  answer:
                                    "Você compartilha seu link exclusivo e convida outras pessoas a conhecerem o Voz do Povo. Cada assinatura válida realizada por meio da sua indicação garante a você 90% de comissão.",
                                },
                                {
                                  question: "Como posso compartilhar meu link?",
                                  answer:
                                    "Após configurar sua conta, seu link exclusivo estará disponível para compartilhamento. Copie e envie pelo WhatsApp, redes sociais, grupos ou diretamente para seus amigos e familiares.",
                                },
                                {
                                  question: "Como minhas indicações são contabilizadas?",
                                  answer:
                                    "Todas as indicações realizadas pelo seu link exclusivo são identificadas e vinculadas à sua conta. Cada nova assinatura originada pelo seu convite fica associada ao seu cadastro.",
                                },
                                {
                                  question: "Onde posso acompanhar meus resultados?",
                                  answer:
                                    "Na sua área de acompanhamento, você consulta suas indicações, acompanha novas adesões e visualiza suas comissões.",
                                },
                                {
                                  question: "Como funciona o recebimento das comissões?",
                                  answer:
                                    "Você recebe 90% de comissão sobre cada assinatura válida realizada por meio do seu link exclusivo. Para receber, configure sua conta e informe seus dados de pagamento.",
                                },
                                {
                                  question: "Preciso pagar alguma coisa para participar?",
                                  answer:
                                    "Não! Ser sócio do Voz do Povo já garante a você o direito de convidar novas pessoas, compartilhar seu link exclusivo e receber uma das comissões mais cobiçadas do mercado. É um benefício exclusivo de quem faz parte do nosso projeto, sem nenhuma taxa adicional para participar.\n\nAproveite esse benefício, compartilhe seu convite e ajude o Voz do Povo a chegar ainda mais longe!",
                                },
                                {
                                  question: "Posso compartilhar meu convite nas redes sociais?",
                                  answer:
                                    "Sim! Compartilhe seu link pelo WhatsApp, Instagram, Facebook, grupos ou qualquer outro canal de comunicação. Quanto mais pessoas conhecerem o Voz do Povo por meio do seu convite, maior será o alcance das suas indicações.",
                                },
                                {
                                  question: "O que acontece se alguém cancelar a assinatura?",
                                  answer:
                                    "Se alguém cancelar a assinatura, você deixa de receber comissões pelas próximas mensalidades dessa pessoa. Mas as comissões já geradas pelas mensalidades pagas continuam sendo suas, respeitando as condições de pagamento.",
                                },
                              ].map(({ question, answer }, index) => (
                                <AccordionItem
                                  key={question}
                                  value={`referral-program-faq-${index + 1}`}
                                  className="border-border"
                                >
                                  <AccordionTrigger className="py-4 text-left text-sm font-semibold leading-6 text-foreground hover:no-underline [&>svg]:text-[#36B37E] sm:text-base">
                                    {question}
                                  </AccordionTrigger>
                                  <AccordionContent className="pb-4 text-sm leading-6 text-muted-foreground">
                                    {answer}
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </section>

                          <section
                            aria-labelledby="referral-simulator-title"
                            className="mt-6 rounded-xl border border-border bg-background p-5 shadow-sm sm:p-8"
                          >
                            <header>
                              <h3
                                id="referral-simulator-title"
                                className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                              >
                                Veja o potencial das suas indicações
                              </h3>
                              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                Veja quanto você recebe mensalmente convidando outras pessoas:
                              </p>
                            </header>

                            <div className="mx-auto mt-8 w-full max-w-4xl">
                              <div className="mb-5 flex items-end justify-between gap-4">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Indicações selecionadas
                                </p>
                                <p
                                  aria-live="polite"
                                  className="font-display text-2xl font-semibold leading-none tracking-tight text-foreground sm:text-3xl"
                                >
                                  {referralPeople}{" "}
                                  <span className="text-base font-medium text-muted-foreground sm:text-lg">
                                    pessoas
                                  </span>
                                </p>
                              </div>

                              <Slider
                                aria-label="Quantidade de pessoas convidadas"
                                min={1}
                                max={500}
                                step={1}
                                value={[referralPeople]}
                                onValueChange={(values) => setReferralPeople(values[0] ?? 1)}
                                data-animating={!isReferralSliderInteracting}
                                onPointerDown={() => setIsReferralSliderInteracting(true)}
                                onPointerUp={() => setIsReferralSliderInteracting(false)}
                                onPointerCancel={() => setIsReferralSliderInteracting(false)}
                                onKeyDown={() => setIsReferralSliderInteracting(true)}
                                onKeyUp={() => setIsReferralSliderInteracting(false)}
                                onBlur={() => setIsReferralSliderInteracting(false)}
                                className="referral-slider py-2 [&_[data-slot=slider-range]]:bg-[#36B37E] [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-[#36B37E] [&_[data-slot=slider-thumb]]:bg-background [&_[data-slot=slider-thumb]]:shadow-sm [&_[data-slot=slider-track]]:h-1"
                              />
                              <div className="mt-3 flex justify-between text-xs font-medium text-muted-foreground">
                                <span>1</span>
                                <span>500</span>
                              </div>

                              <div className="mt-8 rounded-lg border border-border bg-muted/30 px-5 py-5 sm:px-7 sm:py-6">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Comissão mensal estimada
                                </p>
                                <p
                                  aria-live="polite"
                                  className="mt-2 font-display text-3xl font-bold tracking-tight text-[#36B37E] sm:text-4xl"
                                >
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format((referralPeople * 891) / 100)}
                                </p>
                                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                                  A considerar que todos os seus convidados continuem ativos no portal.
                                </p>
                              </div>
                            </div>
                          </section>

                          <section
                            aria-labelledby="referral-confirmation-title"
                            className="relative left-1/2 mt-6 w-[calc(100vw-2rem)] max-w-[60rem] -translate-x-1/2 rounded-2xl border border-[#36B37E]/30 bg-[linear-gradient(115deg,#FFFFFF_0%,#F5F6F8_35%,#E9EAED_68%,#DCDDDF_100%)] px-5 py-8 text-center shadow-sm sm:w-[calc(100vw-4rem)] sm:px-8 sm:py-10"
                          >
                            <h3
                              id="referral-confirmation-title"
                              className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                            >
                              Você já leu todo o passo a passo?
                            </h3>
                            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                              Antes de continuar, certifique-se de que leu e compreendeu todas as etapas para compartilhar seu convite, configurar sua conta e acompanhar suas comissões.
                            </p>
                            <Button
                              type="button"
                              onClick={() =>
                                window.location.assign(
                                  "https://app.cakto.com.br/affiliate/invite/9a8924d5-b744-4b61-b184-e20992fd96b7",
                                )
                              }
                              className="mt-6 min-h-12 w-full rounded-xl border border-[#5865F2]/70 bg-gradient-to-r from-[#5865F2] via-[#404EED] to-[#7289DA] px-6 font-bold text-white shadow-sm disabled:cursor-default disabled:opacity-100 sm:w-auto"
                            >
                              SIM, CONTINUAR
                            </Button>
                            <div className="relative flex flex-col items-center">
                              <button
                                type="button"
                                aria-live="polite"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(
                                      "https://app.cakto.com.br/affiliate/invite/9a8924d5-b744-4b61-b184-e20992fd96b7",
                                    );
                                    setReferralLinkCopied(true);
                                    window.setTimeout(
                                      () => setReferralLinkCopied(false),
                                      2200,
                                    );
                                  } catch {
                                    setReferralLinkCopied(false);
                                  }
                                }}
                                className="mx-auto mt-2 inline-flex min-h-11 items-center justify-center px-3 text-center text-xs leading-relaxed text-muted-foreground transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                              >
                                Não conseguiu acessar? Copie este link para colar no seu navegador.
                              </button>
                              <div
                                role="status"
                                aria-live="polite"
                                aria-hidden={!referralLinkCopied}
                                className={`pointer-events-none absolute left-1/2 top-full z-20 mt-1 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-lg border border-border bg-background/95 px-3 py-2 text-sm font-medium text-foreground shadow-md transition-all duration-200 ease-out ${
                                  referralLinkCopied
                                    ? "translate-y-0 opacity-100"
                                    : "translate-y-1 opacity-0"
                                }`}
                              >
                                <Check className="size-4 text-primary" aria-hidden="true" />
                                Link copiado com sucesso!
                              </div>
                            </div>
                            <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                              Ainda não leu? Volte ao material e confira todas as etapas.
                            </p>
                          </section>
                        </section>
                      </section>
                    </section>

                    <div className="mx-auto mt-5 grid w-full max-w-6xl grid-cols-1 gap-3 lg:grid-cols-12 lg:items-start">
                      <section
                        aria-labelledby="referral-link-heading"
                        className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-muted/30 p-5 shadow-sm sm:col-span-5 sm:p-6 lg:col-span-5"
                      >
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-destructive">
                          Rede de indicação
                        </p>
                        <h2 id="referral-link-heading" className="mt-1 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                          Seu link de indicação
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          As indicações serão contabilizadas quando as pessoas acessarem o Voz do Povo pelo seu link individual.
                        </p>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <div
                            role="status"
                            aria-label="Link individual de indicação"
                            className="flex min-h-12 min-w-0 flex-1 items-center break-all rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-muted-foreground"
                          >
                            {affiliateLink || "Seu link individual ainda não foi salvo."}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              setAffiliateLinkError("");
                              setAffiliateLinkSaved(false);
                              setIsAffiliateLinkOpen(true);
                            }}
                            className="w-full shrink-0 gap-2 rounded-lg px-5 font-semibold shadow-sm transition-all hover:shadow-md sm:w-auto"
                          >
                            <Copy className="size-4" aria-hidden="true" />
                            Editar link
                          </Button>
                        </div>
                      </section>

                      <section
                        aria-labelledby="referral-whatsapp-heading"
                        className="overflow-hidden rounded-2xl border border-border bg-background p-5 shadow-sm sm:col-span-7 sm:p-6 lg:col-span-7"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 border-l-2 border-destructive pl-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
                              Convite pronto para compartilhar
                            </p>
                            <h2 id="referral-whatsapp-heading" className="mt-1 font-display text-xl font-bold tracking-tight">
                              Um convite que soa como você
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Compartilhe com alguém que possa gostar do portal. A mensagem é só um ponto de partida: envie no seu ritmo.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant={referralCopyStatus === "success" ? "secondary" : "destructive"}
                            className="w-full shrink-0 gap-2 rounded-lg px-5 font-semibold shadow-sm transition-all hover:shadow-md sm:w-auto"
                            aria-live="polite"
                            onClick={async () => {
                              const message =
                                "Oi! Encontrei o Voz do Povo, um portal independente com espaço para diferentes vozes. Achei que você poderia gostar: [cole aqui seu link VIP]";
                              try {
                                await navigator.clipboard.writeText(message);
                                setReferralCopyStatus("success");
                                window.setTimeout(() => setReferralCopyStatus("idle"), 2200);
                              } catch {
                                setReferralCopyStatus("error");
                                window.setTimeout(() => setReferralCopyStatus("idle"), 3000);
                              }
                            }}
                          >
                            {referralCopyStatus === "success" ? (
                              <Check className="size-4" aria-hidden="true" />
                            ) : (
                              <Copy className="size-4" aria-hidden="true" />
                            )}
                            {referralCopyStatus === "success"
                              ? "Mensagem copiada!"
                              : referralCopyStatus === "error"
                                ? "Não foi possível copiar"
                                : "Copiar mensagem"}
                          </Button>
                        </div>
                        <p className="mt-4 rounded-xl border border-border border-l-2 border-l-destructive bg-muted/60 p-4 text-sm leading-6 text-foreground sm:p-5 sm:leading-7">
                          Oi! Encontrei o Voz do Povo, um portal independente com espaço para diferentes vozes. Achei que você poderia gostar: [cole aqui seu link VIP]
                        </p>
                      </section>

                      <section
                      aria-labelledby="referral-materials-heading"
                      className="rounded-2xl border border-border bg-muted/50 p-5 sm:col-span-7 sm:p-6 lg:col-span-7"
                    >
                        <div className="mb-4 border-l-2 border-destructive pl-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
                            Para ampliar o alcance
                          </p>
                          <h2 id="referral-materials-heading" className="mt-1 font-display text-2xl font-bold tracking-tight">
                            Materiais para compartilhar
                          </h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Escolha o formato que combina com a conversa. Os materiais oficiais serão disponibilizados aqui quando estiverem prontos.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {[
                            {
                              number: "01",
                              title: "Stories",
                              description: "Conteúdos verticais para compartilhar o portal nos seus Stories.",
                            },
                            {
                              number: "02",
                              title: "Publicações para redes sociais",
                              description: "Publicações para apresentar o portal no seu perfil e abrir uma conversa.",
                            },
                            {
                              number: "03",
                              title: "Vídeos",
                              description: "Vídeos para mostrar o portal de um jeito direto e pessoal.",
                            },
                            {
                              number: "04",
                              title: "Textos prontos",
                              description: "Sugestões de texto para começar uma conversa com seus contatos.",
                            },
                          ].map((material) => (
                            <article
                              key={material.number}
                              className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 shadow-sm transition-colors hover:border-destructive sm:p-4"
                            >
                              <span className="font-display text-sm font-bold text-destructive">
                                {material.number}
                              </span>
                              <div>
                                <h3 className="text-sm font-semibold">{material.title}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                  {material.description}
                                </p>
                                <span className="mt-3 inline-flex rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                  Material em preparação
                                </span>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>

                      <section aria-labelledby="referral-faq-heading" className="rounded-2xl border border-border bg-background p-5 sm:col-span-5 sm:p-6 lg:col-span-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
                          Informações
                        </p>
                        <h2 id="referral-faq-heading" className="mt-1 font-display text-2xl font-bold tracking-tight">
                          Dúvidas frequentes
                        </h2>
                        <Accordion type="single" collapsible className="mt-2">
                          {[
                            {
                              question: "Como começo a participar?",
                              answer:
                                "Siga as etapas acima: crie sua conta gratuita na Cakto e solicite seu link individual de indicação quando essa opção estiver disponível.",
                            },
                            {
                              question: "Como as indicações são contabilizadas?",
                              answer:
                                "As indicações são associadas ao link individual. Compartilhe o link oficial com seus amigos e grupos quando ele for liberado.",
                            },
                            {
                              question: "Como funcionam as comissões e os pagamentos?",
                              answer:
                                "As comissões estão relacionadas às novas assinaturas feitas pelo seu link. Os valores e prazos de pagamento não estão informados nesta página.",
                            },
                            {
                              question: "Onde encontro meu link?",
                              answer:
                                "O espaço do link individual está nesta página. Ele poderá ser copiado quando o acesso de afiliado e o link oficial forem disponibilizados.",
                            },
                            {
                              question: "Como posso divulgar o Voz do Povo?",
                              answer:
                                "Você pode compartilhar a mensagem pronta por WhatsApp e apresentar o portal a amigos, familiares e grupos. Os materiais oficiais serão publicados nesta página quando estiverem disponíveis.",
                            },
                          ].map(({ question, answer }, index) => (
                            <AccordionItem
                              key={question}
                              value={`referral-faq-${index + 1}`}
                              className="border-border"
                            >
                              <AccordionTrigger className="py-3 text-left text-sm font-semibold leading-relaxed hover:text-destructive hover:no-underline">
                                {question}
                              </AccordionTrigger>
                              <AccordionContent className="pb-4 text-sm leading-6 text-muted-foreground">
                                {answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </section>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden rounded-none bg-foreground">
            <img
              src={story.image}
              alt={story.title}
              className="h-[20rem] w-full object-cover opacity-75 transition-opacity duration-500 sm:h-[24rem] lg:h-[30rem]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-background sm:p-6 md:p-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-background/70 sm:mb-3">
                {story.category}
              </p>
              <h1 className="max-w-3xl font-display text-2xl font-bold leading-tight sm:text-3xl md:text-5xl">
                {story.title}
              </h1>

            </div>
            <div className="absolute bottom-4 right-4 flex gap-1.5 sm:bottom-6 sm:right-6">
              {carouselStories.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  aria-label={`Mostrar notícia ${index + 1}`}
                  onClick={() => setActiveSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeSlide
                      ? "w-8 bg-background"
                      : "w-2 bg-background/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="noticias" className="mt-10 sm:mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary">
                <TrendingUp className="h-4 w-4" />
                Últimas notícias
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                O dia em 24 horas
              </h2>
            </div>

          </div>

          {newsLoading ? (
            <div
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              role="status"
              aria-label="Carregando notícias"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <Card key={index} className="gap-0 overflow-hidden rounded-[20px] border-border">
                  <div className="px-3 pt-3">
                    <Skeleton className="h-48 w-full rounded-lg" />
                  </div>
                  <CardHeader className="space-y-3 p-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 pb-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : newsError ? (
            <div className="rounded-[20px] border border-border p-6">
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar as notícias. Verifique se o serviço Node.js está ativo e consegue acessar o feed.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setRefreshKey((key) => key + 1)}
              >
                Tentar novamente
              </Button>
            </div>
          ) : feedNews.length === 0 ? (
            <p className="rounded-[20px] border border-border p-6 text-sm text-muted-foreground">
              Nenhuma notícia está disponível no feed no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {latestNewsItems.map((item) => (
                <Card
                  key={item.sourceUrl}
                  className="gap-0 overflow-hidden rounded-[20px] border-border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="px-3 pt-3">
                    <div className="h-48 overflow-hidden rounded-lg">
                      <NewsThumbnail imageUrl={item.imageUrl} title={item.title} />
                    </div>
                  </div>
                  <CardHeader className="flex-1 space-y-2 p-4">
                    <CardTitle className="line-clamp-2 text-base leading-snug">
                      <button
                        type="button"
                        className="text-left hover:text-primary"
                        onClick={() => setSelectedNews(item)}
                      >
                        {item.title}
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 pb-4">
                    {(item.summary || item.content) && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {cleanJournalisticText(item.summary || item.content)}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNews(item)}
                      >
                        Ler notícia
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!newsLoading && !newsError && feedNews.length > 0 && (
            <div className="mt-8 flex justify-center">
              <div className="mx-auto w-full max-w-[340px] rounded-full bg-gradient-to-b from-orange-200/80 via-orange-300/40 to-orange-400/20 p-1.5 shadow-[0_8px_20px_rgba(249,115,22,0.25),inset_0_1px_2px_rgba(255,255,255,0.8)] sm:max-w-[380px]">
                <Button
                  key="all-news-button"
                  type="button"
                  onClick={() => navigate("/todas-noticias")}
                  className={`flex h-14 w-full items-center justify-between gap-2 rounded-full border-2 px-6 text-sm font-bold text-white transition-all duration-500 sm:text-base ${
                    comDestaque
                      ? "border-orange-300 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 shadow-orange-500/50 shadow-xl"
                      : "border-orange-400 bg-gradient-to-b from-orange-500 via-orange-600 to-amber-700 shadow-lg"
                  }`}
                >
                  <span className="relative flex min-w-0 flex-1 items-center justify-center">
                    <span className="invisible whitespace-nowrap pl-2">
                      Ver todas as notícias de hoje
                    </span>
                    <span
                      aria-live="polite"
                      className="absolute inset-0 flex items-center justify-center whitespace-nowrap pl-2 transition-opacity duration-300"
                    >
                      {textoIndex === 0 ? "Ver todas" : "Ver todas as notícias de hoje"}
                    </span>
                  </span>
                  <span className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-white to-slate-100 text-orange-600 shadow-[0_3px_8px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,1)]">
                    <ArrowRight className="size-4" />
                  </span>
                </Button>
              </div>
            </div>
          )}
        </section>


        <section
          id="na-integra"
          aria-labelledby="na-integra-title"
          className="relative left-1/2 mt-10 w-screen -translate-x-1/2 rounded-none bg-foreground p-5 text-background sm:p-7 lg:p-8"
        >
          <div className="mb-6 flex justify-center text-center">
            <h2
              id="na-integra-title"
              className="font-display text-3xl font-black tracking-[0.12em] sm:text-4xl"
            >
              <span className="na-integra-glitch" data-text="NA ÍNTEGRA">
                NA ÍNTEGRA
              </span>
            </h2>
          </div>

          {newsLoading ? (
            <div
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
              role="status"
              aria-label="Carregando notícias na íntegra"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <Card key={index} className="gap-0 overflow-hidden rounded-[20px] border-background/15 bg-background p-3">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <div className="space-y-2 pt-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </Card>
              ))}
            </div>
          ) : integralNewsItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {integralNewsItems.map((item) => (
                <Card
                  key={item.sourceUrl}
                  className="gap-0 overflow-hidden rounded-[20px] border-background/15 bg-background text-foreground"
                >
                  <button
                    type="button"
                    className="block w-full px-3 pt-3 text-left"
                    onClick={() => setSelectedNews(item)}
                    aria-label={`Ler notícia: ${item.title}`}
                  >
                    <span className="block aspect-video overflow-hidden rounded-lg">
                      <NewsThumbnail imageUrl={item.imageUrl} title={item.title} />
                    </span>
                  </button>
                  <CardHeader className="space-y-2 p-3">
                    <CardTitle className="text-sm leading-snug">
                      <button
                        type="button"
                        className="text-left hover:text-primary"
                        onClick={() => setSelectedNews(item)}
                      >
                        {item.title}
                      </button>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-background/20 p-4 text-sm text-background/75">
              Ainda não há notícias disponíveis no feed.
            </p>
          )}
        </section>

        <section
          id="no-seu-radar"
          aria-labelledby="no-seu-radar-title"
          className="mt-10 bg-background py-8"
        >
          <h2
            id="no-seu-radar-title"
            className="mb-8 flex items-center justify-center gap-2 font-display text-2xl font-bold tracking-tight sm:gap-4 sm:text-3xl"
          >
            <span aria-hidden="true" className="h-1 flex-1 bg-foreground" />
            <span>
              <span>NO SEU </span>
              <span className="text-radar-green">RADAR</span>
            </span>
            <span aria-hidden="true" className="h-1 flex-1 bg-foreground" />
          </h2>

          {newsLoading || fallbackLoading ? (
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2" role="status" aria-label="Carregando notícias do radar">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="border-b-[0.5px] border-border py-5">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="mt-2 h-5 w-3/4" />
                </div>
              ))}
            </div>
          ) : radarNewsItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
              {radarNewsItems.map((item) => (
                <div key={item.sourceUrl} className="border-b-[0.5px] border-border">
                  <button
                    type="button"
                    className="w-full py-5 text-left font-poppins text-base font-medium italic leading-relaxed hover:text-primary"
                    onClick={() => setSelectedNews(item)}
                  >
                    <span className="block">{item.title}</span>
                  </button>
                </div>
              ))}
            </div>
          ) : saberNews.length > 0 ? (
            <>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Notícias recentes de Saber · Gazeta do Povo
              </p>
              <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
                {saberNews.map((item) => (
                  <div key={item.sourceUrl} className="border-b-[0.5px] border-border">
                    <button
                      type="button"
                      className="w-full py-5 text-left font-poppins text-base font-medium italic leading-relaxed hover:text-primary"
                      onClick={() => setSelectedNews(item)}
                    >
                      {item.title}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : currencyHistory.length > 0 ? (
            <div className="mx-auto max-w-3xl rounded-xl border border-border p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Dólar americano · último valor disponível
                    {latestCurrencyPoint &&
                      ` · ${new Date(`${latestCurrencyPoint.date}T12:00:00`).toLocaleDateString("pt-BR")}`}
                  </p>
                  {latestCurrencyPoint && (
                    <p className="font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                      US$ 1 = R${" "}
                      {latestCurrencyPoint.value.toLocaleString("pt-BR", {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">USD/BRL · 30 dias</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currencyHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value: string) =>
                        new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        })
                      }
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    />
                    <YAxis
                      domain={["dataMin", "dataMax"]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                      width={48}
                      tickFormatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR")
                      }
                      formatter={(value) => [
                        `R$ ${Number(value).toFixed(4)}`,
                        "1 USD",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-foreground)"
                      fill="var(--color-foreground)"
                      fillOpacity={0.14}
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              {fallbackLoading
                ? "Verificando as fontes alternativas…"
                : "As notícias e a cotação estão indisponíveis no momento."}
            </p>
          )}
        </section>

        {additionalNewsItems.length > 0 && (
          <section aria-label="Mais notícias" className="mt-10">
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
              {[additionalNewsItems.slice(0, 8), additionalNewsItems.slice(8, 16)].map(
                (column, columnIndex) => (
                  <div key={columnIndex}>
                    {column.map((item) => (
                      <div
                        key={item.sourceUrl}
                        className="border-b border-border"
                      >
                        <button
                          type="button"
                          className="w-full py-5 text-left font-medium leading-relaxed hover:text-primary"
                          onClick={() => setSelectedNews(item)}
                        >
                          {item.title}
                        </button>
                      </div>
                    ))}
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        <section
          aria-label="Imagem em destaque"
          className="relative left-1/2 mt-12 w-screen -translate-x-1/2 px-5 py-10 sm:py-14"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgb(255 255 255 / 8%), transparent 58%), linear-gradient(115deg, #262626, #070707)",
          }}
        >
          <div className="mx-auto max-w-7xl">
            <img
              src="https://i.postimg.cc/3xKFHsFf/81c2840c-582e-482f-9eb6-e3d1865cbf0f.png"
              alt="Imagem em destaque"
              loading="lazy"
              className="aspect-[16/9] w-full object-cover sm:aspect-[16/7]"
            />
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                onClick={() => setFiscalAlertOpen(true)}
                className="rounded-lg bg-[#5865F2] px-7 text-white shadow-md transition-all hover:scale-[1.02] hover:brightness-95 hover:shadow-lg"
              >
                Saber mais
              </Button>
            </div>
          </div>
        </section>

        <section id="agronegocio" aria-labelledby="agronegocio-title" className="mt-14">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Agronegócio
            </p>
            <h2 id="agronegocio-title" className="mt-2 font-display text-3xl font-bold tracking-tight">
              Notícias do Agronegócio
            </h2>
          </div>

          {newsLoading ? (
            <div className="space-y-4" role="status" aria-label="Carregando notícias do Agronegócio">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex flex-col gap-4 rounded-[20px] border border-border p-4 sm:flex-row">
                  <Skeleton className="h-36 w-full shrink-0 rounded-lg sm:h-28 sm:w-40" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : newsError ? (
            <p className="rounded-[20px] border border-border p-6 text-sm text-muted-foreground">
              Não foi possível carregar as notícias desta editoria no momento.
            </p>
          ) : agroCategoryNews.length === 0 ? (
            <p className="rounded-[20px] border border-border p-6 text-sm text-muted-foreground">
              Nenhuma notícia disponível nesta editoria no momento.
            </p>
          ) : (
            <div className="space-y-4">
              {agroCategoryNews.slice(0, 8).map((item) => (
                <button
                  key={item.sourceUrl}
                  type="button"
                  onClick={() => openNews(item)}
                  className="flex w-full flex-col gap-4 rounded-[20px] border border-border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center"
                  aria-label={`Abrir notícia: ${item.title}`}
                >
                  <div className="h-36 w-full shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-40">
                    <NewsThumbnail imageUrl={item.imageUrl} title={item.title} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-semibold leading-snug">
                      {item.title}
                    </h3>
                    {(item.content || item.summary) && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {cleanJournalisticText(item.content || item.summary)}
                      </p>
                    )}
                    <span className="mt-3 inline-flex text-sm font-semibold text-primary">
                      Ler matéria completa
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <Dialog
          open={selectedNews !== null}
          onOpenChange={(open) => {
            if (!open) {
              articleRequestRef.current += 1;
              setSelectedNews(null);
              setArticleLoading(false);
            }
          }}
        >
          <DialogContent className="fixed inset-0 left-0 top-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none p-4 sm:max-w-none sm:p-8">
            {selectedNews && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl leading-snug">
                    {selectedNews.title}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedNews.publishedAt
                      ? `Publicado em ${new Date(selectedNews.publishedAt).toLocaleDateString("pt-BR")}`
                      : ""}
                    {selectedNews.rewritten ? " · Texto reescrito" : ""}
                  </DialogDescription>
                </DialogHeader>
                {selectedNews.subtitle && (
                  <p className="mx-auto w-full max-w-3xl text-base font-medium leading-relaxed text-muted-foreground">
                    {selectedNews.subtitle}
                  </p>
                )}
                {selectedNews.imageUrl && (
                  <img
                    src={selectedNews.imageUrl}
                    alt={selectedNews.title}
                    className="mx-auto max-h-[55vh] w-full max-w-4xl rounded-xl object-cover"
                  />
                )}
                <div className="mx-auto w-full max-w-3xl space-y-6 text-[17px] leading-relaxed text-foreground">
                  {articleLoading && (
                    <p className="text-sm text-muted-foreground">
                      Carregando o texto completo da matéria…
                    </p>
                  )}
                  {articleError && (
                    <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                      Não foi possível carregar o texto completo agora. Você ainda pode abrir a matéria original.
                    </p>
                  )}
                  {cleanJournalisticText(
                    selectedNews.content || selectedNews.summary || "",
                  )
                    .split(/\n+/)
                    .map((paragraph) => paragraph.trim())
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p key={`${index}-${paragraph.slice(0, 24)}`}>
                        {paragraph}
                      </p>
                    ))}
                </div>

              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={fiscalAlertOpen} onOpenChange={setFiscalAlertOpen}>
          <DialogContent className="fixed inset-0 left-0 top-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none p-6 sm:max-w-none sm:p-10">
            <DialogHeader className="mx-auto w-full max-w-3xl border-b border-border pb-6 pt-8">
              <DialogTitle className="font-display text-3xl font-bold leading-tight sm:text-5xl">
                Alerta de colapso fiscal: o que está em jogo
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed">
                Entenda os principais riscos para as contas públicas e por que
                especialistas acompanham o equilíbrio entre receitas, despesas e dívida.
              </DialogDescription>
            </DialogHeader>

            <article className="mx-auto w-full max-w-3xl space-y-8 py-8 text-base leading-relaxed sm:text-lg">
              <section className="space-y-3">
                <h3 className="font-display text-xl font-bold sm:text-2xl">
                  O que significa o alerta
                </h3>
                <p>
                  A matéria apresenta preocupações atribuídas a análises do IFI
                  e do Ipea sobre a trajetória das contas públicas. Um quadro
                  fiscal mais pressionado pode reduzir a margem do governo para
                  financiar políticas e responder a imprevistos.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="font-display text-xl font-bold sm:text-2xl">
                  Pontos para acompanhar
                </h3>
                <ul className="list-disc space-y-3 pl-6 marker:text-primary">
                  <li>
                    <strong>Receitas e despesas:</strong> o equilíbrio depende
                    de receitas compatíveis com os gastos públicos ao longo do tempo.
                  </li>
                  <li>
                    <strong>Dívida pública:</strong> déficits persistentes podem
                    elevar o endividamento e tornar seu financiamento mais caro.
                  </li>
                  <li>
                    <strong>Juros e orçamento:</strong> despesas financeiras
                    maiores podem limitar recursos disponíveis para outras áreas.
                  </li>
                  <li>
                    <strong>Credibilidade:</strong> previsibilidade nas contas
                    ajuda a reduzir incertezas para famílias, empresas e investidores.
                  </li>
                </ul>
              </section>

              <section className="space-y-3 rounded-xl border border-border bg-muted/50 p-5 sm:p-6">
                <h3 className="font-display text-xl font-bold sm:text-2xl">
                  Por que isso importa
                </h3>
                <p>
                  A expressão “colapso fiscal” descreve um risco, não um
                  resultado inevitável. A evolução depende das decisões
                  orçamentárias, do desempenho da economia e da capacidade de
                  manter as contas públicas sustentáveis.
                </p>
              </section>


            </article>
          </DialogContent>
        </Dialog>
      </div>

      {isSocioModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="socio-modal-title"
          className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-gradient-to-b from-neutral-700 via-neutral-800 to-zinc-800 p-6 pt-14 md:pt-20"
        >
          <button
            type="button"
            aria-label="Fechar modal"
            onClick={() => setIsSocioModalOpen(false)}
            className="absolute right-5 top-5 rounded-full p-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <X className="size-5" />
          </button>

          <div className="mx-auto flex w-full max-w-6xl flex-col items-center text-center">
            <div className="w-full max-w-3xl space-y-5">
              <h2
                id="socio-modal-title"
                className="membership-gradient-title bg-clip-text text-3xl font-bold leading-tight text-transparent sm:text-4xl md:text-5xl"
              >
                Torne-se sócio do portal VOZ DO POVO
              </h2>
              <p className="text-base leading-relaxed text-zinc-100 sm:text-lg">
                Ser sócio é mais do que um simples status, é liberdade para se expressar de tudo que vier pela sua mente, administrar determinados lugares do Portal Voz do Povo, convidar pessoas e impulsionar o portal!
              </p>
            </div>

            <Button
              type="button"
              onClick={() =>
                socioFinalTitleRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                })
              }
              className="relative mt-8 overflow-hidden rounded-full bg-[#5865F2] px-8 py-3.5 font-bold text-white shadow-lg hover:bg-[#4752C4]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />
              <span className="relative">Eu quero ser sócio</span>
            </Button>

            <h3 className="mt-12 text-center text-lg font-bold tracking-wide text-white sm:text-xl">
              CONFIRA O QUE VOCÊ VAI TER DISPONIVEL AO SE TORNAR SÓCIO
            </h3>

            <div className="mt-5 grid w-full max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Gerencie espaços do Portal",
                  description:
                    "Tenha controle administrativo sobre áreas e seções exclusivas dentro do Portal Voz do Povo para organizar temas, conteúdos e debates.",
                  Icon: LayoutDashboard,
                },
                {
                  title: "Poder de Convite Exclusivo",
                  description:
                    "Receba acesso para convidar novos membros e trazer pessoas de confiança para fortalecer o núcleo ativo da plataforma.",
                  Icon: UserPlus,
                },
                {
                  title: "Impulsionamento Direto do Portal",
                  description:
                    "Contribua diretamente para a evolução contínua, alcance e independência do Voz do Povo com sua licença vitalícia.",
                  Icon: Megaphone,
                },
                {
                  title: "Suporte dedicado",
                  description:
                    "Acesso direto e prioritário ao nosso canal exclusivo de suporte e atendimento VIP para sócios no Telegram.",
                  Icon: Headset,
                },
              ].map(({ title, description, Icon }) => (
                <article
                  key={title}
                  className="flex min-h-[280px] flex-col justify-between rounded-2xl border border-white/25 bg-gradient-to-br from-zinc-700/85 via-zinc-800/90 to-neutral-900/95 p-6 text-left text-white shadow-xl ring-1 ring-inset ring-white/15 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/50"
                >
                  <Icon className="size-6 text-zinc-100" aria-hidden="true" />
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold">{title}</h4>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-200">
                      {description}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <section
              aria-labelledby="socio-faq-title"
              className="mt-12 w-full rounded-b-3xl bg-white px-6 py-14 text-zinc-950 md:px-12"
            >
              <h3
                id="socio-faq-title"
                className="mb-8 text-center font-display text-3xl font-bold tracking-tight"
              >
                Como funciona?
              </h3>

              <Accordion type="single" collapsible className="mx-auto w-full max-w-4xl">
                {[
                  {
                    question: "Como funciona o gerenciamento dos espaços do portal?",
                    answer:
                      "Como sócio, você ganha permissões administrativas sobre áreas específicas do Portal Voz do Povo. Isso permite organizar tópicos, moderar discussões, destacar assuntos relevantes e moldar o ambiente de debates junto com a equipe do portal.",
                  },
                  {
                    question: "Posso convidar outras pessoas para o portal?",
                    answer:
                      "Sim. Você recebe acesso a um sistema exclusivo de convites para trazer pessoas de confiança, expandir o alcance da comunidade e ajudar a construir um núcleo de membros cada vez mais ativo e qualificado.",
                  },
                  {
                    question: "O que significa impulsionar diretamente o portal?",
                    answer:
                      "Significa que a sua contribuição financia diretamente a evolução tecnológica, a independência editorial e a expansão do Voz do Povo — além de garantir prioridade e maior visibilidade para as suas próprias participações dentro da plataforma.",
                  },
                  {
                    question: "Como faço para entrar no grupo de suporte dedicado no Telegram?",
                    answer:
                      "Assim que a sua licença de sócio for confirmada, o link de acesso exclusivo ao nosso canal e grupo VIP de atendimento direto no Telegram é liberado automaticamente no seu painel de usuário.",
                  },
                  {
                    question: "Eu terei acesso imediato a demais funcionalidades de ser sócio?",
                    answer:
                      "Sim, a liberação é automática e instantânea. Logo após a confirmação do pagamento, o sistema atualiza o seu perfil na hora e desbloqueia todos os recursos, permissões e selos exclusivos de sócio.",
                  },
                  {
                    question: "Tem mensalidades para se tornar sócio ou é vitalício?",
                    answer:
                      "É 100% vitalício. Você realiza um pagamento único e garante todos os privilégios e futuras atualizações de sócio para sempre, sem cobranças recorrentes ou taxas ocultas.",
                  },
                ].map(({ question, answer }, index) => (
                  <AccordionItem
                    key={question}
                    value={`socio-faq-${index + 1}`}
                    className="border-zinc-200"
                  >
                    <AccordionTrigger className="items-start py-5 text-left text-base font-semibold text-zinc-950 hover:no-underline sm:text-lg">
                      {question}
                    </AccordionTrigger>
                    <AccordionContent className="text-left pb-4 text-sm leading-relaxed text-zinc-600 sm:text-base">
                      {answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            <section
              aria-labelledby="socio-jornada-title"
              className="w-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 px-6 py-16 text-white md:px-12"
            >
              <header className="mx-auto mb-10 max-w-3xl text-center">
                <h3
                  id="socio-jornada-title"
                  className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
                >
                  Ainda está com dúvidas?
                </h3>
                <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
                  Veja como é simples ativar sua licença vitalícia e assumir seu espaço no Portal Voz do Povo.
                </p>
              </header>

              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  {
                    number: "01",
                    title: "Ativação Instantânea",
                    description:
                      "Você garante sua licença com pagamento único e o sistema libera automaticamente o seu acesso vitalício na hora.",
                  },
                  {
                    number: "02",
                    title: "Permissões Liberadas",
                    description:
                      "Seu perfil ganha o selo oficial de Sócio, desbloqueando a administração de espaços exclusivos e seu painel de convites.",
                  },
                  {
                    number: "03",
                    title: "Acesso ao Núcleo VIP",
                    description:
                      "Você entra no grupo dedicado de sócios no Telegram e passa a impulsionar diretamente o crescimento do portal.",
                  },
                ].map(({ number, title, description }) => (
                  <article
                    key={number}
                    className="rounded-2xl border border-white/15 bg-zinc-800/50 p-6 text-left shadow-lg backdrop-blur-sm"
                  >
                    <span className="inline-flex size-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 font-display text-lg font-bold text-zinc-100">
                      {number}
                    </span>
                    <h4 className="mt-6 text-lg font-semibold">{title}</h4>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                      {description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section
              aria-label="Aviso de lote fundador"
              className="relative my-8 w-full max-w-4xl overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-zinc-900 via-neutral-900 to-zinc-900 px-6 py-8 text-center shadow-2xl"
            >
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                ⚡ Ainda é possível se tornar sócio
              </span>
              <h3 className="mb-2 text-xl font-bold text-white md:text-2xl">
                Licença Vitalícia com Vagas Limitadas no Núcleo
              </h3>
              <p className="text-sm text-zinc-300 md:text-base">
                Para manter a qualidade, a agilidade na administração dos espaços e a exclusividade do núcleo de sócios do Portal Voz do Povo, o acesso vitalício com todas as permissões avançadas é liberado em lotes controlados.
              </p>
            </section>

            <section
              aria-label="Finalizar adesão de sócio"
              className="my-10 flex w-full max-w-4xl flex-col items-center rounded-3xl border border-white/20 bg-gradient-to-b from-zinc-900 via-neutral-900 to-zinc-950 p-8 text-center shadow-2xl md:p-10"
            >
              <h3
                ref={socioFinalTitleRef}
                className="mb-3 text-2xl font-extrabold text-white md:text-3xl"
              >
                Ser sócio não é apenas luxo, é o poder máximo que você tem dentro do Portal!
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsSocioModalOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="relative my-6 inline-flex items-center justify-center overflow-hidden rounded-full bg-[#5865F2] px-10 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#4752C4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-lg"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent"
                />
                <span className="relative">Eu quero ser sócio</span>
              </button>
              <p className="text-sm leading-relaxed text-zinc-300">
                Dê o primeiro passo e veja como isso funciona na prática.
              </p>
            </section>
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Checkout de sócio"
          className="fixed inset-0 z-[60] flex h-dvh w-screen flex-col overflow-hidden bg-zinc-950"
        >
          <header className="flex w-full shrink-0 items-center justify-between border-b border-white/10 bg-zinc-900 px-6 py-4 text-white">
            <h2 className="font-display text-lg font-semibold sm:text-xl">
              Torna-se sócio
            </h2>
            <button
              type="button"
              aria-label="Fechar checkout"
              onClick={() => setIsCheckoutOpen(false)}
              className="rounded-full p-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <X className="size-5" />
            </button>
          </header>
          <iframe
            src="https://pay.cakto.com.br/4gxfhf8_1336054"
            title="Checkout de sócio do Portal Voz do Povo"
            sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
            allow="payment; clipboard-write"
            className="min-h-0 w-full flex-1 border-0 bg-white"
          />
        </div>
      )}

    </main>
  );
}
