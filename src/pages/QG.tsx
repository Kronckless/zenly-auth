import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
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
  categoria: string;
  titulo: string;
  resumo: string;
  conteudo_completo: string;
  created_at: string;
};

function extractReadableText(value: unknown): string {
  if (typeof value === "string") {
    const text = value.trim();
    try {
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null) {
        return extractReadableText(parsed);
      }
    } catch {
      return text;
    }
    return text;
  }

  if (Array.isArray(value)) {
    return value.map(extractReadableText).filter(Boolean).join("\n");
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    for (const key of ["text", "content", "parts", "candidates", "data", "output", "result", "message", "response"]) {
      if (key in record) {
        const text = extractReadableText(record[key]);
        if (text) return text;
      }
    }
  }

  return "";
}

function findNestedReportField(value: unknown, field: keyof Report): string {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) {
        return findNestedReportField(parsed, field);
      }
    } catch {
      // Texto comum não contém outro campo nomeado para localizar.
    }
    return "";
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findNestedReportField(item, field);
      if (result) return result;
    }
    return "";
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (field in record) return getReportField(record[field], field);

    for (const item of Object.values(record)) {
      const result = findNestedReportField(item, field);
      if (result) return result;
    }
  }

  return "";
}

function getReportField(value: unknown, field: keyof Report): string {
  if (typeof value === "string") {
    const text = value.trim();
    try {
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null) {
        return findNestedReportField(parsed, field);
      }
    } catch {
      return text;
    }
    return text;
  }

  if (Array.isArray(value)) {
    return findNestedReportField(value, field);
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (field in record) return getReportField(record[field], field);
    return findNestedReportField(record, field);
  }

  return "";
}

export default function QG() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      setLoadError("");
      if (!supabase) {
        setLoadError("A conexão com o serviço de conteúdo não está configurada.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("panoramas")
        .select("categoria, titulo, resumo, conteudo_completo, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setLoadError("Não foi possível carregar os panoramas agora.");
      } else {
        setReports(
          (data ?? []).map((row) => ({
            categoria: getReportField(row, "categoria"),
            titulo: getReportField(row, "titulo"),
            resumo: getReportField(row, "resumo"),
            conteudo_completo: getReportField(row, "conteudo_completo"),
            created_at: getReportField(row, "created_at"),
          })),
        );
      }
      setIsLoading(false);
    }

    loadReports();
  }, [retryKey]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-16 sm:pb-0">
      <AppNavigation />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex flex-col justify-between gap-5 rounded-none border border-border bg-white p-6 shadow-sm sm:mb-10 sm:flex-row sm:items-end sm:p-9">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#991B1B]">
              <ShieldCheck className="size-4" />
              QUADRO DE GIRO
            </div>
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-[#0F172A] sm:text-6xl">
              QG
            </h1>
            <p className="mt-2 text-lg font-bold text-[#0F172A]">
              Dossiê Semanal
            </p>
          </div>

          <Badge variant="secondary" className="w-fit gap-2 rounded-none bg-emerald-100 px-2 py-1 text-xs font-semibold text-[#15803D]">
            <span className="size-2 rounded-full bg-[#00A859] shadow-[0_0_8px_#00A859]" />
            Você está online
          </Badge>
        </header>

        <section aria-labelledby="reports-title">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 id="reports-title" className="font-display text-2xl font-semibold">
                Relatórios de Inteligência
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Relatórios e análises estratégicas atualizados semanalmente.
              </p>
            </div>
            <BookOpen className="hidden size-6 text-muted-foreground sm:block" />
          </div>

          {isLoading ? (
            <p className="py-8 text-sm text-muted-foreground" role="status">
              Carregando panoramas...
            </p>
          ) : loadError ? (
            <div className="py-8" role="alert">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setRetryKey((key) => key + 1)}
              >
                Verificar novamente
              </Button>
            </div>
          ) : reports.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              Nenhum panorama disponível no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {reports.map((report, index) => (
                <Card
                  key={`${report.created_at}-${index}`}
                  className="gap-0 overflow-hidden rounded-none border-l-4 border-l-[#047857] border-[#CBD5E1] bg-white py-0 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardHeader className="gap-3 p-5 sm:p-6">
                    <Badge variant="outline" className="w-fit rounded-none border-emerald-200 bg-[#DCFCE7] text-xs font-semibold tracking-wide text-[#15803D]">
                      {report.categoria}
                    </Badge>
                    <CardTitle className="text-xl leading-snug">
                      {report.titulo}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {report.resumo}
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
          )}
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
                  {selectedReport.categoria}
                </Badge>
                <DialogTitle className="font-display text-2xl leading-snug">
                  {selectedReport.titulo}
                </DialogTitle>

              </DialogHeader>
              <article className="space-y-5 text-[15px] leading-7 text-foreground">
                {selectedReport.conteudo_completo
                  .split(/\n+/)
                  .filter((paragraph) => paragraph.trim().length > 0)
                  .map((paragraph, index) => (
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