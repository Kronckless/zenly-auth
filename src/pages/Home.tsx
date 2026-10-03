import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Menu,
  Search,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type NewsItem = {
  image: string;
  category: string;
  title: string;
  description: string;
  author: string;
};

const heroStories: NewsItem[] = [
  {
    image:
      "https://images.pexels.com/photos/10464798/pexels-photo-10464798.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Cobertura ao vivo",
    title: "Repórteres ampliam a cobertura dos acontecimentos desta noite",
    description:
      "Equipes de jornalismo acompanham os principais fatos diretamente do local.",
    author: "cottonbro studio",
  },
  {
    image:
      "https://images.pexels.com/photos/39722022/pexels-photo-39722022.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Mundo",
    title: "Arquitetura histórica ganha destaque em novo roteiro cultural",
    description:
      "Monumentos e espaços históricos atraem visitantes interessados em preservar a memória.",
    author: "HÜSEYİN AVCI",
  },
  {
    image:
      "https://images.pexels.com/photos/34804016/pexels-photo-34804016.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Tecnologia",
    title: "Novas ferramentas digitais transformam a rotina de desenvolvimento",
    description:
      "Ambientes de trabalho mais conectados aproximam criatividade, código e colaboração.",
    author: "Daniil Komov",
  },
  {
    image:
      "https://images.pexels.com/photos/7208320/pexels-photo-7208320.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Cidades",
    title: "Edifícios históricos inspiram novos projetos urbanos",
    description:
      "A preservação de fachadas clássicas ganha espaço em discussões sobre o futuro das cidades.",
    author: "Darya Sannikova",
  },
  {
    image:
      "https://images.pexels.com/photos/39825117/pexels-photo-39825117.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Cultura",
    title: "Detalhes arquitetônicos revelam a riqueza cultural de Samarcanda",
    description:
      "Elementos geométricos e azulejos contam histórias de diferentes gerações.",
    author: "Alexander Gluschenko",
  },
];

