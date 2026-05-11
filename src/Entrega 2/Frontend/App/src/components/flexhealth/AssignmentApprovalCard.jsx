import { useState } from "react";
import { Cpu, Wifi, CheckCircle2, XCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function AssignmentApprovalCard({ assignment, deviceInfo, onRespond }) {
  const [responding, setResponding] = useState(null);

  const handle = async (approved) => {
    setResponding(approved ? "approving" : "rejecting");
    await onRespond(approved);
    setResponding(null);
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="space-y-4 py-2"
    >
      {/* Notification banner */}
      <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl px-4 py-3">
        <Bell className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-primary">Nova solicitação de atribuição</p>
          <p className="text-[11px] text-muted-foreground">O administrador atribuiu um dispositivo a você.</p>
        </div>
      </div>

      {/* Device card */}
      <div className="rounded-2xl border-2 border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Dispositivo ESP32</h3>
            <p className="text-xs text-muted-foreground font-mono">{assignment.device_id}</p>
            {deviceInfo?.box_id && (
              <p className="text-[11px] text-muted-foreground">Caixa Térmica {deviceInfo.box_id}</p>
            )}
          </div>
        </div>

        {deviceInfo?.ssid && (
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
            <Wifi className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs font-semibold text-foreground">Rede: {deviceInfo.ssid}</p>
              <p className="text-[11px] text-muted-foreground">Aguardando sua confirmação</p>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Aceite para confirmar o uso deste dispositivo na sua viagem.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handle(false)}
            disabled={!!responding}
            variant="outline"
            className="h-14 rounded-xl font-bold border-2 border-red-200 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-5 h-5 mr-1.5" />
            {responding === "rejecting" ? "Recusando..." : "Recusar"}
          </Button>
          <Button
            onClick={() => handle(true)}
            disabled={!!responding}
            className="h-14 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="w-5 h-5 mr-1.5" />
            {responding === "approving" ? "Aceitando..." : "Aceitar"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}