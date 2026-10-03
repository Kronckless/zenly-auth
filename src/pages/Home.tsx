import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Search,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Story = {
  image: string;
  category: string;
  title: string;
  description: string;
  photographer: string;
};

const heroStories: Story[] = [
  {
    image:
      "https://images.pexels.com/photos/38862877/pexels-photo-38862877.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Cobertura especial",
    title: "As notícias do dia começam com informação clara e contexto",
    description:
      "Acompanhe os assuntos que estão movimentando o mundo, reunidos em uma leitura objetiva.",
    photographer: "Ann H",
  },
  {
    image:
      "https://images.pexels.com/photos/28123668/pexels-photo-28123668.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Saúde",
    title: "Profissionais de emergência reforçam a importância da resposta rápida",
    description:
      "Equipes preparadas fazem a diferença quando cada minuto pode transformar uma história.",
    photographer: "Mikhail Nilov",
  },
  {
    image:
      "https://images.pexels.com/photos/326514/pexels-photo-326514.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Tecnologia",
    title: "Ferramentas digitais redesenham a forma como o trabalho acontece",
    description:
      "Novas experiências conectam criatividade, informação e produtividade em ambientes digitais.",
    photographer: "Tranmautritam",
  },
  {
    image:
      "https://images.pexels.com/photos/20457113/pexels-photo-20457113.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Mídia",
    title: "Combater a desinformação exige atenção aos detalhes",
    description:
      "Fontes confiáveis e leitura crítica ajudam a separar fatos de mensagens enganosas.",
    photographer: "Insaanu Studio",
  },
  {
    image:
      "https://images.pexels.com/photos/5505718/pexels-photo-5505718.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Jornalismo",
    title: "O papel do jornal impresso permanece vivo na rotina dos leitores",
    description:
      "A apuração cuidadosa continua sendo uma das bases para compreender o presente.",
    photographer: "Mike van Schoonderwalt",
  },
];

