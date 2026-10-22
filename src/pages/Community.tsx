import AppNavigation from "@/components/AppNavigation";

export default function Community() {
  return (
    <main className="min-h-screen bg-background pb-16 sm:pb-0">
      <AppNavigation />
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Comunidade
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Chat
        </h1>
        <p className="mt-3 text-muted-foreground">
          O espaço de conversa da comunidade aparecerá aqui.
        </p>
      </section>
    </main>
  );
}