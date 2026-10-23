import { useEffect, useMemo, useState } from "react";
import AppNavigation from "@/components/AppNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Search } from "lucide-react";

type Report = {
  id: string;
  categoria: string;
  titulo: string;
  resumo: string;
  conteudoCompleto: string;
  data: string;
};

const filters = ["Todos", "Política", "Economia"];

function findText(value: unknown, field: string): string {
  if (typeof value === "string") {
    const text = value.trim();
    try {
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null) {
        return findText(parsed, field);
      }
    } catch {
      return text;
    }
    return text;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findText(item, field);
      if (result) return result;
    }
    return "";
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (field in record) return findText(record[field], field);

    for (const item of Object.values(record)) {
      const result = findText(item, field);
      if (result) return result;
    }
  }

  return "";
}

function getField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    if (key in row) {
      const value = findText(row[key], key);
      if (value) return value;
    }
  }
  return "";
}

function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

export default function Explore() {
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setIsLoading(true);
      setError("");

      if (!supabase) {
        setError("O acervo não está conectado no momento.");
        setIsLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("panoramas")
        .select("titulo, resumo, conteudo_completo, created_at")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (queryError) {
        setError("Não foi possível carregar o acervo. Tente novamente.");
        setIsLoading(false);
        return;
      }

      const rows = (data ?? []) as Record<string, unknown>[];
      setReports(
        rows.map((row, index) => ({
          id: String(row.id ?? index),
          categoria: getField(row, "categoria", "category") || "Geral",
          titulo: getField(row, "titulo", "title") || "Relatório sem título",
          resumo: getField(row, "resumo", "summary") || "Resumo não disponível.",
          conteudoCompleto: getField(row, "conteudo_completo", "content"),
          data: getField(row, "created_at"),
        })),
      );
      setIsLoading(false);
    }

    void loadReports();
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const visibleReports = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return reports.filter((report) => {
      const matchesFilter =
        activeFilter === "Todos" ||
        report.categoria.toLocaleLowerCase("pt-BR").includes(activeFilter.toLocaleLowerCase("pt-BR"));
      const searchableText = `${report.categoria} ${report.titulo} ${report.resumo} ${report.conteudoCompleto}`
        .toLocaleLowerCase("pt-BR");
      const searchTerms = query.split(/\s+/).filter(Boolean);
      const matchesSearch =
        searchTerms.length === 0 ||
        searchTerms.some((term) => searchableText.includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [reports, search, activeFilter]);

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <AppNavigation />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Acervo Horizonte
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Explorar</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Pesquise no acervo completo e descubra análises passadas.
          </p>
        </header>

        <section aria-label="Pesquisar no acervo" className="mb-8">
          <div className="relative max-w-3xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar relatórios, temas ou palavras-chave..."
              aria-label="Pesquisar relatórios, temas ou palavras-chave"
              className="h-12 rounded-xl pl-10"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar por categoria">
            {filters.map((filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={activeFilter === filter ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
              >
                {filter}
              </Button>
            ))}
          </div>
        </section>

        <section aria-labelledby="archive-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="archive-heading" className="text-xl font-semibold sm:text-2xl">
                📂 Acervo de Dossiês
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isLoading ? "Carregando relatórios..." : `${visibleReports.length} relatórios encontrados`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Carregando o acervo...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-destructive" role="alert">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setRetryKey((key) => key + 1)}
              >
                Tentar novamente
              </Button>
            </div>
          ) : visibleReports.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhum relatório corresponde à sua busca.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleReports.map((report) => (
                <Card key={report.id} className="rounded-2xl transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="secondary">{report.categoria}</Badge>
                      {report.data && (
                        <time className="shrink-0 text-xs text-muted-foreground">
                          {formatDate(report.data)}
                        </time>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold leading-snug">{report.titulo}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{report.resumo}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}