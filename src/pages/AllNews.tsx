import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Report = {
  categoria: string;
  titulo: string;
  resumo: string;
  conteudo_completo: string;
  created_at: string;
};

function getText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function twoSentences(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]?/g) ?? [];
  return sentences.slice(0, 2).join("").trim();
}

export default function AllNews() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoading(true);
      setError("");

      if (!supabase) {
        setError("A conexão com o serviço de conteúdo não está configurada.");
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("panoramas")
        .select("categoria, titulo, resumo, conteudo_completo, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!active) return;

      if (queryError) {
        setError("Não foi possível carregar as notícias agora.");
      } else {
        setReports(
          (data ?? []).map((row) => ({
            categoria: getText(row.categoria),
            titulo: getText(row.titulo),
            resumo: getText(row.resumo),
            conteudo_completo: getText(row.conteudo_completo),
            created_at: getText(row.created_at),
          })),
        );
      }

      setLoading(false);
    }

    loadReports();

    return () => {
      active = false;
    };
  }, []);

  const filteredReports = reports.filter((report) =>
    [report.categoria, report.titulo, report.resumo]
      .join(" ")
      .toLocaleLowerCase("pt-BR")
      .includes(search.trim().toLocaleLowerCase("pt-BR")),
  );

  return (
    <main className="min-h-screen bg-background pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 shrink-0 gap-2 px-3"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>

          <h1 className="min-w-0 flex-1 truncate font-display text-lg font-bold sm:text-xl">
            O dia em 24 horas
          </h1>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0"
            aria-label={searchOpen ? "Fechar busca" : "Buscar notícias"}
            onClick={() => {
              setSearchOpen((open) => !open);
              setSearch("");
            }}
          >
            {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
          </Button>
        </div>

        {searchOpen && (
          <div className="mx-auto mt-3 max-w-6xl">
            <Input
              autoFocus
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar notícias..."
              aria-label="Buscar notícias"
              className="h-11"
            />
          </div>
        )}
      </header>

      <section
        aria-label="Todas as notícias"
        className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-5 sm:grid-cols-2 sm:gap-5 sm:px-6 lg:grid-cols-3"
      >
        {loading ? (
          <p className="py-8 text-sm text-muted-foreground" role="status">
            Carregando notícias...
          </p>
        ) : error ? (
          <p className="py-8 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : filteredReports.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">
            {search ? "Nenhuma notícia encontrada." : "Nenhuma notícia disponível no momento."}
          </p>
        ) : (
          filteredReports.map((report, index) => (
            <Card
              key={`${report.created_at}-${index}`}
              className="gap-0 rounded-xl bg-card py-0 shadow-sm"
            >
              <CardHeader className="gap-3 p-5">
                <Badge variant="secondary" className="max-w-full truncate">
                  {report.categoria || "Notícia"}
                </Badge>
                <CardTitle className="line-clamp-2 text-lg leading-snug">
                  {report.titulo}
                </CardTitle>
                <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                  {twoSentences(report.resumo)}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full"
                  onClick={() => setSelectedReport(report)}
                >
                  Ler notícia
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <Sheet
        open={selectedReport !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedReport(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="h-[100dvh] max-h-[100dvh] gap-0 overflow-y-auto rounded-none px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-8"
        >
          {selectedReport && (
            <>
              <SheetHeader className="mx-auto w-full max-w-3xl px-0 pb-6 text-left">
                <Badge variant="secondary" className="mb-2">
                  {selectedReport.categoria || "Notícia"}
                </Badge>
                <SheetTitle className="font-display text-2xl leading-snug sm:text-3xl">
                  {selectedReport.titulo}
                </SheetTitle>
                <SheetDescription className="text-base leading-relaxed">
                  {selectedReport.resumo}
                </SheetDescription>
              </SheetHeader>
              <article className="mx-auto w-full max-w-3xl whitespace-pre-wrap text-base leading-8 text-foreground">
                {selectedReport.conteudo_completo || selectedReport.resumo}
              </article>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}