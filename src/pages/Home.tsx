import { useEffect, useState } from "react";
import { ArrowRight, Clock3, TrendingUp, X } from "lucide-react";

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
};

type NewsResponse = {
  source?: string;
  updatedAt?: number;
  items?: NewsItem[];
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
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % carouselStories.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  const story = carouselStories[activeSlide];
  const editionBulletinPattern =
    /\b(?:jornal|noticiário)\b.*\b(?:edição|assista|acompanhe)\b|\b(?:assista|acompanhe)\s+(?:ao\s+)?(?:noticiário|jornal)\b|\b(?:primeira|segunda|terceira|quarta|última)\s+edição\b/i;
  const feedNews = (Array.isArray(newsItems) ? newsItems : []).filter(
    (item) => !editionBulletinPattern.test(item.title || ""),
  );
  const latestNewsItems = feedNews.slice(0, 6);
  const noPontoMatches = feedNews.filter((item) => {
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
    noPontoMatches.length > 0 ? noPontoMatches : feedNews
  ).slice(0, 4);
  const displayedNewsUrls = new Set(
    [...latestNewsItems, ...integralNewsItems].map((item) => item.sourceUrl),
  );
  const radarNewsItems = feedNews
    .filter((item) => !displayedNewsUrls.has(item.sourceUrl))
    .slice(0, 8);

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
            className="mb-8 flex items-center justify-center gap-4 font-display text-3xl font-bold tracking-tight"
          >
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
            <span>
              <span>NO SEU </span>
              <span className="text-radar-green">RADAR</span>
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
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
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Não há outras notícias disponíveis no momento.
            </p>
          )}
        </section>

        <Dialog
          open={selectedNews !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedNews(null);
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
                {selectedNews.imageUrl && (
                  <img
                    src={selectedNews.imageUrl}
                    alt={selectedNews.title}
                    className="mx-auto max-h-[55vh] w-full max-w-4xl rounded-xl object-cover"
                  />
                )}
                <div className="mx-auto w-full max-w-3xl space-y-6 text-[17px] leading-relaxed text-foreground">
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
                <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                  Conteúdo e imagens recebidos de um feed externo; termos identificadores da fonte foram omitidos na exibição.
                </p>
              </>
            )}
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