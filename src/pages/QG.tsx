import { useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, Clock3, ShieldCheck } from "lucide-react";
import AppNavigation from "@/components/AppNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Report = {
  title: string;
  date: string;
  readingTime: string;
  summary: string;
  content: string[];
  category: string;
};

const reports: Report[] = [
  {
    title: "Panorama do dia: prioridades e cenários",
    date: "18 de junho de 2026",
    readingTime: "6 min de leitura",
    summary:
      "Uma leitura objetiva dos principais movimentos do dia e dos fatores que merecem atenção.",
    category: "PANORAMA DIÁRIO",
    content: [
      "Este panorama reúne os temas que podem influenciar as decisões e os acontecimentos ao longo do dia. A proposta é separar os fatos relevantes do ruído e oferecer contexto para acompanhar os próximos desdobramentos.",
      "Entre os pontos de atenção estão as decisões públicas, os indicadores econômicos e os acontecimentos internacionais. Observe como esses temas se conectam e quais sinais novos podem alterar as expectativas.",
      "Acompanhe as atualizações das fontes de referência e considere diferentes perspectivas antes de formar uma conclusão. Este relatório é informativo e deve ser lido como um ponto de partida para análise.",
    ],
  },
  {
    title: "Economia em foco: indicadores para acompanhar",
    date: "17 de junho de 2026",
    readingTime: "8 min de leitura",
    summary:
      "Indicadores, tendências e perguntas úteis para entender o cenário econômico recente.",
    category: "ECONOMIA",
    content: [
      "Os indicadores econômicos ajudam a entender a direção da atividade, mas ganham significado quando observados em conjunto. Inflação, emprego, juros e confiança oferecem perspectivas diferentes sobre o mesmo cenário.",
      "Para acompanhar os próximos dados, compare os resultados com as expectativas e com os períodos anteriores. Mudanças consistentes tendem a ser mais informativas do que uma variação isolada.",
      "O contexto global também importa: preços de commodities, decisões de bancos centrais e condições de comércio podem afetar os resultados domésticos.",
    ],
  },
  {
    title: "Cenário internacional: tendências e impactos",
    date: "16 de junho de 2026",
    readingTime: "5 min de leitura",
    summary:
      "Os acontecimentos globais em perspectiva e seus possíveis reflexos no Brasil.",
    category: "MUNDO",
    content: [
      "O cenário internacional é influenciado por decisões diplomáticas, condições econômicas e mudanças nas relações entre países. Acompanhar esses fatores em perspectiva ajuda a compreender seus possíveis efeitos.",
      "No curto prazo, vale observar os anúncios oficiais e a reação dos mercados. No médio prazo, acordos, políticas comerciais e mudanças regulatórias podem ter impacto mais duradouro.",
      "As consequências para o Brasil dependem dos canais de transmissão, como comércio, investimentos e preços internacionais. Novos dados poderão confirmar ou modificar as tendências atuais.",
    ],
  },
];

export default function QG() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  return (
    <main className="min-h-screen bg-muted/30 pb-16 sm:pb-0">
      <AppNavigation />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="qg-hero mb-8 flex flex-col justify-between gap-5 rounded-3xl border border-border/70 p-6 shadow-sm sm:mb-10 sm:flex-row sm:items-end sm:p-9">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
              <ShieldCheck className="size-4" />
              ÁREA DO MEMBRO
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              QG
            </h1>
            <p className="mt-2 text-lg font-medium text-foreground/75">
              Panorama Diário
            </p>
          </div>

          <Badge variant="secondary" className="qg-member-badge w-fit gap-2 px-3 py-2">
            <span className="size-2 rounded-full bg-radar-green shadow-[0_0_8px_var(--radar-green)]" />
            Membro Ativo
          </Badge>
        </header>

        <section aria-labelledby="reports-title">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 id="reports-title" className="font-display text-2xl font-semibold">
                Análises e relatórios
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Leituras selecionadas para acompanhar os principais temas.
              </p>
            </div>
            <BookOpen className="hidden size-6 text-muted-foreground sm:block" />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {reports.map((report) => (
              <Card
                key={report.title}
                className="gap-0 overflow-hidden rounded-3xl border-border/80 bg-card py-0 shadow-md transition-shadow hover:shadow-lg"
              >
                <div aria-hidden="true" className="qg-report-art" />
                <CardHeader className="gap-3 p-5 sm:p-6">
                  <Badge variant="secondary" className="qg-report-badge w-fit text-xs tracking-wide">
                    {report.category}
                  </Badge>
                  <CardTitle className="text-xl leading-snug">
                    {report.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {report.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto p-5 pt-0 sm:p-6 sm:pt-0">
                  <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {report.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="size-3.5" />
                      {report.readingTime}
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setSelectedReport(report)}
                    className="gap-2"
                  >
                    Ler Panorama
                    <ArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <Dialog
        open={selectedReport !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedReport(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          {selectedReport && (
            <>
              <DialogHeader>
                <Badge variant="outline" className="mb-2 w-fit text-xs tracking-wide">
                  {selectedReport.category}
                </Badge>
                <DialogTitle className="font-display text-2xl leading-snug">
                  {selectedReport.title}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>{selectedReport.date}</span>
                  <span>{selectedReport.readingTime}</span>
                </DialogDescription>
              </DialogHeader>
              <article className="space-y-5 text-[15px] leading-7 text-foreground">
                {selectedReport.content.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </article>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}