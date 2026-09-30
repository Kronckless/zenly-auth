import {
  ArrowRight,
  Bell,
  Bookmark,
  Clock3,
  Menu,
  Search,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const categories = [
  "Início",
  "Política",
  "Economia",
  "Tecnologia",
  "Cultura",
  "Esportes",
];

const latestNews = [
  {
    category: "Tecnologia",
    title: "Novas ferramentas de inteligência artificial transformam a rotina de empresas",
    time: "Há 32 min",
    image: "https://picsum.photos/seed/technology-news/800/520",
  },
  {
    category: "Economia",
    title: "Mercado revisa projeções e prevê um segundo semestre mais aquecido",
    time: "Há 1 h",
    image: "https://picsum.photos/seed/economy-news/800/520",
  },
  {
    category: "Cultura",
    title: "Exposição reúne artistas contemporâneos em mostra inédita",
    time: "Há 2 h",
    image: "https://picsum.photos/seed/art-news/800/520",
  },
];

const trendingTopics = [
  "Mudanças no mercado de trabalho",
  "O futuro das cidades inteligentes",
  "Festival de cinema anuncia programação",
  "Como cuidar melhor da saúde digital",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link
              to="/home"
              className="font-display text-2xl font-bold tracking-tight"
            >
              Zenith<span className="text-primary">.</span>
            </Link>

            <nav className="hidden items-center gap-6 lg:flex" aria-label="Categorias">
              {categories.slice(0, 5).map((category) => (
                <a
                  key={category}
                  href={`#${category.toLowerCase()}`}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {category}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Pesquisar">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notificações">
              <Bell className="h-5 w-5" />
            </Button>
            <Button className="hidden sm:inline-flex">Assinar</Button>
          </div>
        </div>

        <div className="border-t border-border lg:hidden">
          <nav className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-6 py-3">
            {categories.map((category) => (
              <a
                key={category}
                href={`#${category.toLowerCase()}`}
                className="whitespace-nowrap text-sm font-medium text-muted-foreground"
              >
                {category}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">QUARTA-FEIRA, 18 DE JUNHO</p>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              O que está acontecendo
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              As principais notícias e análises para você começar o dia bem informado.
            </p>
          </div>
          <Button variant="outline" className="hidden gap-2 sm:inline-flex">
            <Bookmark className="h-4 w-4" />
            Salvos
          </Button>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.45fr_1fr]" aria-label="Destaques">
          <article className="group relative min-h-[440px] overflow-hidden rounded-2xl">
            <img
              src="https://picsum.photos/seed/main-news/1200/800"
              alt="Paisagem urbana ao amanhecer"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-background sm:p-8">
              <Badge className="mb-4 border-0 bg-primary text-primary-foreground">
                Destaque do dia
              </Badge>
              <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl">
                Um novo olhar sobre as escolhas que estão moldando o nosso futuro
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-background/75">
                Especialistas analisam as transformações mais importantes dos últimos meses
                e o impacto delas no cotidiano.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-background/65">
                <Clock3 className="h-3.5 w-3.5" />
                Leitura de 6 min
              </div>
            </div>
          </article>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <Card className="group overflow-hidden border-border shadow-none">
              <div className="grid h-full sm:grid-cols-[0.9fr_1.1fr] lg:grid-cols-[0.85fr_1.15fr]">
                <img
                  src="https://picsum.photos/seed/world-news/800/600"
                  alt="Edifícios de uma cidade"
                  className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-full"
                />
                <CardContent className="flex flex-col justify-center p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    Mundo
                  </p>
                  <h3 className="font-display text-xl font-semibold leading-snug">
                    Países se unem para criar novas soluções climáticas
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Acordo internacional estabelece metas para os próximos anos.
                  </p>
                  <span className="mt-4 text-xs text-muted-foreground">Há 48 min</span>
                </CardContent>
              </div>
            </Card>

            <Card className="border-border bg-muted/40 shadow-none">
              <CardContent className="flex h-full flex-col justify-center p-6">
                <TrendingUp className="mb-4 h-6 w-6 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Análise
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold leading-tight">
                  As 5 tendências que merecem sua atenção nesta semana
                </h3>
                <Button variant="link" className="mt-4 w-fit px-0">
                  Ler análise <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_320px]">
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Últimas notícias</h2>
              <Button variant="link" className="gap-1 px-0">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {latestNews.map((news) => (
                <article
                  key={news.title}
                  className="group grid gap-5 border-b border-border pb-6 sm:grid-cols-[220px_1fr]"
                >
                  <img
                    src={news.image}
                    alt=""
                    className="h-40 w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="flex flex-col justify-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {news.category}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-semibold leading-snug">
                      {news.title}
                    </h3>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {news.time}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside>
            <div className="rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-bold">Mais lidas</h2>
              </div>
              <Separator className="my-5" />
              <div className="space-y-5">
                {trendingTopics.map((topic, index) => (
                  <article key={topic} className="flex gap-4">
                    <span className="font-display text-2xl font-bold text-primary/60">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-sm font-medium leading-relaxed">{topic}</h3>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-primary p-6 text-primary-foreground">
              <h2 className="font-display text-xl font-bold">Receba o melhor do Zenith</h2>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
                Uma seleção das notícias mais importantes direto no seu e-mail.
              </p>
              <Button variant="secondary" className="mt-5 w-full">
                Assinar newsletter
              </Button>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-8 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span className="font-display font-semibold text-foreground">
            Zenith<span className="text-primary">.</span>
          </span>
          <span>Informação para decisões melhores.</span>
        </div>
      </footer>
    </div>
  );
}