const newsGrid: NewsItem[] = [
  {
    image:
      "https://images.pexels.com/photos/38862877/pexels-photo-38862877.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Mídia",
    title: "Como acompanhar as notícias em um mundo cada vez mais veloz",
    description: "Uma leitura sobre informação, contexto e responsabilidade editorial.",
    author: "Ann H",
  },
  {
    image:
      "https://images.pexels.com/photos/8247921/pexels-photo-8247921.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Segurança",
    title: "Boas práticas ajudam a evitar falhas de autenticação",
    description: "Especialistas explicam como proteger acessos digitais.",
    author: "Markus Spiske",
  },
  {
    image:
      "https://images.pexels.com/photos/38862878/pexels-photo-38862878.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Atualidade",
    title: "A importância de separar notícia, opinião e análise",
    description: "Clareza editorial é essencial para uma informação confiável.",
    author: "Ann H",
  },
  {
    image:
      "https://images.pexels.com/photos/6502328/pexels-photo-6502328.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Tecnologia",
    title: "Desenvolvedores buscam sistemas mais seguros e transparentes",
    description: "Código bem estruturado é parte importante da segurança digital.",
    author: "Markus Spiske",
  },
  {
    image:
      "https://images.pexels.com/photos/36706459/pexels-photo-36706459.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Inovação",
    title: "Trabalho colaborativo acelera a criação de novos produtos",
    description: "Equipes multidisciplinares compartilham ideias em ambientes modernos.",
    author: "Zayed Hossain",
  },
  {
    image:
      "https://images.pexels.com/photos/30869078/pexels-photo-30869078.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Internacional",
    title: "As palavras que dominam o debate global nesta semana",
    description: "Termos recorrentes revelam os assuntos que movimentam o noticiário.",
    author: "Markus Winkler",
  },
  {
    image:
      "https://images.pexels.com/photos/19107334/pexels-photo-19107334.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Sociedade",
    title: "Jornais impressos ainda ocupam espaço na rotina urbana",
    description: "O hábito de começar o dia com informação resiste à era digital.",
    author: "Jan van der Wolf",
  },
  {
    image:
      "https://images.pexels.com/photos/38748859/pexels-photo-38748859.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Opinião",
    title: "O papel do jornalismo em tempos de excesso de informação",
    description: "Curadoria e contexto ajudam leitores a compreender os fatos.",
    author: "Ann H",
  },
  {
    image:
      "https://images.pexels.com/photos/6212801/pexels-photo-6212801.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Ciência",
    title: "Tecnologia exige atenção redobrada para evitar vulnerabilidades",
    description: "A prevenção continua sendo o melhor caminho para sistemas confiáveis.",
    author: "Markus Spiske",
  },
  {
    image:
      "https://images.pexels.com/photos/6804613/pexels-photo-6804613.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Mercado",
    title: "Empresas reorganizam seus ambientes para uma nova fase digital",
    description: "A infraestrutura acompanha a mudança nas formas de trabalhar.",
    author: "cottonbro studio",
  },
  {
    image:
      "https://images.pexels.com/photos/10464785/pexels-photo-10464785.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Ao vivo",
    title: "Bastidores mostram o trabalho por trás de uma transmissão",
    description: "Repórteres e equipes técnicas trabalham juntos para levar informação ao público.",
    author: "cottonbro studio",
  },
  {
    image:
      "https://images.pexels.com/photos/15779815/pexels-photo-15779815.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Design",
    title: "Geometria e luz renovam a identidade de prédios contemporâneos",
    description: "Fachadas modernas revelam novas possibilidades para a arquitetura.",
    author: "Josh Withers",
  },
  {
    image:
      "https://images.pexels.com/photos/3944425/pexels-photo-3944425.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Comportamento",
    title: "A pausa para o café continua acompanhando a leitura diária",
    description: "Pequenos rituais ajudam a criar espaço para informação e reflexão.",
    author: "cottonbro studio",
  },
  {
    image:
      "https://images.pexels.com/photos/4439425/pexels-photo-4439425.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Tecnologia",
    title: "Quando uma mensagem de erro revela mais do que parece",
    description: "Interfaces também comunicam problemas, riscos e oportunidades.",
    author: "Vie Studio",
  },
  {
    image:
      "https://images.pexels.com/photos/34803973/pexels-photo-34803973.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Trabalho",
    title: "Produtividade nasce do equilíbrio entre foco e criatividade",
    description: "Ambientes bem planejados apoiam profissionais em tarefas complexas.",
    author: "Daniil Komov",
  },
  {
    image:
      "https://images.pexels.com/photos/29708154/pexels-photo-29708154.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Arquitetura",
    title: "Skylights levam novas perspectivas para espaços internos",
    description: "A luz natural muda a experiência em edifícios contemporâneos.",
    author: "Almir reis",
  },
  {
    image:
      "https://images.pexels.com/photos/1888015/pexels-photo-1888015.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Cultura digital",
    title: "Linguagem visual transforma mensagens simples em ideias marcantes",
    description: "Cores e símbolos podem mudar a forma como uma informação é percebida.",
    author: "Ann H",
  },
  {
    image:
      "https://images.pexels.com/photos/4218883/pexels-photo-4218883.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Carreira",
    title: "Home offices evoluem para acompanhar profissionais híbridos",
    description: "Conforto e estrutura se tornam prioridades na rotina de trabalho.",
    author: "Paras Katwal",
  },
  {
    image:
      "https://images.pexels.com/photos/10464786/pexels-photo-10464786.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Reportagem",
    title: "A notícia acontece onde as equipes estão presentes",
    description: "O jornalismo de rua aproxima acontecimentos e comunidades.",
    author: "cottonbro studio",
  },
  {
    image:
      "https://images.pexels.com/photos/39722022/pexels-photo-39722022.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Patrimônio",
    title: "Monumentos preservam memórias que atravessam gerações",
    description: "A arquitetura histórica continua inspirando novas narrativas.",
    author: "HÜSEYİN AVCI",
  },
  {
    image:
      "https://images.pexels.com/photos/7208320/pexels-photo-7208320.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Cidades",
    title: "Detalhes urbanos mostram a personalidade de cada bairro",
    description: "Portas, fachadas e praças ajudam a contar a história local.",
    author: "Darya Sannikova",
  },
  {
    image:
      "https://images.pexels.com/photos/34804016/pexels-photo-34804016.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Startups",
    title: "Novas ideias ganham forma em espaços de criação compartilhada",
    description: "A colaboração segue como motor de inovação no setor digital.",
    author: "Daniil Komov",
  },
  {
    image:
      "https://images.pexels.com/photos/10464798/pexels-photo-10464798.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Jornalismo",
    title: "Repórteres conectam o público aos fatos mais importantes",
    description: "Informação apurada chega de diferentes pontos da cidade.",
    author: "cottonbro studio",
  },
  {
    image:
      "https://images.pexels.com/photos/38862877/pexels-photo-38862877.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Editorial",
    title: "As notícias do dia começam com uma boa pergunta",
    description: "Investigar, contextualizar e informar são etapas de uma mesma missão.",
    author: "Ann H",
  },
];

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroStories.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  const currentStory = heroStories[activeSlide];

  const goToPrevious = () => {
    setActiveSlide(
      (current) => (current - 1 + heroStories.length) % heroStories.length,
    );
  };

  const goToNext = () => {
    setActiveSlide((current) => (current + 1) % heroStories.length);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight">
                Pulso
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Notícias em movimento
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a className="text-foreground" href="#urgentes">
              Urgentes
            </a>
            <a className="transition-colors hover:text-foreground" href="#recentes">
              Recentes
            </a>
            <a className="transition-colors hover:text-foreground" href="#sobre">
              Sobre o portal
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Pesquisar notícias">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Abrir menu">
              <Menu className="h-4 w-4" />
            </Button>
            <Button className="hidden sm:inline-flex">Assine agora</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <section id="urgentes" aria-labelledby="breaking-news-title">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-destructive px-3 py-1.5 text-xs font-bold tracking-wide text-destructive-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                NOTÍCIAS URGENTES
              </span>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Atualizado agora
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                aria-label="Notícia anterior"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                aria-label="Próxima notícia"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative min-h-[490px] overflow-hidden rounded-2xl bg-foreground shadow-xl sm:min-h-[560px]">
            {heroStories.map((story, index) => (
              <img
                key={story.image}
                src={story.image}
                alt={story.title}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  index === activeSlide ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/45 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">
                {currentStory.category}
              </p>
              <h1
                id="breaking-news-title"
                className="text-balance font-display text-3xl font-bold leading-tight text-background sm:text-5xl"
              >
                {currentStory.title}
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-background/75 sm:text-base">
                {currentStory.description}
              </p>
              <p className="mt-5 text-xs text-background/55">
                Foto: {currentStory.author} / Pexels
              </p>
            </div>

            <div className="absolute bottom-6 right-6 flex items-center gap-2 sm:bottom-10 sm:right-10">
              {heroStories.map((story, index) => (
                <button
                  key={story.title}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Ir para notícia ${index + 1}`}
                  aria-current={index === activeSlide}
                  className={`h-2 rounded-full transition-all ${
                    index === activeSlide
                      ? "w-8 bg-background"
                      : "w-2 bg-background/50 hover:bg-background/80"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="recentes" className="mt-14" aria-labelledby="recent-title">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Em destaque
              </p>
              <h2 id="recent-title" className="font-display text-3xl font-bold tracking-tight">
                Notícias recentes
              </h2>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">
              24 histórias para acompanhar
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-12">
            {newsGrid.map((story) => (
              <article
                key={`${story.title}-${story.image}`}
                className="group min-w-0 lg:col-span-2"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/35 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    {story.category}
                  </p>
                  <h3 className="mt-1.5 line-clamp-3 font-display text-base font-bold leading-snug transition-colors group-hover:text-primary">
                    {story.title}
                  </h3>
                  <p className="mt-2 hidden text-xs leading-relaxed text-muted-foreground sm:block">
                    {story.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    <span>Leitura de 3 min</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <footer id="sobre" className="mt-8 border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2025 Pulso. Informação clara para todos os dias.</p>
          <p>
            Fotografias: colaboradores creditados individualmente, via Pexels.
          </p>
        </div>
      </footer>
    </main>
  );
}