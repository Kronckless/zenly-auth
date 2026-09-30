import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="outline" type="button" className="w-full">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="currentColor"
            d="M21.35 11.1h-9.17v2.92h5.27c-.23 1.4-1.64 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.96 3.69 14.83 2.7 12.18 2.7 7.06 2.7 2.9 6.86 2.9 12s4.16 9.3 9.28 9.3c5.36 0 8.9-3.76 8.9-9.05 0-.62-.07-1.1-.16-1.55Z"
          />
        </svg>
        Google
      </Button>
      <Button variant="outline" type="button" className="w-full">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.23.68-.5v-1.94c-2.78.62-3.37-1.36-3.37-1.36-.46-1.2-1.11-1.52-1.11-1.52-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.55 2.34 1.1 2.91.84.09-.65.34-1.1.62-1.35-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.32.1-2.75 0 0 .84-.27 2.76 1.05a9.4 9.4 0 0 1 5.03 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.43.2 2.49.1 2.75.65.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.5A9.99 9.99 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
        </svg>
        GitHub
      </Button>
    </div>
  );
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="mb-8 w-full">
        <TabsTrigger value="login" className="flex-1">
          Entrar
        </TabsTrigger>
        <TabsTrigger value="signup" className="flex-1">
          Criar conta
        </TabsTrigger>
      </TabsList>

      {/* LOGIN */}
      <TabsContent value="login" className="mt-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Bem-vindo de volta
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre com sua conta para continuar no painel.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="space-y-2">
            <Label htmlFor="login-email">E-mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                placeholder="voce@empresa.com"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Senha</Label>
              <a
                href="#"
                className="text-xs font-medium text-primary hover:underline"
              >
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="px-9"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            <Label htmlFor="remember" className="text-sm text-muted-foreground">
              Manter conectado por 30 dias
            </Label>
          </div>

          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou continue com</span>
          <Separator className="flex-1" />
        </div>

        <SocialButtons />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <span className="font-medium text-primary">
            Crie uma na aba acima
          </span>
        </p>
      </TabsContent>

      {/* SIGNUP */}
      <TabsContent value="signup" className="mt-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Crie sua conta
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Leva menos de um minuto para começar.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="space-y-2">
            <Label htmlFor="signup-name">Nome completo</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="signup-name"
                type="text"
                placeholder="Seu nome"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">E-mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="signup-email"
                type="email"
                placeholder="voce@empresa.com"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Senha</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="signup-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                className="px-9"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="terms" className="mt-0.5" required />
            <Label htmlFor="terms" className="text-sm leading-snug text-muted-foreground">
              Concordo com os Termos de Uso e a Política de Privacidade
            </Label>
          </div>

          <Button type="submit" className="w-full">
            Criar conta
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou continue com</span>
          <Separator className="flex-1" />
        </div>

        <SocialButtons />
      </TabsContent>
    </Tabs>
  );
}