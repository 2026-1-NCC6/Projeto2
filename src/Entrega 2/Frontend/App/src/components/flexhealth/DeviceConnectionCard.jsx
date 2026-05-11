import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Wifi, WifiOff, Cpu, CheckCircle2, AlertTriangle, RefreshCw, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function DeviceConnectionCard({ assignment, deviceInfo, onStatusUpdate }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const isConnected = assignment.connection_status === "conectado";
  const isFailed = assignment.connection_status === "falha";

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    // Update to "conectando"
    await base44.entities.Assignment.update(assignment.id, {
      connection_status: "conectando",
    });
    onStatusUpdate?.("conectando");

    // Simulate WiFi handshake (3s)
    await new Promise(r => setTimeout(r, 3000));

    // 85% chance of success (demo)
    const success = Math.random() > 0.15;
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    await base44.entities.Assignment.update(assignment.id, {
      connection_status: success ? "conectado" : "falha",
      wifi_tested: success,
      last_ping: success ? now : "",
    });

    setTestResult(success ? "ok" : "fail");
    onStatusUpdate?.(success ? "conectado" : "falha");
    setTesting(false);
  };

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5 space-y-4">
      {/* Device Info */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Cpu className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">
            Dispositivo ESP32
          </h3>
          <p className="text-xs text-muted-foreground font-mono">{assignment.device_id}</p>
          {deviceInfo?.box_id && (
            <p className="text-[11px] text-muted-foreground">Caixa Térmica {deviceInfo.box_id}</p>
          )}
        </div>
      </div>

      {/* WiFi Info */}
      {deviceInfo?.ssid && (
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
          <Wifi className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs font-semibold text-foreground">Rede: {deviceInfo.ssid}</p>
            <p className="text-[11px] text-muted-foreground">
              {isConnected ? "Conectado com sucesso" : "Aguardando conexão"}
            </p>
          </div>
        </div>
      )}

      {/* Status */}
      <div className={`rounded-xl p-3 flex items-center gap-2 ${
        isConnected ? "bg-emerald-50 border border-emerald-200" :
        isFailed ? "bg-red-50 border border-red-200" :
        "bg-amber-50 border border-amber-200"
      }`}>
        {isConnected ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        ) : isFailed ? (
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
        ) : (
          <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
        )}
        <div>
          <p className={`text-sm font-bold ${
            isConnected ? "text-emerald-700" : isFailed ? "text-red-700" : "text-amber-700"
          }`}>
            {isConnected ? "Dispositivo Conectado" : isFailed ? "Falha na Conexão" : "Conexão Pendente"}
          </p>
          {isConnected && assignment.last_ping && (
            <p className="text-[11px] text-emerald-600">Último ping: {assignment.last_ping}</p>
          )}
          {isFailed && (
            <p className="text-[11px] text-red-600">Verifique o WiFi e tente novamente.</p>
          )}
        </div>
      </div>

      {/* Test Button */}
      <Button
        onClick={handleTestConnection}
        disabled={testing}
        variant={isConnected ? "outline" : "default"}
        className={`w-full h-14 text-base font-bold rounded-xl ${
          testing ? "opacity-80" : ""
        }`}
      >
        {testing ? (
          <span className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Testando conexão WiFi...
          </span>
        ) : isConnected ? (
          <span className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Testar Novamente
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Testar Conexão WiFi
          </span>
        )}
      </Button>

      <AnimatePresence>
        {testResult && (
          <motion.div
            key={testResult}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-center text-sm font-semibold ${
              testResult === "ok" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {testResult === "ok"
              ? "✅ Sensor ESP32 respondendo normalmente!"
              : "❌ Sem resposta do dispositivo. Verifique a rede."}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}