import { useEffect, useRef, useState } from "react";
import { ArrowRight, Clock3, TrendingUp } from "lucide-react";
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
    .replace(/[ \t]+/g, " ")
    .replace(/ *([,.;:!?])/g, "$1")
    .trim();
}

function NewsThumbnail({ imageUrl, title }: { imageUrl?: string; title: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageUrl || imageFailed) {
    return (
      <div
        role="img"
        aria-label={`Capa indisponível: ${title}`}
        className="flex h-44 w-full items-center justify-center rounded-lg bg-muted"
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
      className="h-32 w-full rounded-lg object-cover"
    />
  );
}

export default function Home() {
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
  const [agroNews, setAgroNews] = useState<NewsItem[]>([]);
  const [agroNewsLoading, setAgroNewsLoading] = useState(true);
  const [agroNewsError, setAgroNewsError] = useState(false);
  const [currencyHistory, setCurrencyHistory] = useState<CurrencyPoint[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fiscalAlertOpen, setFiscalAlertOpen] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadNews() {
      setNewsLoading(true);
      setNewsError(false);

      try {
        const response = await fetch("https://conscienciadepoder.com/api/news", {
          mode: "cors",
        });
        if (!response.ok) throw new Error("Notícias indisponíveis");
        const data = (await response.json()) as NewsResponse;

        if (isCurrent) {
          const items = Array.isArray(data.items) ? data.items : [];
          setNewsItems(
            items.map((item) => ({
              ...item,
              title: hideSourceTerms(item.title),
              content: hideSourceTerms(item.content),
              categories: Array.isArray(item.categories)
                ? item.categories.map(hideSourceTerms)
                : [],
            })),
          );
        }
      } catch {
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
    let isCurrent = true;

    async function loadAgroNews() {
      setAgroNewsLoading(true);
      setAgroNewsError(false);

      try {
        const response = await fetch("https://conscienciadepoder.com/api/agronegocio");
        if (!response.ok) throw new Error("Notícias de Agronegócio indisponíveis");
        const data = (await response.json()) as NewsResponse;

        if (isCurrent) {
          setAgroNews(Array.isArray(data.items) ? data.items.slice(0, 8) : []);
        }
      } catch {
        if (isCurrent) setAgroNewsError(true);
      } finally {
        if (isCurrent) setAgroNewsLoading(false);
      }
    }

    loadAgroNews();
    return () => {
      isCurrent = false;
    };
  }, []);

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
  const agronegocioUrls = new Set(agroNews.map((item) => item.sourceUrl));
  const feedNews = (Array.isArray(newsItems) ? newsItems : []).filter((item) => {
    if (agronegocioUrls.has(item.sourceUrl)) return false;
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
  const remainingNews = feedNews.filter(
    (item) => !latestNewsUrls.has(item.sourceUrl),
  );
  const noPontoMatches = remainingNews.filter((item) => {
    const searchableText = [
      item.title,
      item.sourceUrl,
      ...(item.categories || []),
    ]
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[-_]+/g, " ")
      .toLowerCase();

    return searchableText.includes("no ponto");
  });
  const integralNewsItems = (
    noPontoMatches.length > 0 ? noPontoMatches : remainingNews
  ).slice(0, 4);
  const displayedNewsUrls = new Set(
    [...latestNewsItems, ...integralNewsItems].map((item) => item.sourceUrl),
  );
  const radarNewsItems = feedNews
    .filter((item) => !displayedNewsUrls.has(item.sourceUrl))
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
        const response = await fetch("https://conscienciadepoder.com/api/saber");
        if (!response.ok) throw new Error("Gazeta do Povo indisponível");
        const data = (await response.json()) as NewsResponse;
        const items = Array.isArray(data.items) ? data.items : [];

        if (!isCurrent) return;
        if (items.length > 0) {
          setSaberNews(items);
          return;
        }
      } catch {
        // Se as notícias não estiverem disponíveis, tenta carregar a cotação.
      }

      try {
        const currencyResponse = await fetch("https://conscienciadepoder.com/api/usd-brl");
        if (!currencyResponse.ok) throw new Error("Cotação indisponível");
        const currencyData = (await currencyResponse.json()) as {
          items?: CurrencyPoint[];
        };
        if (isCurrent) setCurrencyHistory(currencyData.items || []);
      } catch {
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
        `https://conscienciadepoder.com/api/article?url=${encodeURIComponent(item.sourceUrl)}`,
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
    <main className="min-h-screen bg-background">


      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <section id="urgente" aria-label="Notícias urgentes">
          <div className="mb-5 flex items-center gap-3">
            <Badge className="gap-2 px-3 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground" />
              NOTÍCIAS URGENTES
            </Badge>
            <span className="text-sm text-muted-foreground">
              Atualização contínua
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-foreground">
            <img
              src={story.image}
              alt={story.title}
              className="h-[24rem] w-full object-cover opacity-75 transition-opacity duration-500 md:h-[ thirtyrem] lg:h-[ thirtyrem]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-background md:p-10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-background/70">
                {story.category}
              </p>
              <h1 className="max-w-3xl font-display text-3xl font-bold leading-tight md:text-5xl">
                {story.title}
              </h1>
              <p className="mt-4 text-xs text-background/60">
                Foto: {story.credit} / Pexels
              </p>
            </div>
            <div className="absolute bottom-6 right-6 flex gap-1.5">
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

        <section id="noticias" className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary">
                <TrendingUp className="h-4 w-4" />
                Últimas notícias
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
                O dia em 24 histórias
              </h2>
            </div>
            <Button variant="ghost" className="hidden gap-2 sm:flex">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {newsLoading ? (
            <p className="rounded-[20px] border border-border p-6 text-sm text-muted-foreground">
              Carregando notícias…
            </p>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {latestNewsItems.map((item) => (
                <Card
                  key={item.sourceUrl}
                  className="gap-0 overflow-hidden rounded-[20px] border-border transition-shadow hover:shadow-md"
                >
                  <div className="px-3 pt-3">
                    <NewsThumbnail imageUrl={item.imageUrl} title={item.title} />
                  </div>
                  <CardHeader className="space-y-2 p-3">
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
                  <CardContent className="space-y-2 px-3 pb-3">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {item.content}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock3 className="h-3 w-3" />
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleDateString("pt-BR")
                          : "Publicada pela fonte"}
                      </span>
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

          {integralNewsItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {integralNewsItems.map((item) => (
                <Card
                  key={item.sourceUrl}
                  className="gap-0 overflow-hidden rounded-[20px] border-background/15 bg-background text-foreground"
                >
                  <button
                    type="button"
                    className="px-3 pt-3 text-left"
                    onClick={() => setSelectedNews(item)}
                    aria-label={`Ler notícia: ${item.title}`}
                  >
                    <NewsThumbnail imageUrl={item.imageUrl} title={item.title} />
                  </button>
                  <CardHeader className="p-3">
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

          {radarNewsItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
              {radarNewsItems.map((item) => (
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

          {agroNewsLoading ? (
            <p className="rounded-[20px] border border-border p-6 text-sm text-muted-foreground">
              Carregando notícias do Agronegócio…
            </p>
          ) : agroNewsError ? (
            <p className="rounded-[20px] border border-border p-6 text-sm text-muted-foreground">
              Não foi possível carregar as notícias desta editoria no momento.
            </p>
          ) : agroNews.length === 0 ? (
            <p className="rounded-[20px] border border-border p-6 text-sm text-muted-foreground">
              Nenhuma notícia disponível nesta editoria no momento.
            </p>
          ) : (
            <div className="space-y-4">
              {agroNews.slice(0, 8).map((item) => (
                <button
                  key={item.sourceUrl}
                  type="button"
                  onClick={() => openNews(item)}
                  className="flex w-full flex-col gap-4 rounded-[20px] border border-border bg-background p-4 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center"
                  aria-label={`Abrir notícia: ${item.title}`}
                >
                  <div className="h-44 w-full shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-40">
                    <NewsThumbnail imageUrl={item.imageUrl} title={item.title} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-semibold leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {item.content || "Confira os principais destaques recentes do Agronegócio."}
                    </p>
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
          <DialogContent className="fixed inset-0 left-0 top-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none p-6 sm:max-w-none sm:p-8">
            {selectedNews && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl leading-snug">
                    {selectedNews.title}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedNews.publishedAt
                      ? `Publicado em ${new Date(selectedNews.publishedAt).toLocaleDateString("pt-BR")}`
                      : "Notícia do feed"}
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
                  {selectedNews.content
                    .split(/\n+/)
                    .map((paragraph) => paragraph.trim())
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p key={`${index}-${paragraph.slice(0, 24)}`}>
                        {paragraph}
                      </p>
                    ))}
                </div>
                {!agroNews.some((item) => item.sourceUrl === selectedNews.sourceUrl) && (
                  <>
                    <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                      Fonte: {selectedNews.sourceUrl.includes("gazetadopovo.com.br")
                        ? "Gazeta do Povo — Saber"
                        : "Feed de Agronegócio"}
                      . Conteúdo recebido do feed original.
                    </p>
                    <p className="mx-auto w-full max-w-3xl">
                      <a
                        href={selectedNews.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        Abrir matéria original
                      </a>
                    </p>
                  </>
                )}
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

      <footer id="rodape" className="mt-10 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-muted-foreground lg:px-8">
          <p className="font-display text-base font-semibold text-foreground">
            Horizonte
          </p>
          <p>
            Fotografias do portal via Pexels. Créditos: HÜSEYİN AVCI, cottonbro
            studio, Ahmet Yüksek ✪, Paul Espinoza, Mikhail Nilov, Darya
            Sannikova, Ann H, SHAHBAZ ZAMAN, Andrea Piacquadio, Mike van
            Schoonderwalt, Oriel Frankie Ashcroft, Markus Winkler, Alexander
            Gluschenko, ayça bilge e Pavel Danilyuk.
          </p>
        </div>
      </footer>
    </main>
  );
}