import { ShieldCheck } from "lucide-react";
import LoginForm from "@/components/LoginForm";

export default function Index() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              Zenith
            </span>
          </div>

          <LoginForm />
        </div>
      </div>

      {/* Right — image bleed */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.pexels.com/photos/4973899/pexels-photo-4973899.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Laptop exibindo um ícone de cadeado de segurança sobre uma mesa"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/25 to-transparent" />

        <div className="absolute inset-x-0 top-10 flex justify-end px-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1.5 text-xs font-medium text-background backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            Autenticação protegida
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-10">
          <blockquote className="max-w-md rounded-xl border border-background/15 bg-background/10 p-6 backdrop-blur-md">
            <p className="text-pretty font-display text-xl leading-snug text-background">
              "Trocamos três fornecedores por um único login. Simples de configurar,
              impossível de burlar."
            </p>
            <footer className="mt-4 text-sm text-background/70">
              Marina Alves · Head de Segurança, Fluxo
            </footer>
          </blockquote>
          <p className="mt-6 text-xs text-background/50">
            Foto: Dan Nelson / Pexels
          </p>
        </div>
      </div>
    </main>
  );
}
