import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Snowflake, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, role, extrasLoaded, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const redirectedRef = useRef(false);

  // Redirect only after the session AND extras (role) have been resolved.
  useEffect(() => {
    if (loading || !user || !extrasLoaded) return;
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    if (!role) navigate({ to: "/onboarding" });
    else if (role === "admin") navigate({ to: "/admin" });
    else navigate({ to: "/technician" });
  }, [user, role, extrasLoaded, loading, navigate]);

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  const onSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { full_name: String(fd.get("full_name")) },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada! Você já pode entrar.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="size-9 rounded-xl bg-hero grid place-items-center">
            <Snowflake className="size-5 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <span className="font-display font-bold text-lg text-deep">FlexHealth</span>
        </Link>
      </div>

      <div className="flex-1 flex items-start sm:items-center justify-center px-5 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-gradient-card border border-border rounded-2xl shadow-elevated p-6 sm:p-8"
        >
          <h1 className="font-display text-2xl font-bold text-deep">Acesse sua conta</h1>
          <p className="text-sm text-muted-foreground mt-1">Técnicos e gestores entram pelo mesmo portal.</p>

          <Tabs defaultValue="login" className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={onLogin} className="space-y-4 mt-4">
                <Field name="email" type="email" label="E-mail" />
                <Field name="password" type="password" label="Senha" />
                <Button disabled={busy} type="submit" className="w-full bg-hero">
                  {busy && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={onSignup} className="space-y-4 mt-4">
                <Field name="full_name" type="text" label="Nome completo" />
                <Field name="email" type="email" label="E-mail" />
                <Field name="password" type="password" label="Senha (mín. 8)" minLength={8} />
                <Button disabled={busy} type="submit" className="w-full bg-hero">
                  {busy && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ name, type, label, minLength }: { name: string; type: string; label: string; minLength?: number }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required minLength={minLength} autoComplete={type === "password" ? "current-password" : "on"} />
    </div>
  );
}
