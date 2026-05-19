import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Thermometer, Droplets, AlertTriangle, CheckCircle2, Loader2, FileWarning, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEMP_MIN, TEMP_MAX, HUM_MIN, HUM_MAX, isAlert, nextReading, formatTime } from "@/lib/sensor";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/technician/trip/$tripId")({
  component: TripMonitor,
});

type Trip = {
  id: string;
  origin: string;
  destination: string;
  vehicle: string;
  status: string;
  alerts_count: number;
  started_at: string;
};

type ReadingPoint = { t: number; temperature: number; humidity: number; recorded_at: string };

function TripMonitor() {
  const { tripId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [readings, setReadings] = useState<ReadingPoint[]>([]);
  const [finishing, setFinishing] = useState(false);
  const counterRef = useRef(0);
  const lastPersistRef = useRef(0);

  useEffect(() => {
    supabase
      .from("trips")
      .select("id, origin, destination, vehicle, status, alerts_count, started_at")
      .eq("id", tripId)
      .maybeSingle()
      .then(({ data }) => setTrip(data as Trip));
  }, [tripId]);

  // Sensor simulation
  useEffect(() => {
    if (!trip || trip.status !== "em_transito") return;
    const id = setInterval(() => {
      setReadings((prev) => {
        const last = prev[prev.length - 1];
        const next = nextReading(last);
        const point: ReadingPoint = {
          t: counterRef.current++,
          ...next,
          recorded_at: new Date().toISOString(),
        };
        const alert = isAlert(next.temperature, next.humidity);

        // Persist every 5th reading ~= 15s
        lastPersistRef.current++;
        if (lastPersistRef.current >= 5) {
          lastPersistRef.current = 0;
          supabase.from("readings").insert({
            trip_id: tripId,
            temperature: next.temperature,
            humidity: next.humidity,
            is_alert: alert,
          }).then(({ error }) => { if (error) console.error(error); });

          // Update trip current + alert count
          supabase
            .from("trips")
            .update({
              current_temperature: next.temperature,
              current_humidity: next.humidity,
              ...(alert ? { alerts_count: (trip.alerts_count || 0) + 1 } : {}),
              min_temperature: Math.min(prev.length ? Math.min(...prev.map(p => p.temperature)) : next.temperature, next.temperature),
              max_temperature: Math.max(prev.length ? Math.max(...prev.map(p => p.temperature)) : next.temperature, next.temperature),
            })
            .eq("id", tripId)
            .then(() => {});
        }

        if (alert) {
          toast.warning(`Alerta: ${next.temperature}°C / ${next.humidity}%`, { id: "live-alert" });
        }

        const all = [...prev, point];
        return all.slice(-60); // keep last 60 points (~3 min)
      });
    }, 3000);
    return () => clearInterval(id);
  }, [trip, tripId]);

  const finish = async (status: "entregue" | "sinistro", observations?: string) => {
    setFinishing(true);
    const { error } = await supabase
      .from("trips")
      .update({ status, ended_at: new Date().toISOString(), observations: observations || null })
      .eq("id", tripId);
    setFinishing(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "entregue" ? "Entrega finalizada" : "Sinistro registrado");
    navigate({ to: "/technician" });
  };

  if (!trip) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const current = readings[readings.length - 1];
  const tempAlert = current && (current.temperature < TEMP_MIN || current.temperature > TEMP_MAX);
  const humAlert = current && (current.humidity < HUM_MIN || current.humidity > HUM_MAX);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader subtitle="Monitoramento" />
      <main className="px-5 py-5 max-w-3xl mx-auto space-y-4">
        {/* Trip header */}
        <div className="bg-gradient-card border border-border rounded-2xl p-4 shadow-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Viagem</div>
          <div className="font-display text-lg font-bold text-deep mt-0.5">
            {trip.origin} → {trip.destination}
          </div>
          <div className="text-sm text-muted-foreground">Veículo: {trip.vehicle}</div>
        </div>

        {/* Live cards */}
        <div className="grid grid-cols-2 gap-3">
          <LiveCard
            icon={<Thermometer className="size-5" />}
            label="Temperatura"
            value={current ? `${current.temperature.toFixed(1)}°C` : "—"}
            range={`${TEMP_MIN} a ${TEMP_MAX}°C`}
            alert={!!tempAlert}
          />
          <LiveCard
            icon={<Droplets className="size-5" />}
            label="Umidade"
            value={current ? `${current.humidity.toFixed(1)}%` : "—"}
            range={`${HUM_MIN} a ${HUM_MAX}%`}
            alert={!!humAlert}
          />
        </div>

        {/* Chart */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <h2 className="font-display font-semibold text-deep text-sm">Temperatura (últimos 3 min)</h2>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success animate-live" /> ao vivo
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readings} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 245)" />
                <XAxis dataKey="t" hide />
                <YAxis domain={[-2, 14]} tick={{ fontSize: 10, fill: "oklch(0.5 0.025 250)" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid oklch(0.92 0.012 245)", fontSize: 12 }}
                  labelFormatter={(_, p) => p?.[0] ? formatTime(p[0].payload.recorded_at) : ""}
                  formatter={(v: number) => [`${v}°C`, "Temp"]}
                />
                <ReferenceLine y={TEMP_MIN} stroke="oklch(0.6 0.22 25)" strokeDasharray="4 4" />
                <ReferenceLine y={TEMP_MAX} stroke="oklch(0.6 0.22 25)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="temperature" stroke="oklch(0.6 0.18 250)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Leituras" value={String(readings.length)} />
          <Stat label="Alertas" value={String(trip.alerts_count + readings.filter(r => isAlert(r.temperature, r.humidity)).length)} />
          <Stat label="Início" value={formatTime(trip.started_at)} />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <IncidentDialog tripId={tripId} />
          <FinishDialog onFinish={finish} finishing={finishing} />
        </div>
      </main>
    </div>
  );
}

function LiveCard({ icon, label, value, range, alert }: { icon: React.ReactNode; label: string; value: string; range: string; alert: boolean }) {
  return (
    <motion.div
      animate={alert ? { borderColor: "oklch(0.6 0.22 25)" } : { borderColor: "oklch(0.92 0.012 245)" }}
      className={`rounded-2xl p-4 border-2 shadow-card ${alert ? "bg-destructive/5" : "bg-card"}`}
    >
      <div className={`flex items-center gap-1.5 text-xs font-medium ${alert ? "text-destructive" : "text-muted-foreground"}`}>
        {icon}
        {label}
        {alert && <AlertTriangle className="size-3.5 ml-auto" />}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-display text-3xl font-bold mt-1 ${alert ? "text-destructive" : "text-deep"}`}
        >
          {value}
        </motion.div>
      </AnimatePresence>
      <div className="text-[11px] text-muted-foreground mt-1">Faixa: {range}</div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-card text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      <div className="font-display text-base font-bold text-deep mt-0.5">{value}</div>
    </div>
  );
}

function IncidentDialog({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"baixa" | "media" | "alta" | "critica">("media");

  const submit = async () => {
    if (!reason.trim()) { toast.error("Informe o motivo."); return; }
    setBusy(true);
    const { error } = await supabase.from("incidents").insert({ trip_id: tripId, reason, description: description || null, severity });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Sinistro registrado");
    setOpen(false);
    setReason(""); setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/5">
          <FileWarning className="size-4 mr-1.5" /> Reportar sinistro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar sinistro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Falha na refrigeração" />
          </div>
          <div className="space-y-2">
            <Label>Severidade</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do ocorrido" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy} className="w-full bg-destructive text-destructive-foreground hover:opacity-90">
            {busy && <Loader2 className="size-4 mr-2 animate-spin" />}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FinishDialog({ onFinish, finishing }: { onFinish: (s: "entregue" | "sinistro", obs?: string) => void; finishing: boolean }) {
  const [open, setOpen] = useState(false);
  const [obs, setObs] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-success text-success-foreground hover:opacity-90">
          <CheckCircle2 className="size-4 mr-1.5" /> Finalizar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar viagem</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Observações pós-entrega</Label>
          <Textarea rows={4} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Como foi a entrega? Alguma observação?" />
        </div>
        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => onFinish("sinistro", obs)} disabled={finishing}>
            Encerrar com sinistro
          </Button>
          <Button onClick={() => onFinish("entregue", obs)} disabled={finishing} className="bg-success text-success-foreground hover:opacity-90">
            {finishing && <Loader2 className="size-4 mr-2 animate-spin" />}
            Confirmar entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
