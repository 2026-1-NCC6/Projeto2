import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Truck, AlertCircle, Loader2, CheckCircle2, XCircle, MapPin, Package, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/technician/")({
  component: TechnicianHome,
});

type Assignment = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  wifi_test_ok: boolean;
  device_id: string;
  devices: { esp32_id: string; model: string; wifi_ssid: string | null; cooler_box: string | null } | null;
};

type ActiveTrip = {
  id: string;
  origin: string;
  destination: string;
  vehicle: string;
  status: string;
  started_at: string;
};

function TechnicianHome() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [wifiTesting, setWifiTesting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!role) navigate({ to: "/onboarding" });
    else if (role !== "technician") navigate({ to: "/admin" });
  }, [role, loading, navigate]);

  const load = async () => {
    if (!user) return;
    const [{ data: assg }, { data: trip }] = await Promise.all([
      supabase
        .from("assignments")
        .select("id, status, wifi_test_ok, device_id, devices(esp32_id, model, wifi_ssid, cooler_box)")
        .eq("technician_id", user.id)
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("trips")
        .select("id, origin, destination, vehicle, status, started_at")
        .eq("technician_id", user.id)
        .eq("status", "em_transito")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setAssignment(assg as Assignment | null);
    setActiveTrip(trip as ActiveTrip | null);
    setLoadingData(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("tech-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments", filter: `technician_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const respond = async (status: "accepted" | "rejected") => {
    if (!assignment) return;
    const { error } = await supabase
      .from("assignments")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", assignment.id);
    if (error) toast.error(error.message);
    else toast.success(status === "accepted" ? "Dispositivo aceito" : "Dispositivo recusado");
    load();
  };

  const testWifi = async () => {
    if (!assignment) return;
    setWifiTesting(true);
    await new Promise((r) => setTimeout(r, 1600));
    const ok = Math.random() > 0.15;
    await supabase.from("assignments").update({ wifi_test_ok: ok }).eq("id", assignment.id);
    setWifiTesting(false);
    if (ok) toast.success("Conexão WiFi do sensor OK");
    else toast.error("Falha ao conectar com o sensor");
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle="Painel do técnico" />
      <main className="px-5 py-6 max-w-2xl mx-auto space-y-5">
        {loadingData ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Active trip banner */}
            <AnimatePresence>
              {activeTrip && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-hero text-primary-foreground rounded-2xl p-5 shadow-elevated"
                >
                  <div className="flex items-center gap-2 text-xs font-medium opacity-90">
                    <span className="size-1.5 rounded-full bg-primary-foreground animate-live" />
                    Viagem em andamento
                  </div>
                  <div className="mt-2 font-display text-xl font-bold">
                    {activeTrip.origin} <ArrowRight className="inline size-4 -mt-0.5" /> {activeTrip.destination}
                  </div>
                  <div className="mt-1 text-sm opacity-90">Veículo: {activeTrip.vehicle}</div>
                  <Link to="/technician/trip/$tripId" params={{ tripId: activeTrip.id }}>
                    <Button variant="secondary" className="mt-4 w-full">
                      Abrir monitoramento
                    </Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Device card */}
            {!assignment ? (
              <EmptyDevice />
            ) : (
              <DeviceCard
                assignment={assignment}
                onAccept={() => respond("accepted")}
                onReject={() => respond("rejected")}
                onTestWifi={testWifi}
                wifiTesting={wifiTesting}
              />
            )}

            {/* Start trip */}
            {assignment?.status === "accepted" && assignment.wifi_test_ok && !activeTrip && (
              <StartTripDialog assignmentDeviceId={assignment.device_id} deviceEsp32Id={assignment.devices?.esp32_id ?? null} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function EmptyDevice() {
  return (
    <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card text-center">
      <div className="size-12 rounded-2xl bg-secondary grid place-items-center mx-auto mb-3">
        <Package className="size-6 text-muted-foreground" />
      </div>
      <h2 className="font-display font-semibold text-deep">Nenhum dispositivo atribuído</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Aguarde o administrador vincular um sensor ESP32 ao seu perfil.
      </p>
    </div>
  );
}

function DeviceCard({ assignment, onAccept, onReject, onTestWifi, wifiTesting }: {
  assignment: Assignment;
  onAccept: () => void;
  onReject: () => void;
  onTestWifi: () => void;
  wifiTesting: boolean;
}) {
  const d = assignment.devices;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Dispositivo ESP32</div>
          <div className="font-display text-xl font-bold text-deep mt-0.5">{d?.esp32_id}</div>
          <div className="text-sm text-muted-foreground">{d?.model} · Caixa {d?.cooler_box || "—"}</div>
        </div>
        <StatusBadge status={assignment.status} />
      </div>

      {assignment.status === "pending" && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onReject}>
            <XCircle className="size-4 mr-1.5" /> Recusar
          </Button>
          <Button onClick={onAccept} className="bg-hero">
            <CheckCircle2 className="size-4 mr-1.5" /> Aceitar
          </Button>
        </div>
      )}

      {assignment.status === "accepted" && (
        <div className="mt-5 rounded-xl bg-secondary/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {assignment.wifi_test_ok ? (
                <>
                  <Wifi className="size-4 text-success" />
                  <span className="text-deep font-medium">Sensor conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Conexão não testada</span>
                </>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={onTestWifi} disabled={wifiTesting}>
              {wifiTesting ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : null}
              Testar WiFi
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">Rede: {d?.wifi_ssid || "—"}</div>
        </div>
      )}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-warning/15 text-warning-foreground border-warning/40" },
    accepted: { label: "Aceito", className: "bg-success/15 text-success border-success/40" },
    rejected: { label: "Recusado", className: "bg-destructive/15 text-destructive border-destructive/40" },
  };
  const m = map[status] ?? { label: status, className: "" };
  return <span className={`text-[11px] px-2 py-1 rounded-md border font-medium ${m.className}`}>{m.label}</span>;
}

function StartTripDialog({ assignmentDeviceId, deviceEsp32Id }: { assignmentDeviceId: string; deviceEsp32Id: string | null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicle, setVehicle] = useState("");

  const canStart = origin.trim().length > 0 && destination.trim().length > 0 && !busy;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !canStart) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("trips")
      .insert({
        technician_id: user.id,
        device_id: assignmentDeviceId,
        origin: origin.trim(),
        destination: destination.trim(),
        vehicle: vehicle.trim() || "—",
        status: "em_transito",
      })
      .select("id")
      .single();
    setBusy(false);
    if (error || !data) { toast.error(error?.message || "Erro"); return; }
    toast.success("Viagem iniciada");
    setOpen(false);
    navigate({ to: "/technician/trip/$tripId", params: { tripId: data.id } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-hero text-primary-foreground rounded-2xl p-5 shadow-elevated flex items-center justify-between hover:opacity-95 transition"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="size-10 rounded-xl bg-primary-foreground/15 grid place-items-center">
              <Truck className="size-5" />
            </div>
            <div>
              <div className="font-display font-semibold">Iniciar nova viagem</div>
              <div className="text-xs opacity-90">Dispositivo pronto para uso</div>
            </div>
          </div>
          <ArrowRight className="size-5" />
        </motion.button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Truck className="size-5 text-primary" /> Iniciar nova viagem
          </DialogTitle>
          <DialogDescription>
            Preencha origem e destino para começar o monitoramento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-lg bg-secondary/60 border border-border px-3 py-2 text-xs text-muted-foreground">
            Dispositivo: <span className="font-medium text-deep">{deviceEsp32Id ?? "—"}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="origin"><MapPin className="size-3.5 inline -mt-0.5 mr-1" />Origem</Label>
            <Input
              id="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
              placeholder="Ex: Centro de Distribuição SP"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination"><MapPin className="size-3.5 inline -mt-0.5 mr-1" />Destino</Label>
            <Input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              placeholder="Ex: Hospital Albert Einstein"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle">Veículo <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              id="vehicle"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="Ex: Van refrigerada ABC-1234"
            />
          </div>

          <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
            <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
            Após iniciar, leituras de temperatura/umidade serão coletadas a cada 3s.
          </p>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canStart} className="bg-hero shadow-elevated">
              {busy && <Loader2 className="size-4 mr-2 animate-spin" />}
              Iniciar viagem
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
