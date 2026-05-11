import { motion } from "framer-motion";
import { MapPin, Truck, Thermometer, Droplets, AlertTriangle, PackageCheck, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import TempGauge from "./TempGauge";

export default function TripMonitor({ trip, onFinish, onIncident }) {
  const temp = trip.current_temp ?? 4.5;
  const humidity = trip.current_humidity ?? 65;
  const alertCount = trip.alert_count ?? 0;
  const history = trip.temp_history ?? [];

  const chartData = history.slice(-20).map((h, i) => ({
    t: h.time || `${i}`,
    temp: h.temp,
    hum: h.humidity,
  }));

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="space-y-4 py-2"
    >
      {/* Route info */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Navigation className="w-4 h-4 text-primary" />
          {trip.route_name}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {trip.origin || "—"}
          </span>
          <span>→</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" /> {trip.destination || "—"}
          </span>
        </div>
        {trip.vehicle && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Truck className="w-3 h-3" /> {trip.vehicle}
          </div>
        )}
      </div>

      {/* Live sensors */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <TempGauge temperature={temp} />
        </div>
        <div className="flex flex-col gap-3">
          {/* Humidity */}
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 flex flex-col items-center justify-center flex-1">
            <Droplets className="w-5 h-5 text-blue-500 mb-1" />
            <p className="text-2xl font-black text-blue-700 tabular-nums">{humidity.toFixed(0)}%</p>
            <p className={`text-[10px] font-medium ${humidity >= 35 && humidity <= 45 ? "text-blue-500" : "text-amber-500"}`}>Umidade</p>
          </div>
          {/* Alerts */}
          <div className={`rounded-2xl border p-3 flex flex-col items-center justify-center flex-1 ${
            alertCount > 0 ? "bg-red-50 border-red-200" : "bg-muted border-border"
          }`}>
            <AlertTriangle className={`w-5 h-5 mb-1 ${alertCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            <p className={`text-2xl font-black tabular-nums ${alertCount > 0 ? "text-red-700" : "text-muted-foreground"}`}>
              {alertCount}
            </p>
            <p className={`text-[10px] font-medium ${alertCount > 0 ? "text-red-500" : "text-muted-foreground"}`}>
              Alertas
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Variação de Temperatura
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="t" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9 }} domain={[0, 12]} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={(v) => [`${v}°C`, "Temp"]}
              />
              <ReferenceLine y={2} stroke="#10b981" strokeDasharray="3 3" />
              <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            Linhas verdes/vermelhas = limites seguros (2°C – 8°C) · Umidade ideal: 35–45%
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={onFinish}
          className="w-full h-16 text-base font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
        >
          <PackageCheck className="w-5 h-5 mr-2" />
          📦 Finalizar Viagem
        </Button>
        <Button
          onClick={onIncident}
          variant="destructive"
          className="w-full h-16 text-base font-bold rounded-2xl shadow-lg shadow-red-200"
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          🚨 Reportar Sinistro
        </Button>
      </div>
    </motion.div>
  );
}