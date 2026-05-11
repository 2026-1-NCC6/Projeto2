import { useState } from "react";
import { MapPin, Truck, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function StartTripModal({ open, onClose, onStart, deviceInfo, user }) {
  const [form, setForm] = useState({ origin: "", destination: "", vehicle: "", route_name: "" });
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    if (!form.origin || !form.destination) return;
    setSaving(true);
    await onStart({
      ...form,
      route_name: form.route_name || `${form.origin} → ${form.destination}`,
    });
    setSaving(false);
    setForm({ origin: "", destination: "", vehicle: "", route_name: "" });
    // fecha automaticamente após iniciar
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold">Iniciar Nova Viagem</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 inline mr-1" /> Origem
            </Label>
            <Input
              value={form.origin}
              onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
              placeholder="Ex: Centro de Distribuição SP"
              className="h-11 rounded-xl border-2"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 inline mr-1" /> Destino
            </Label>
            <Input
              value={form.destination}
              onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
              placeholder="Ex: Hospital São Lucas"
              className="h-11 rounded-xl border-2"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Truck className="w-3.5 h-3.5 inline mr-1" /> Veículo (opcional)
            </Label>
            <Input
              value={form.vehicle}
              onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))}
              placeholder="Ex: VAN-1234"
              className="h-11 rounded-xl border-2"
            />
          </div>
          {deviceInfo && (
            <div className="bg-muted rounded-xl px-3 py-2 text-xs text-muted-foreground">
              📦 Caixa <strong>{deviceInfo.box_id}</strong> · Sensor <strong>{deviceInfo.device_id}</strong>
            </div>
          )}
          <Button
            onClick={handleStart}
            disabled={saving || !form.origin || !form.destination}
            className="w-full h-12 rounded-xl font-bold text-base"
          >
            {saving ? "Iniciando..." : "🚀 Iniciar Viagem"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}