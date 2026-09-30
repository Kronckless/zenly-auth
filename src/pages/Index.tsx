import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6">
      <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        Projeto pronto para começar
      </h1>
      <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
        Este template já vem com Vite, React, TypeScript, Tailwind e a biblioteca
        de componentes. Agora a IA pode focar no que você pediu, sem boilerplate.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
            Docs do Vite <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href="https://tailwindcss.com" target="_blank" rel="noreferrer">
            Docs do Tailwind <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </main>
  );
}
