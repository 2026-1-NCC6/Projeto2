import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Snowflake, ShieldCheck, Truck, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<"admin" | "technician">("technician");
  const [techCode, setTechCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Escolha um nome para ser chamado.");
      return;
    }
    if (role === "technician" && !techCode.trim()) {
      toast.error("Informe seu código de técnico.");
      return;
    }
    setBusy(true);
    const { error: profErr } = await supabase
      .from("profiles")
      .update({ full_name: name || null, tech_code: role === "technician" ? techCode : null })
      .eq("id", user.id);
    if (profErr) { setBusy(false); toast.error(profErr.message); return; }

    const { error: roleErr } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role });
    if (roleErr && !roleErr.message.includes("duplicate")) {
      setBusy(false); toast.error(roleErr.message); return;
    }
    await refreshProfile();
    setBusy(false);
    toast.success("Perfil configurado!");
    navigate({ to: role === "admin" ? "/admin" : "/technician" });
  };

  return (
    <div className="min-h-screen bg-background px-5 py-8 max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <div className="size-9 rounded-xl bg-hero grid place-items-center">
          <Snowflake className="size-5 text-primary-foreground" strokeWidth={2.4} />
        </div>
        <span className="font-display font-bold text-lg text-deep">FlexHealth</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-deep">Bem-vindo!</h1>
        <p className="text-muted-foreground mt-1">Conte um pouco sobre você para personalizar sua experiência.</p>

        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label>Como prefere ser chamado?</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          </div>

          <div className="space-y-2">
            <Label>Qual é o seu papel?</Label>
            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                active={role === "technician"}
                onClick={() => setRole("technician")}
                icon={<Truck className="size-5" />}
                title="Técnico"
                desc="Faço o transporte"
              />
              <RoleCard
                active={role === "admin"}
                onClick={() => setRole("admin")}
                icon={<ShieldCheck className="size-5" />}
                title="Administrador"
                desc="Gerencio operações"
              />
            </div>
          </div>

          {role === "technician" && (
            <div className="space-y-2">
              <Label htmlFor="code">Código de técnico</Label>
              <Input id="code" value={techCode} onChange={(e) => setTechCode(e.target.value)} placeholder="Ex: TEC-0421" />
            </div>
          )}

          <Button onClick={save} disabled={busy} className="w-full bg-hero shadow-elevated">
            {busy && <Loader2 className="size-4 mr-2 animate-spin" />}
            Continuar
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function RoleCard({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-2xl border-2 transition shadow-card bg-card ${
        active ? "border-primary bg-secondary" : "border-border hover:border-primary/40"
      }`}
    >
      <div className={`size-9 rounded-xl grid place-items-center mb-2 ${active ? "bg-hero text-primary-foreground" : "bg-secondary text-primary"}`}>
        {icon}
      </div>
      <div className="font-display font-semibold text-deep">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}
