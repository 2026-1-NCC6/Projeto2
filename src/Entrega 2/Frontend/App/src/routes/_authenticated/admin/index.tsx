import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Truck, AlertTriangle, Package, Activity, Thermometer, Plus, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TEMP_MIN, TEMP_MAX, formatTime } from "@/lib/sensor";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

type TripRow = {
  id: string;
  technician_id: string;
  origin: string;
  destination: string;
  vehicle: string;
  status: string;
  current_temperature: number | null;
  current_humidity: number | null;
  alerts_count: number;
  started_at: string;
  ended_at: string | null;
};

type IncidentRow = { id: string; trip_id: string; reason: string; severity: string; created_at: string };
type DeviceRow = { id: string; esp32_id: string; model: string; wifi_ssid: string | null; cooler_box: string | null };

function AdminDashboard() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, { full_name: string | null; email: string; tech_code: string | null }>>({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!role) navigate({ to: "/onboarding" });
    else if (role !== "admin") navigate({ to: "/technician" });
  }, [role, loading, navigate]);

  const load = async () => {
    const [{ data: t }, { data: i }, { data: d }, { data: p }] = await Promise.all([
      supabase.from("trips").select("*").order("started_at", { ascending: false }).limit(50),
      supabase.from("incidents").select("id, trip_id, reason, severity, created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("devices").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email, tech_code"),
    ]);
    setTrips((t as TripRow[]) ?? []);
    setIncidents((i as IncidentRow[]) ?? []);
    setDevices((d as DeviceRow[]) ?? []);
    const map: Record<string, { full_name: string | null; email: string; tech_code: string | null }> = {};
    (p ?? []).forEach((row: any) => { map[row.id] = { full_name: row.full_name, email: row.email, tech_code: row.tech_code }; });
    setProfilesMap(map);
    setLoadingData(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "devices" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const active = trips.filter((t) => t.status === "em_transito");
  const delivered = trips.filter((t) => t.status === "entregue").length;
  const sinistros = trips.filter((t) => t.status === "sinistro").length;

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader subtitle="Central de operações" />
      <main className="px-5 py-6 max-w-6xl mx-auto space-y-6">
        {loadingData ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Metric icon={<Truck className="size-5" />} label="Viagens ativas" value={active.length} accent />
              <Metric icon={<ShieldCheck className="size-5" />} label="Entregues" value={delivered} />
              <Metric icon={<AlertTriangle className="size-5" />} label="Sinistros" value={sinistros} />
              <Metric icon={<Package className="size-5" />} label="Dispositivos" value={devices.length} />
            </div>

            <Tabs defaultValue="field" className="w-full">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="field">Em campo</TabsTrigger>
                <TabsTrigger value="incidents">Sinistros</TabsTrigger>
                <TabsTrigger value="devices">Dispositivos</TabsTrigger>
              </TabsList>

              <TabsContent value="field" className="mt-5">
                <FieldTechnicians active={active} profilesMap={profilesMap} />
              </TabsContent>

              <TabsContent value="incidents" className="mt-5">
                <IncidentsList incidents={incidents} trips={trips} />
              </TabsContent>

              <TabsContent value="devices" className="mt-5">
                <DevicesPanel devices={devices} onChange={load} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 shadow-card border ${accent ? "bg-hero text-primary-foreground border-transparent" : "bg-card border-border"}`}
    >
      <div className={`size-9 rounded-xl grid place-items-center mb-3 ${accent ? "bg-white/15" : "bg-secondary text-primary"}`}>
        {icon}
      </div>
      <div className={`font-display text-2xl font-bold ${accent ? "" : "text-deep"}`}>{value}</div>
      <div className={`text-xs ${accent ? "opacity-90" : "text-muted-foreground"}`}>{label}</div>
    </motion.div>
  );
}

function FieldTechnicians({ active, profilesMap }: { active: TripRow[]; profilesMap: Record<string, any> }) {
  if (!active.length) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-2xl">
        <Activity className="size-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum técnico em campo agora.</p>
      </div>
    );
  }
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {active.map((t) => {
        const prof = profilesMap[t.technician_id];
        const temp = t.current_temperature;
        const alert = temp != null && (temp < TEMP_MIN || temp > TEMP_MAX);
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-4 shadow-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display font-bold text-deep">{prof?.full_name || prof?.email || "Técnico"}</div>
                <div className="text-xs text-muted-foreground">{prof?.tech_code || "—"} · {t.vehicle}</div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                <span className="size-1.5 rounded-full bg-success animate-live" /> ao vivo
              </span>
            </div>
            <div className="mt-3 text-sm text-deep">
              {t.origin} → {t.destination}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${alert ? "bg-destructive/10 text-destructive" : "bg-secondary text-deep"}`}>
                <Thermometer className="size-4" />
                <span className="font-semibold text-sm">{temp != null ? `${temp.toFixed(1)}°C` : "—"}</span>
              </div>
              {t.alerts_count > 0 && (
                <span className="text-xs text-warning-foreground bg-warning/20 px-2 py-1 rounded-md">
                  {t.alerts_count} alertas
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">desde {formatTime(t.started_at)}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function IncidentsList({ incidents, trips }: { incidents: IncidentRow[]; trips: TripRow[] }) {
  if (!incidents.length) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-2xl">
        <ShieldCheck className="size-8 text-success mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum sinistro registrado.</p>
      </div>
    );
  }
  const tripMap = Object.fromEntries(trips.map((t) => [t.id, t]));
  const sevColor: Record<string, string> = {
    baixa: "bg-secondary text-deep",
    media: "bg-warning/20 text-warning-foreground",
    alta: "bg-destructive/15 text-destructive",
    critica: "bg-destructive text-destructive-foreground",
  };
  return (
    <div className="space-y-2">
      {incidents.map((i) => {
        const t = tripMap[i.trip_id];
        return (
          <div key={i.id} className="bg-card border border-border rounded-xl p-4 shadow-card flex items-start gap-3">
            <div className="size-9 rounded-lg bg-destructive/10 text-destructive grid place-items-center shrink-0">
              <AlertTriangle className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-semibold text-deep">{i.reason}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${sevColor[i.severity]}`}>{i.severity}</span>
              </div>
              {t && <div className="text-xs text-muted-foreground mt-0.5">{t.origin} → {t.destination}</div>}
              <div className="text-[11px] text-muted-foreground mt-0.5">{new Date(i.created_at).toLocaleString("pt-BR")}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DevicesPanel({ devices, onChange }: { devices: DeviceRow[]; onChange: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <AssignDeviceDialog onChange={onChange} devices={devices} />
        <NewDeviceDialog onChange={onChange} />
      </div>
      {!devices.length ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <Package className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum dispositivo cadastrado.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {devices.map((d) => (
            <div key={d.id} className="bg-card border border-border rounded-xl p-4 shadow-card">
              <div className="font-display font-bold text-deep">{d.esp32_id}</div>
              <div className="text-xs text-muted-foreground">{d.model}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">WiFi:</span> {d.wifi_ssid || "—"}</div>
                <div><span className="text-muted-foreground">Caixa:</span> {d.cooler_box || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewDeviceDialog({ onChange }: { onChange: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("devices").insert({
      esp32_id: String(fd.get("esp32_id")),
      model: String(fd.get("model")),
      wifi_ssid: String(fd.get("wifi_ssid") || "") || null,
      cooler_box: String(fd.get("cooler_box") || "") || null,
      created_by: user.id,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Dispositivo cadastrado");
    setOpen(false);
    onChange();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-hero"><Plus className="size-4 mr-1.5" />Novo dispositivo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Cadastrar ESP32</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5"><Label>ID ESP32</Label><Input name="esp32_id" required placeholder="ESP32-A1B2" /></div>
          <div className="space-y-1.5"><Label>Modelo</Label><Input name="model" required placeholder="ESP32-WROOM-32" /></div>
          <div className="space-y-1.5"><Label>Rede WiFi</Label><Input name="wifi_ssid" placeholder="FlexHealth-Net" /></div>
          <div className="space-y-1.5"><Label>Caixa térmica</Label><Input name="cooler_box" placeholder="CX-001" /></div>
          <DialogFooter>
            <Button type="submit" disabled={busy} className="w-full bg-hero">
              {busy && <Loader2 className="size-4 mr-2 animate-spin" />}Cadastrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignDeviceDialog({ onChange, devices }: { onChange: () => void; devices: DeviceRow[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const deviceId = String(fd.get("device_id"));
    const { data: prof, error: pe } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (pe || !prof) { setBusy(false); toast.error("Técnico não encontrado"); return; }
    const { error } = await supabase
      .from("assignments")
      .insert({ device_id: deviceId, technician_id: prof.id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Dispositivo atribuído");
    setOpen(false);
    onChange();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Atribuir a técnico</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Atribuir dispositivo</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>E-mail do técnico</Label>
            <Input name="email" type="email" required placeholder="tecnico@empresa.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Dispositivo</Label>
            <select name="device_id" required className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Selecione...</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.esp32_id} ({d.model})</option>)}
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy} className="w-full bg-hero">
              {busy && <Loader2 className="size-4 mr-2 animate-spin" />}Atribuir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
