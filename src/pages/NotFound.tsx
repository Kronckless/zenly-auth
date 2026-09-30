import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const location = useLocation();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="mt-4 text-muted-foreground">
        Não encontramos a rota <span className="font-mono">{location.pathname}</span>.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link to="/">Voltar para o início</Link>
        </Button>
      </div>
    </main>
  );
}
