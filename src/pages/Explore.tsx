import { useEffect, useMemo, useState } from "react";
import AppNavigation from "@/components/AppNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Search, X } from "lucide-react";

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
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("explorar-recent-searches") || "[]");
    } catch {
      return [];
    }
  });
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
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
    const searchTerms = query.split(/\s+/).filter(Boolean);

    return reports.filter((report) => {
      const searchableText =
        `${report.titulo} ${report.resumo} ${report.conteudoCompleto}`.toLocaleLowerCase("pt-BR");
      return searchTerms.length === 0 || searchTerms.some((term) => searchableText.includes(term));
    });
  }, [reports, search]);

  function saveRecentSearch(value: string) {
    const term = value.trim();
    if (!term) return;

    const updated = [term, ...recentSearches.filter(
      (item) => item.toLocaleLowerCase("pt-BR") !== term.toLocaleLowerCase("pt-BR"),
    )].slice(0, 8);
    setRecentSearches(updated);
    try {
      window.localStorage.setItem("explorar-recent-searches", JSON.stringify(updated));
    } catch {
      // Recent searches remain available for this session.
    }
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    try {
      window.localStorage.removeItem("explorar-recent-searches");
    } catch {
      // Ignore unavailable local storage.
    }
  }

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <AppNavigation />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Explorar</h1>
        </header>

        <section aria-label="Pesquisar no acervo" className="mb-8">
          <div className="relative z-10 max-w-3xl">
            <div className="flex h-12 items-center gap-3 rounded-2xl bg-muted px-4 transition-colors focus-within:ring-2 focus-within:ring-primary/20">
              <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => search.trim() && setSuggestionsOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && search.trim()) {
                    event.preventDefault();
                    saveRecentSearch(search);
                    setSuggestionsOpen(false);
                  }
                  if (event.key === "Escape") setSuggestionsOpen(false);
                }}
                placeholder="Pesquisar relatórios, temas ou palavras-chave..."
                aria-label="Pesquisar relatórios, temas ou palavras-chave"
                aria-expanded={Boolean(search.trim()) && suggestionsOpen}
                className="h-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Limpar pesquisa"
                  onClick={() => {
                    setSearch("");
                    setSuggestionsOpen(false);
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {search.trim() && suggestionsOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-border/60 bg-popover shadow-lg">
                {isLoading ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Buscando no acervo...</p>
                ) : visibleReports.length ? (
                  <div className="py-1">
                    {visibleReports.slice(0, 6).map((report) => (
                      <button
                        key={report.id}
                        type="button"
                        onClick={() => {
                          setSearch(report.titulo);
                          saveRecentSearch(search);
                          setSuggestionsOpen(false);
                        }}
                        className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted"
                      >
                        <span className="text-sm font-medium">{report.titulo}</span>
                        <span className="line-clamp-1 text-xs text-muted-foreground">{report.resumo}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Nenhuma sugestão encontrada.</p>
                )}
              </div>
            )}
          </div>

          {recentSearches.length > 0 && (
            <div className="mt-6 max-w-3xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Pesquisas recentes</h2>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-sm font-medium text-primary transition-opacity hover:opacity-75"
                >
                  Limpar tudo
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setSearch(term);
                      setSuggestionsOpen(true);
                    }}
                    className="rounded-full bg-muted px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
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