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

  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Report = {
  title: string;

  summary: string;
  content: string[];
  category: string;
};

const reports: Report[] = [
  {
    title: "Prioridades e cenários políticos",
    summary:
      "Uma leitura dos principais temas políticos e dos fatores que podem influenciar os próximos desdobramentos.",
    category: "PANORAMA DIÁRIO",
    content: [
      "Este panorama reúne temas políticos relevantes e organiza os principais fatores que podem influenciar decisões e acontecimentos. A proposta é separar os fatos do ruído e oferecer contexto para acompanhar os próximos desdobramentos.",
      "Observe como as pautas públicas, as articulações políticas e os acontecimentos internacionais se conectam. Novos sinais podem alterar expectativas e prioridades.",
      "Considere diferentes perspectivas antes de formar uma conclusão. Este conteúdo é informativo e serve como ponto de partida para análise.",
    ],
  },
  {
    title: "Indicadores e tendências de mercado",
    summary:
      "Indicadores econômicos e movimentos de mercado para acompanhar e compreender o cenário atual.",
    category: "ECONOMIA",
    content: [
      "Indicadores econômicos ajudam a entender a direção da atividade e ganham significado quando observados em conjunto. Inflação, emprego, juros e confiança oferecem perspectivas diferentes sobre o mesmo cenário.",
      "Compare os resultados com as expectativas e com períodos anteriores. Mudanças consistentes tendem a ser mais informativas do que uma variação isolada.",
      "O contexto global também importa: preços de commodities, decisões de política monetária e condições de comércio podem afetar o mercado doméstico.",
    ],
  },
  {
    title: "Pautas no Congresso e impactos institucionais",
    summary:
      "Uma análise das pautas legislativas em debate e de seus possíveis efeitos sobre as instituições.",
    category: "LEGISLAÇÃO & LIBERDADE",
    content: [
      "As pautas em discussão no Congresso podem produzir efeitos duradouros sobre leis, políticas públicas e o funcionamento das instituições.",
      "Para compreender cada proposta, vale observar seu texto, a tramitação, os argumentos apresentados e os possíveis impactos sobre direitos e responsabilidades.",
      "O acompanhamento de diferentes perspectivas ajuda a avaliar os desdobramentos institucionais com mais contexto.",
    ],
  },
  {
    title: "Estratégias e visão de cenário",
    summary:
      "Uma leitura tática dos sinais atuais, dos riscos e das oportunidades que podem orientar decisões.",
    category: "ANÁLISE TÁTICA",
    content: [
      "Uma visão tática começa pela identificação dos sinais mais relevantes e pela distinção entre tendências consistentes e acontecimentos pontuais.",
      "Considere os riscos, as oportunidades e os possíveis cenários antes de definir prioridades. Uma estratégia clara também precisa se adaptar quando surgem novas informações.",
      "Acompanhar os próximos movimentos com atenção permite revisar hipóteses e tomar decisões mais bem informadas.",
    ],
  },
];

export default function QG() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-16 sm:pb-0">
      <AppNavigation />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex flex-col justify-between gap-5 rounded-none border border-border bg-white p-6 shadow-sm sm:mb-10 sm:flex-row sm:items-end sm:p-9">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#002B7F]">
              <ShieldCheck className="size-4" />
              ÁREA DO MEMBRO
            </div>
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-[#0F172A] sm:text-6xl">
              QG
            </h1>
            <p className="mt-2 text-lg font-bold text-[#0F172A]">
              Panorama Diário
            </p>
          </div>

          <Badge variant="secondary" className="w-fit gap-2 rounded-none bg-emerald-100 px-2 py-1 text-xs font-semibold text-[#15803D]">
            <span className="size-2 rounded-full bg-[#00A859] shadow-[0_0_8px_#00A859]" />
            Patriota Online
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
                className="gap-0 overflow-hidden rounded-none border-l-4 border-l-[#047857] border-[#CBD5E1] bg-white py-0 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="gap-3 p-5 sm:p-6">
                  <Badge variant="outline" className="w-fit rounded-none border-emerald-200 bg-[#DCFCE7] text-xs font-semibold tracking-wide text-[#15803D]">
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

                  <div aria-hidden="true" className="my-5 h-px w-full bg-slate-200" />
                  <Button
                    type="button"
                    onClick={() => setSelectedReport(report)}
                    className="w-full gap-2 rounded-none bg-gradient-to-r from-blue-800 to-blue-600 font-bold text-white hover:from-blue-900 hover:to-blue-700 sm:w-auto"
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
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-none sm:max-w-2xl">
          {selectedReport && (
            <>
              <DialogHeader>
                <Badge variant="outline" className="mb-2 w-fit rounded-none text-xs tracking-wide">
                  {selectedReport.category}
                </Badge>
                <DialogTitle className="font-display text-2xl leading-snug">
                  {selectedReport.title}
                </DialogTitle>

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