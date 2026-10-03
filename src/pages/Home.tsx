import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Menu,
  Radio,
  Search,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

const newsItems = [
  ["Cultura", "Arquitetura histórica inspira uma nova temporada de visitas", "39722022"],
  ["Mundo", "Cobertura internacional acompanha decisões que movimentam o dia", "10464798"],
  ["Cidades", "Novos espaços públicos transformam a rotina nos centros urbanos", "7208320"],
  ["Economia", "Mercados iniciam a semana atentos aos próximos indicadores", "38862877"],
  ["Saúde", "Equipes de emergência reforçam atendimento durante o feriado", "8941908"],
  ["Tecnologia", "Estúdios apostam em novas ferramentas para contar histórias", "7865064"],
  ["Brasil", "Projetos comunitários aproximam serviços dos moradores", "5505690"],
  ["Política", "Debate nacional reúne diferentes visões sobre o futuro", "30869078"],
  ["Esportes", "Atletas celebram uma noite de grandes conquistas", "721996"],
  ["Comportamento", "Pequenas pausas ajudam a criar dias mais equilibrados", "3944425"],
  ["Educação", "Professores compartilham práticas para uma escola mais aberta", "4057663"],
  ["Ciência", "Pesquisa amplia o conhecimento sobre ambientes urbanos", "7108127"],
  ["Cultura", "Detalhes preservados revelam a história de uma antiga cidade", "39825117"],
  ["Lazer", "Atrações clássicas continuam encantando novas gerações", "5985844"],
  ["Mundo", "O trabalho de campo de jornalistas ganha destaque", "10464785"],
  ["Brasil", "Serviços de emergência modernizam sua preparação", "28123659"],
  ["Opinião", "Por que o jornalismo local continua indispensável", "38748859"],
  ["Cidades", "Prédios tradicionais mostram caminhos para o futuro", "7208320"],
  ["Economia", "Informação clara ajuda famílias a planejar seus próximos passos", "5505690"],
  ["Saúde", "Atendimento humanizado é tema de encontro entre especialistas", "8942071"],
  ["Cultura", "Feiras noturnas celebram arte, música e gastronomia", "29912748"],
  ["Tecnologia", "A produção audiovisual passa por uma transformação silenciosa", "7865064"],
  ["Análise", "As imagens que ajudam a explicar um mundo em movimento", "22039751"],
  ["Cotidiano", "Café, notícias e os rituais que marcam o começo do dia", "3944425"],
].map(([category, title, seed], index) => ({
  id: index + 1,
  category,
  title,
  image: `https://picsum.photos/seed/${seed}/800/600`,
}));

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % carouselStories.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  const story = carouselStories[activeSlide];

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight">
                Horizonte
              </p>
              <p className="text-xs text-muted-foreground">informação em movimento</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a className="text-foreground" href="#urgente">Agora</a>
            <a href="#noticias">Notícias</a>
            <a href="#rodape">Sobre nós</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Buscar">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Abrir menu">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

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

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-12">
            {newsItems.map((item) => (
              <Card
                key={item.id}
                className="group overflow-hidden border-border transition-shadow hover:shadow-md lg:col-span-1"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <CardHeader className="space-y-2 p-3">
                  <Badge variant="secondary" className="text-[10px]">
                    {item.category}
                  </Badge>
                  <CardTitle className="line-clamp-3 text-sm leading-snug">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-1.5 px-3 pb-3 text-[11px] text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  Há {item.id + 1} min
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
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