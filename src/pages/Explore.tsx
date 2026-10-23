import { useEffect, useMemo, useState } from "react";
import AppNavigation from "@/components/AppNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { ArrowUpRight, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Report = {
  id: string;
  categoria: string;
  titulo: string;
  resumo: string;
  conteudoCompleto: string;
  data: string;
};

const filters = ["Todos", "Política", "Economia"];

const products = [
  {
    title: "TOP MIND",
    price: "R$ 5,00",
    image: "",
    checkoutUrl: "https://pay.cakto.com.br/3docwso_1235475",
  },
  {
    title: "O MANUAL DA SOBERANIA",
    price: "R$ 5,00",
    image: "",
    checkoutUrl: "https://pay.cakto.com.br/wa9sqw7_1235709",
  },
  {
    title: "MENTALIDADE DE GRANDES LÍDERES",
    price: "R$ 5,00",
    image: "",
    checkoutUrl: "https://pay.cakto.com.br/8yc58wr_1235717",
  },
  {
    title: "LEGADO E FAMÍLIA BLINDADA",
    price: "R$ 5,00",
    image: "",
    checkoutUrl: "https://pay.cakto.com.br/tnbuwf9_1235724",
  },
];

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
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [sortOrder, setSortOrder] = useState("recentes");
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
  const [productsOpen, setProductsOpen] = useState(false);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [failedProductImages, setFailedProductImages] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadProductImages() {
      const checkoutProducts = products.filter(
        (product): product is typeof product & { checkoutUrl: string } => Boolean(product.checkoutUrl),
      );

      await Promise.all(
        checkoutProducts.map(async (product) => {
          try {
            const response = await fetch(
              `https://conscienciadepoder.com/api/product-image?url=${encodeURIComponent(product.checkoutUrl)}`,
            );
            if (!response.ok) return;

            const data: { imageUrl?: string | null } = await response.json();
            if (!cancelled && data.imageUrl) {
              setProductImages((current) => ({
                ...current,
                [product.checkoutUrl]: data.imageUrl!,
              }));
            }
          } catch {
            // Mantém o placeholder neutro se a imagem não estiver disponível.
          }
        }),
      );
    }

    void loadProductImages();
    return () => {
      cancelled = true;
    };
  }, []);

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

    return reports
      .filter((report) => {
        const searchableText =
          `${report.categoria} ${report.titulo} ${report.resumo} ${report.conteudoCompleto}`.toLocaleLowerCase("pt-BR");
        const matchesSearch =
          searchTerms.length === 0 || searchTerms.some((term) => searchableText.includes(term));
        const matchesCategory =
          selectedCategory === "Todos" ||
          report.categoria.toLocaleLowerCase("pt-BR").includes(selectedCategory.toLocaleLowerCase("pt-BR")) ||
          searchableText.includes(selectedCategory.toLocaleLowerCase("pt-BR"));

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const dateA = new Date(a.data).getTime() || 0;
        const dateB = new Date(b.data).getTime() || 0;
        return sortOrder === "antigos" ? dateA - dateB : dateB - dateA;
      });
  }, [reports, search, selectedCategory, sortOrder]);

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
              <button
                type="button"
                aria-label="Limpar pesquisa"
                onClick={() => {
                  setSearch("");
                  setSuggestionsOpen(false);
                }}
                disabled={!search}
                className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
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

          <div className="mt-5 flex flex-wrap gap-2" aria-label="Filtrar por categoria">
            {filters.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
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
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[155px] rounded-xl bg-background">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais recentes</SelectItem>
                <SelectItem value="antigos">Mais antigos</SelectItem>
              </SelectContent>
            </Select>
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

        <section aria-label="Destaque As Grandes Mentes da Nossa Era" className="mt-10">
          <button
            type="button"
            onClick={() => setProductsOpen(true)}
            aria-label="Ver produtos: As Grandes Mentes da Nossa Era"
            className="group relative flex min-h-56 w-full flex-col items-start justify-end overflow-hidden rounded-none border border-border/50 bg-background p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-64 sm:p-8"
          >
            <img
              src="https://picsum.photos/seed/minds-era/800/600"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/10" />
            <span className="relative w-full text-left text-2xl font-semibold tracking-tight text-foreground sm:text-5xl">
              As Grandes Mentes da Nossa Era
            </span>
          </button>

          <Dialog open={productsOpen} onOpenChange={setProductsOpen}>
            <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto rounded-none p-5 sm:p-8">
              <DialogHeader className="mb-2 text-left">
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  As Grandes Mentes da Nossa Era
                </DialogTitle>
                <DialogDescription>
                  Explore os destaques disponíveis e os próximos lançamentos.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {products.slice(0, 4).map((product, index) => (
                  <a
                    key={`${product.title}-${index}`}
                    href={product.checkoutUrl}
                    target="_top"
                    rel="noreferrer noopener"
                    referrerPolicy="no-referrer"
                    className="group block h-full w-full rounded-[2px] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Comprar ${product.title} por ${product.price}`}
                  >
                    <Card className="h-full min-h-[220px] gap-2 overflow-hidden rounded-[2px] border border-border/70 bg-muted/30 p-2 text-foreground shadow-sm transition-all duration-200 group-hover:shadow-md sm:p-3">
                      <CardContent className="flex h-full flex-1 flex-col gap-3 p-0">
                        <h3 className="flex min-h-8 items-center justify-center text-center text-xs font-semibold uppercase leading-snug tracking-wider text-foreground sm:text-sm">
                          {product.title}
                        </h3>

                        <div className="flex min-h-20 flex-1 items-center justify-center overflow-hidden rounded-[2px] border border-border/60 bg-muted/10">
                          {(() => {
                            const imageUrl =
                              (product.checkoutUrl && productImages[product.checkoutUrl]) || product.image;
                            const imageFailed =
                              Boolean(product.checkoutUrl && failedProductImages.includes(product.checkoutUrl));

                            return imageUrl && !imageFailed ? (
                              <img
                                src={imageUrl}
                                alt=""
                                aria-hidden="true"
                                className="h-full w-full object-cover"
                                onError={() => {
                                  if (product.checkoutUrl) {
                                    setFailedProductImages((current) =>
                                      current.includes(product.checkoutUrl!)
                                        ? current
                                        : [...current, product.checkoutUrl!],
                                    );
                                  }
                                }}
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className="text-xs text-muted-foreground"
                              >
                                Imagem em breve
                              </span>
                            );
                          })()}
                        </div>

                        <div className="flex justify-center border-t border-border/60 pt-2">
                          <span className="inline-flex min-w-24 items-center justify-center rounded-[2px] border border-border/60 bg-background px-3 py-1.5 text-sm font-semibold text-foreground">
                            {product.price}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </section>
      </main>
    </div>
  );
}