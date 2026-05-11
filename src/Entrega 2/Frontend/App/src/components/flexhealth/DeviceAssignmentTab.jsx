import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Cpu, User, Wifi, Plus, Trash2, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

const STATUS_CONFIG = {
  pendente:   { label: "Pendente",   color: "bg-amber-100 text-amber-700",   icon: Clock },
  conectando: { label: "Conectando", color: "bg-blue-100 text-blue-700",     icon: RefreshCw },
  conectado:  { label: "Conectado",  color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  falha:      { label: "Falha",      color: "bg-red-100 text-red-700",       icon: XCircle },
};

export default function DeviceAssignmentTab() {
  const [assignments, setAssignments] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ technician_name: "", technician_email: "", device_id: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [a, d] = await Promise.all([
      base44.entities.Assignment.filter({ active: true }, "-created_date", 50),
      base44.entities.Device.list("-created_date", 50),
    ]);
    setAssignments(a);
    setDevices(d);
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!form.technician_email || !form.device_id || !form.technician_name) return;
    setSaving(true);

    const device = devices.find(d => d.device_id === form.device_id);

    // Deactivate any existing assignment for this tech
    const existing = assignments.filter(a => a.technician_email === form.technician_email);
    for (const a of existing) {
      await base44.entities.Assignment.update(a.id, { active: false });
    }

    await base44.entities.Assignment.create({
      device_id: form.device_id,
      technician_email: form.technician_email,
      technician_name: form.technician_name,
      connection_status: "pendente",
      wifi_tested: false,
      active: true,
      approval_status: "pendente",
    });

    if (device) {
      await base44.entities.Device.update(device.id, { status: "atribuido" });
    }

    setSaving(false);
    setModalOpen(false);
    setForm({ technician_name: "", technician_email: "", device_id: "" });
    loadAll();
  };

  const handleRemove = async (assignment) => {
    await base44.entities.Assignment.update(assignment.id, { active: false });
    const device = devices.find(d => d.device_id === assignment.device_id);
    if (device) await base44.entities.Device.update(device.id, { status: "disponivel" });
    loadAll();
  };

  const availableDevices = devices.filter(d => d.status === "disponivel" || d.status === "offline");
  const assignedDeviceIds = assignments.map(a => a.device_id);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Atribuições Ativas ({assignments.length})
        </h2>
        <Button onClick={() => setModalOpen(true)} size="sm" className="rounded-xl h-9 gap-1.5">
          <Plus className="w-4 h-4" />
          Atribuir
        </Button>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Cpu className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma atribuição ativa.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a, i) => {
            const cfg = STATUS_CONFIG[a.connection_status] || STATUS_CONFIG.pendente;
            const Icon = cfg.icon;
            const device = devices.find(d => d.device_id === a.device_id);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{a.technician_name}</p>
                      <p className="text-[11px] text-muted-foreground">{a.technician_email}</p>
                      {a.ctc_code && (
                        <p className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded mt-0.5 inline-block text-muted-foreground">
                          CTC: {a.ctc_code}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(a)}
                    className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-muted rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs font-bold">Dispositivo: {a.device_id}</p>
                      {device?.ssid && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Wifi className="w-3 h-3" /> {device.ssid}
                        </p>
                      )}
                      {device?.box_id && (
                        <p className="text-[11px] text-muted-foreground">Caixa {device.box_id}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${cfg.color}`}>
                    <Icon className={`w-3 h-3 ${a.connection_status === "conectando" ? "animate-spin" : ""}`} />
                    {cfg.label}
                  </span>
                </div>

                {a.wifi_tested && a.connection_status === "conectado" && (
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    WiFi testado e funcionando
                    {a.last_ping && <span className="text-muted-foreground ml-1">· {a.last_ping}</span>}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Assign Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Atribuir Dispositivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nome do Técnico
              </Label>
              <Input
                value={form.technician_name}
                onChange={e => setForm(f => ({ ...f, technician_name: e.target.value }))}
                placeholder="Ex: João Silva"
                className="h-12 rounded-xl border-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                E-mail do Técnico
              </Label>
              <Input
                type="email"
                value={form.technician_email}
                onChange={e => setForm(f => ({ ...f, technician_email: e.target.value }))}
                placeholder="tecnico@empresa.com"
                className="h-12 rounded-xl border-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dispositivo (ESP32)
              </Label>
              {devices.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-muted rounded-xl p-3">
                  Nenhum dispositivo cadastrado ainda.
                </p>
              ) : (
                <select
                  value={form.device_id}
                  onChange={e => setForm(f => ({ ...f, device_id: e.target.value }))}
                  className="w-full h-12 rounded-xl border-2 border-input bg-background px-3 text-sm appearance-none focus:outline-none focus:border-primary"
                >
                  <option value="">Selecione um dispositivo...</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.device_id} disabled={assignedDeviceIds.includes(d.device_id)}>
                      {d.device_id} — Caixa {d.box_id || "?"} {d.ssid ? `(${d.ssid})` : ""}
                      {assignedDeviceIds.includes(d.device_id) ? " [Em uso]" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              onClick={handleAssign}
              disabled={saving || !form.technician_email || !form.device_id || !form.technician_name}
              className="w-full h-12 rounded-xl font-bold"
            >
              {saving ? "Enviando solicitação..." : "Confirmar Atribuição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}