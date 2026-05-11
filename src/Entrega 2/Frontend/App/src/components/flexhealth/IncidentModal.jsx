import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";

const QUICK_REASONS = [
  "Pneu furou",
  "Trânsito intenso",
  "Falha no sensor",
  "Acidente na via",
  "Problema mecânico",
  "Outro",
];

export default function IncidentModal({ open, onClose, tripId, technicianEmail }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSending(true);
    await base44.entities.Incident.create({
      trip_id: tripId,
      technician_email: technicianEmail,
      reason: selectedReason,
      description: description,
      severity: "alta",
      resolved: false,
    });
    setSending(false);
    setSelectedReason("");
    setDescription("");
    onClose(true);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(false); }}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-bold">Reportar Sinistro</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Motivo rápido
            </label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
                    selectedReason === reason
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-muted text-foreground border-border hover:border-red-300"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Detalhes (opcional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o ocorrido..."
              className="rounded-xl min-h-[80px]"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || sending}
            className="w-full h-14 text-base font-bold rounded-xl bg-red-600 hover:bg-red-700"
          >
            {sending ? "Enviando..." : "🚨 Enviar Alerta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}