const newsItems: Story[] = [
  {
    image:
      "https://images.pexels.com/photos/38862878/pexels-photo-38862878.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Atualidade",
    title: "O que realmente importa nas notícias desta semana",
    description: "Uma seleção dos temas que merecem atenção.",
    photographer: "Ann H",
  },
  {
    image:
      "https://images.pexels.com/photos/2882634/pexels-photo-2882634.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Editorial",
    title: "A linguagem das notícias também comunica prioridades",
    description: "Como escolhas visuais ajudam a informar.",
    photographer: "Miguel Á. Padriñán",
  },
  {
    image:
      "https://images.pexels.com/photos/3944425/pexels-photo-3944425.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Comportamento",
    title: "Café e jornal: pequenos rituais que atravessam gerações",
    description: "A leitura como parte da rotina diária.",
    photographer: "cottonbro studio",
  },
  {
    image:
      "https://images.pexels.com/photos/8941908/pexels-photo-8941908.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Sociedade",
    title: "Preparação é essencial para profissionais de emergência",
    description: "Bastidores de quem está pronto para ajudar.",
    photographer: "Mikhail Nilov",
  },
  {
    image:
      "https://images.pexels.com/photos/7191162/pexels-photo-7191162.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Economia",
    title: "Compras digitais transformam a experiência do consumidor",
    description: "Tecnologia aproxima negócios e pessoas.",
    photographer: "Pavel Danilyuk",
  },
  {
    image:
      "https://images.pexels.com/photos/6314973/pexels-photo-6314973.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Cultura",
    title: "Lazer e convivência continuam criando novas memórias",
    description: "Experiências compartilhadas aproximam comunidades.",
    photographer: "Uriel Mont",
  },
  {
    image:
      "https://images.pexels.com/photos/8942071/pexels-photo-8942071.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Saúde",
    title: "A rotina de atendimento exige foco e preparo",
    description: "Conheça o trabalho de equipes especializadas.",
    photographer: "Mikhail Nilov",
  },
  {
    image:
      "https://images.pexels.com/photos/29858264/pexels-photo-29858264.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Cidades",
    title: "Resíduos revelam desafios para o planejamento urbano",
    description: "Pequenas mudanças podem melhorar os espaços públicos.",
    photographer: "Toàn Văn",
  },
  {
    image:
      "https://images.pexels.com/photos/15635401/pexels-photo-15635401.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Internet",
    title: "Plataformas digitais aproximam marcas e comunidades",
    description: "A comunicação online ganha novas possibilidades.",
    photographer: "Walls.io",
  },
  {
    image:
      "https://images.pexels.com/photos/7568299/pexels-photo-7568299.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Mundo",
    title: "O noticiário cabe na palma da mão",
    description: "Aplicativos mudaram o hábito de acompanhar fatos.",
    photographer: "Brett Jordan",
  },
  {
    image:
      "https://images.pexels.com/photos/30917907/pexels-photo-30917907.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Análise",
    title: "Boas perguntas orientam uma investigação relevante",
    description: "Curiosidade é parte da apuração jornalística.",
    photographer: "Markus Winkler",
  },
  {
    image:
      "https://images.pexels.com/photos/7618405/pexels-photo-7618405.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Imprensa",
    title: "Informação de qualidade pede tempo e responsabilidade",
    description: "O trabalho por trás de uma boa reportagem.",
    photographer: "cottonbro studio",
  },
  {
    image:
      "https://images.pexels.com/photos/6991796/pexels-photo-6991796.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Negócios",
    title: "Organização visual ajuda equipes a tomar decisões",
    description: "Ideias ficam mais claras quando são bem estruturadas.",
    photographer: "DS stories",
  },
  {
    image:
      "https://images.pexels.com/photos/14553707/pexels-photo-14553707.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Programação",
    title: "Código continua no centro da inovação digital",
    description: "Desenvolvedores criam soluções para novos desafios.",
    photographer: "Bibek ghosh",
  },
  {
    image:
      "https://images.pexels.com/photos/17609924/pexels-photo-17609924.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Leitura",
    title: "Jornais ainda convidam o leitor a desacelerar",
    description: "Uma pausa para acompanhar as histórias do mundo.",
    photographer: "Beyzanur K.",
  },
  {
    image:
      "https://images.pexels.com/photos/29556471/pexels-photo-29556471.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Internacional",
    title: "Diferentes vozes ajudam a ampliar a visão dos acontecimentos",
    description: "A diversidade de fontes enriquece o debate.",
    photographer: "Moussa Idrissi",
  },
  {
    image:
      "https://images.pexels.com/photos/6000150/pexels-photo-6000150.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Carreira",
    title: "Profissionais acompanham as mudanças do mercado",
    description: "Informação também apoia escolhas profissionais.",
    photographer: "Ono Kosuki",
  },
  {
    image:
      "https://images.pexels.com/photos/5999982/pexels-photo-5999982.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Empreendedorismo",
    title: "Novas lideranças constroem negócios mais conectados",
    description: "Empreendedores buscam soluções para um novo cenário.",
    photographer: "Ono Kosuki",
  },
  {
    image:
      "https://images.pexels.com/photos/6991380/pexels-photo-6991380.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Ideias",
    title: "Mapear pensamentos facilita projetos mais criativos",
    description: "Colaboração nasce de boas conexões.",
    photographer: "DS stories",
  },
  {
    image:
      "https://images.pexels.com/photos/20457113/pexels-photo-20457113.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Verificação",
    title: "Antes de compartilhar, é preciso conferir a informação",
    description: "Responsabilidade digital começa com a checagem.",
    photographer: "Insaanu Studio",
  },
  {
    image:
      "https://images.pexels.com/photos/326514/pexels-photo-326514.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Design",
    title: "Interfaces mais humanas aproximam tecnologia e usuários",
    description: "Clareza é uma qualidade essencial no digital.",
    photographer: "Tranmautritam",
  },
  {
    image:
      "https://images.pexels.com/photos/5505718/pexels-photo-5505718.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Memória",
    title: "A história também pode ser encontrada nas páginas de um jornal",
    description: "Arquivos ajudam a entender o caminho até aqui.",
    photographer: "Mike van Schoonderwalt",
  },
  {
    image:
      "https://images.pexels.com/photos/7568299/pexels-photo-7568299.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Tecnologia",
    title: "Notificações mudam a velocidade da informação",
    description: "O desafio é acompanhar sem perder o contexto.",
    photographer: "Brett Jordan",
  },
  {
    image:
      "https://images.pexels.com/photos/28123668/pexels-photo-28123668.jpeg?auto=compress&cs=tinysrgb&w=1600",
    category: "Serviço",
    title: "Cuidar de pessoas continua sendo uma notícia importante",
    description: "Conheça histórias de dedicação e presença.",
    photographer: "Mikhail Nilov",
  },
];

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroStories.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  const goToPrevious = () => {
    setActiveSlide(
      (current) => (current - 1 + heroStories.length) % heroStories.length,
    );
  };

  const goToNext = () => {
    setActiveSlide((current) => (current + 1) % heroStories.length);
  };

  const currentStory = heroStories[activeSlide];

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="size-5 fill-current" />
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight">
                Pulso
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Notícias em movimento
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#urgentes" className="hover:text-foreground">
              Urgentes
            </a>
            <a href="#recentes" className="hover:text-foreground">
              Recentes
            </a>
            <a href="#sobre" className="hover:text-foreground">
              Sobre o portal
            </a>
          </nav>

          <Button variant="ghost" size="icon" aria-label="Pesquisar notícias">
            <Search className="size-4" />
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <section id="urgentes" aria-labelledby="breaking-news-title">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-destructive px-3 py-1.5 text-xs font-bold tracking-wide text-destructive-foreground">
                <span className="size-1.5 animate-pulse rounded-full bg-current" />
                NOTÍCIAS URGENTES
              </span>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Atualizado agora
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                aria-label="Notícia anterior"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                aria-label="Próxima notícia"
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="relative min-h-[480px] overflow-hidden rounded-2xl bg-foreground shadow-xl sm:min-h-[560px]">
            {heroStories.map((story, index) => (
              <img
                key={story.image}
                src={story.image}
                alt={story.title}
                className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
                  index === activeSlide ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}

            <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/50 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 max-w-3xl p-6 sm:p-10">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-background/75">
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
              <p className="mt-5 text-xs text-background/60">
                Foto: {currentStory.photographer} / Pexels
              </p>
            </div>

            <div className="absolute bottom-6 right-6 flex gap-2 sm:bottom-10 sm:right-10">
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
              <h2
                id="recent-title"
                className="font-display text-3xl font-bold tracking-tight"
              >
                Notícias recentes
              </h2>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">
              24 histórias para acompanhar
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-12">
            {newsItems.map((story) => (
              <article
                key={`${story.title}-${story.image}`}
                className="group min-w-0 lg:col-span-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    {story.category}
                  </p>
                  <h3 className="mt-1.5 line-clamp-3 font-display text-sm font-bold leading-snug transition-colors group-hover:text-primary">
                    {story.title}
                  </h3>
                  <p className="mt-2 hidden text-xs leading-relaxed text-muted-foreground sm:block">
                    {story.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock3 className="size-3" />
                    <span>Leitura de 3 min</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <footer id="sobre" className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-5 py-8 text-xs leading-relaxed text-muted-foreground sm:px-8">
          <p>© 2025 Pulso. Informação clara para todos os dias.</p>
          <p className="mt-2">
            Fotografias: Ann H, Mikhail Nilov, Tranmautritam, Insaanu Studio,
            Mike van Schoonderwalt, Miguel Á. Padriñán, cottonbro studio, Pavel
            Danilyuk, Uriel Mont, Toàn Văn, Walls.io, Brett Jordan, Markus
            Winkler, DS stories, Bibek ghosh, Beyzanur K., Moussa Idrissi e Ono
            Kosuki via Pexels.
          </p>
        </div>
      </footer>
    </main>
  );
}