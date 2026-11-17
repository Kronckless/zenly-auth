import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
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

export default function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSocioModalOpen, setIsSocioModalOpen] = useState(false);
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
    if (!supabase) return;

    let active = true;

    const loadBoosterStatus = async (userId?: string) => {
      if (!userId) {
        if (active) setIsBooster(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_booster")
        .eq("id", userId)
        .maybeSingle();

      if (active) setIsBooster(!error && data?.is_booster === true);
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
                </div>
              )}
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
                className="rounded-lg bg-cta px-7 text-cta-foreground shadow-md transition-all hover:scale-[1.02] hover:brightness-95 hover:shadow-lg"
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
