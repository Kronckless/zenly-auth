import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");

    if (!supabase) {
      setFeedback("O serviço de acesso não está configurado. Tente novamente mais tarde.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const fullName = String(formData.get("fullName") || "").trim();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });

        if (error) {
          setFeedback("Não foi possível concluir a solicitação. Confira os dados e tente novamente.");
          return;
        }

        setMode("login");
        setFeedback("Solicitação recebida. Se o cadastro puder ser concluído, você receberá as próximas instruções por e-mail.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setFeedback("Não foi possível entrar. Confira os dados e tente novamente.");
        return;
      }

      navigate("/home");
    } catch {
      setFeedback("Não foi possível concluir a solicitação. Tente novamente mais tarde.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#681F2C] p-4 sm:p-6">
      <section className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="mb-8 flex justify-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="h-11 w-11 text-[#C6283D]"
          >
            <polygon
              fill="currentColor"
              points="50,4 61,36 95,36 68,56 78,89 50,69 22,89 32,56 5,36 39,36"
            />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Entre na sua conta para continuar"
              : "Cadastre-se para liberar seu acesso"}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-1 rounded-2xl bg-[#F1F1F3] p-1">
          <Button
            type="button"
            variant={mode === "login" ? "default" : "ghost"}
            className={`h-12 rounded-xl bg-[#C6283D] text-white transition-all duration-200 hover:bg-[#A91F32] ${mode === "login" ? "shadow-sm" : "opacity-80"}`}
            onClick={() => {
              setMode("login");
              setFeedback("");
            }}
          >
            Entrar
          </Button>
          <Button
            type="button"
            variant={mode === "signup" ? "default" : "ghost"}
            className={`h-12 rounded-xl bg-[#C6283D] text-white transition-all duration-200 hover:bg-[#A91F32] ${mode === "signup" ? "shadow-sm" : "opacity-80"}`}
            onClick={() => {
              setMode("signup");
              setFeedback("");
            }}
          >
            Criar conta
          </Button>
        </div>

        <div
          role="note"
          className="mt-5 rounded-2xl border border-[#F0DADD] bg-[#FFF7F8] px-4 py-4 text-sm leading-relaxed text-foreground"
        >
          <p className="font-semibold">⚠️ IMPORTANTE:</p>
          <p className="mt-1 font-medium text-foreground">
            Digite o mesmo e-mail utilizado no momento da compra para confirmar seu pedido e garantir a liberação do seu acesso.
          </p>
        </div>

        {mode === "login" ? (
          <form className="mt-6 space-y-5 transition-all duration-300" onSubmit={handleAuth}>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com"
                className="h-14 rounded-2xl border-[#E5DFE1] bg-white pl-10 text-base transition-shadow focus-visible:border-[#C6283D] focus-visible:ring-2 focus-visible:ring-[#C6283D]/25"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                className="h-14 rounded-2xl border-[#E5DFE1] bg-white px-10 text-base transition-shadow focus-visible:border-[#C6283D] focus-visible:ring-2 focus-visible:ring-[#C6283D]/25"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <Label
              htmlFor="remember"
              className="text-sm font-normal text-muted-foreground"
            >
              Lembrar de mim
            </Label>
          </div>

          <Button
            type="submit"
            className="h-14 w-full rounded-2xl bg-[#C6283D] text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#A91F32] hover:shadow-md active:translate-y-0 active:scale-[0.98]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Aguarde…" : "Entrar"}
          </Button>
          </form>
        ) : (
          <form className="mt-6 space-y-5 transition-all duration-300" onSubmit={handleAuth}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  className="h-14 rounded-2xl border-[#E5DFE1] bg-white pl-10 text-base transition-shadow focus-visible:border-[#C6283D] focus-visible:ring-2 focus-visible:ring-[#C6283D]/25"
                  required
                  maxLength={100}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  className="h-14 rounded-2xl border-[#E5DFE1] bg-white pl-10 text-base transition-shadow focus-visible:border-[#C6283D] focus-visible:ring-2 focus-visible:ring-[#C6283D]/25"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Senha</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  className="rounded-xl border-[#E5DFE1] bg-white px-9 transition-shadow focus-visible:border-[#C6283D] focus-visible:ring-2 focus-visible:ring-[#C6283D]/25"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="h-14 w-full rounded-2xl bg-[#C6283D] text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#A91F32] hover:shadow-md active:translate-y-0 active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Aguarde…" : "Criar conta"}
            </Button>
          </form>
        )}

        {feedback && (
          <p role="status" aria-live="polite" className="mt-5 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
            {feedback}
          </p>
        )}
      </section>
    </main>
  );
}