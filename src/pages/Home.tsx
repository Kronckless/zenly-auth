import {
  ArrowRight,
  Bell,
  Bookmark,
  ChevronRight,
  Clock3,
  Menu,
  Search,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";

const categories = ["Política", "Economia", "Tecnologia", "Cultura", "Esportes"];

const featuredArticles = [
  {
    category: "Tecnologia",
    title: "Como a tecnologia está transformando a forma de acompanhar as notícias",
    description:
      "Novas plataformas digitais aproximam informação, análise e participação em tempo real.",
    time: "Há 32 min",
    image:
      "https://images.pexels.com/photos/106341/pexels-photo-106341.jpeg?auto=compress&cs=tinysrgb&w=1600",
    credit: "AS Photography",
  },
  {
    category: "Jornalismo",
    title: "A informação que ajuda a entender o mundo todos os dias",
    description:
      "Em meio ao excesso de conteúdo, curadoria e contexto se tornam essenciais para formar opinião.",
    time: "Há 1 hora",
    image:
      "https://images.pexels.com/photos/7596907/pexels-photo-7596907.jpeg?auto=compress&cs=tinysrgb&w=1600",
    credit: "cottonbro studio",
  },
  {
    category: "Atualidades",
    title: "As principais histórias e tendências que movimentam o dia",
    description:
      "Uma seleção das notícias mais relevantes para você começar o dia bem informado.",
    time: "Há 2 horas",
    image:
      "https://images.pexels.com/photos/10464798/pexels-photo-10464798.jpeg?auto=compress&cs=tinysrgb&w=1600",
    credit: "cottonbro studio",
  },
];

const articles = [
  {
    category: "Economia",
    title: "Mercado acompanha novas oportunidades para pequenos negócios",
    time: "Há 1 hora",
  },
  {
    category: "Cultura",
    title: "Exposição reúne artistas contemporâneos em mostra inédita",
    time: "Há 2 horas",
  },
  {
    category: "Esportes",
    title: "Temporada começa com novidades e grandes expectativas",
    time: "Há 3 horas",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="font-display text-2xl font-bold tracking-tight text-primary">
                Zenith
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Informação que acompanha você
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-1 lg:flex">
            {categories.map((category) => (
              <Button key={category} variant="ghost" className="text-sm">
                {category}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Pesquisar">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notificações">
              <Bell className="h-5 w-5" />
            </Button>
            <Button className="hidden sm:inline-flex">Assine agora</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <nav className="flex items-center gap-2 overflow-x-auto border-b py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Início</span>
          {categories.map((category) => (
            <span key={category} className="flex items-center whitespace-nowrap">
              <ChevronRight className="mx-2 h-3.5 w-3.5" />
              {category}
            </span>
          ))}
        </nav>

        <section className="py-10">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-3 gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Em destaque
              </Badge>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                As notícias mais importantes do dia
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Uma seleção das histórias que estão movimentando o Brasil e o mundo.
              </p>
            </div>
            <Button variant="ghost" className="hidden gap-2 sm:inline-flex">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <Carousel className="mx-auto w-full">
            <CarouselContent>
              {featuredArticles.map((article) => (
                <CarouselItem key={article.title}>
                  <Card className="overflow-hidden border-0 shadow-sm">
                    <div className="relative h-[25rem] sm:h-[ thirtyrem]">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6 text-background sm:p-10">
                        <Badge className="mb-4 border-background/20 bg-background/15 text-background backdrop-blur-sm hover:bg-background/20">
                          {article.category}
                        </Badge>
                        <h2 className="max-w-3xl font-display text-3xl font-bold leading-tight sm:text-5xl">
                          {article.title}
                        </h2>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-background/80 sm:text-base">
                          {article.description}
                        </p>
                        <div className="mt-5 flex items-center gap-2 text-xs text-background/70">
                          <Clock3 className="h-3.5 w-3.5" />
                          {article.time}
                        </div>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </section>

        <Separator />

        <section className="py-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Últimas notícias
            </h2>
            <Button variant="link" className="gap-2">
              Ver mais <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Política", "Congresso debate novas medidas para os próximos meses"],
              ["Economia", "Especialistas analisam cenário econômico para este ano"],
              ["Tecnologia", "Pesquisa revela os hábitos digitais dos brasileiros"],
            ].map(([category, title]) => (
              <Card key={title} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <Badge variant="secondary">{category}</Badge>
                  <h3 className="mt-4 font-display text-lg font-semibold leading-snug">
                    {title}
                  </h3>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Confira os principais detalhes e tudo o que você precisa saber.
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Há 4 horas</span>
                    <Button variant="ghost" size="icon-sm" aria-label="Salvar notícia">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-muted-foreground lg:px-8">
          Imagens por AS Photography e cottonbro studio via Pexels.
        </div>
      </footer>
    </main>
  );
}