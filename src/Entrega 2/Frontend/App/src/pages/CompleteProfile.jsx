import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake, Building2, BadgeCheck, ChevronDown, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COMPANIES = ["Empresa A", "Empresa B", "Empresa C", "Empresa D"];
const ADMIN_PASSWORD = "admin123"; // senha de acesso admin da empresa

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState("");
  const [ctcCode, setCtcCode] = useState("");
  const [role, setRole] = useState("user");
  const [adminLogin, setAdminLogin] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!selectedCompany) {
      setError("Selecione sua empresa.");
      return;
    }
    if (role === "user" && !ctcCode.trim()) {
      setError("Informe seu código de técnico.");
      return;
    }
    if (role === "admin") {
      if (!adminLogin.trim() || !adminPassword.trim()) {
        setError("Informe o login e senha de administrador.");
        return;
      }
      if (adminPassword !== ADMIN_PASSWORD) {
        setError("Senha de administrador incorreta.");
        return;
      }
    }
    setError("");
    setSaving(true);
    await base44.auth.updateMe({
      company: selectedCompany,
      ctc_code: role === "user" ? ctcCode.trim() : "",
      role: role,
      profile_complete: true,
    });
    setSaving(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <Snowflake className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black text-foreground">FlexHealth</h1>
          <p className="text-sm text-muted-foreground">Complete seu perfil para continuar</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Você é
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "user", label: "Técnico" },
                { value: "admin", label: "Administrador" },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                    role === r.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Company Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Building2 className="w-3.5 h-3.5 inline mr-1" />
              Empresa
            </Label>
            <div className="relative">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full h-12 rounded-xl border-2 border-input bg-background px-4 text-sm font-medium appearance-none focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Selecione sua empresa...</option>
                {COMPANIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Código de Técnico — only for technicians */}
          <AnimatePresence>
          {role === "user" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <BadgeCheck className="w-3.5 h-3.5 inline mr-1" />
                Código de Técnico
              </Label>
              <Input
                value={ctcCode}
                onChange={(e) => setCtcCode(e.target.value)}
                placeholder="Ex: CTC-2024-0042"
                className="h-12 rounded-xl border-2 text-sm font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Código de técnico fornecido pela empresa.
              </p>
            </motion.div>
          )}

          {/* Admin credentials */}
          {role === "admin" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-[11px] text-amber-700 font-medium">
                  Acesso restrito. Insira as credenciais de administrador da empresa.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Login de Admin
                </Label>
                <Input
                  value={adminLogin}
                  onChange={(e) => setAdminLogin(e.target.value)}
                  placeholder="login@empresa.com"
                  className="h-12 rounded-xl border-2 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Senha de Admin
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-xl border-2 text-sm pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {error && (
            <p className="text-sm text-destructive font-medium text-center">{error}</p>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 text-base font-bold rounded-xl"
          >
            {saving ? "Salvando..." : "Concluir Cadastro →"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}