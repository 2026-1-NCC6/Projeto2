import { Thermometer } from "lucide-react";
import { motion } from "framer-motion";

export default function TempGauge({ temperature, minSafe = 2, maxSafe = 8 }) {
  const isSafe = temperature >= minSafe && temperature <= maxSafe;
  const isWarning = !isSafe && (temperature >= minSafe - 1 && temperature <= maxSafe + 1);
  const isCritical = !isSafe && !isWarning;

  const bgColor = isSafe
    ? "bg-emerald-50 border-emerald-200"
    : isWarning
    ? "bg-amber-50 border-amber-300"
    : "bg-red-50 border-red-300";

  const textColor = isSafe
    ? "text-emerald-600"
    : isWarning
    ? "text-amber-600"
    : "text-red-600";

  const iconColor = isSafe
    ? "text-emerald-500"
    : isWarning
    ? "text-amber-500"
    : "text-red-500";

  const label = isSafe ? "Temperatura Normal" : isWarning ? "Atenção" : "ALERTA CRÍTICO";

  return (
    <motion.div
      className={`relative rounded-2xl border-2 p-6 text-center ${bgColor} ${isCritical ? "animate-pulse-alert" : ""}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <Thermometer className={`w-5 h-5 ${iconColor}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${textColor}`}>
          {label}
        </span>
      </div>
      <div className={`text-7xl font-black tabular-nums ${textColor}`}>
        {temperature.toFixed(1)}°
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Faixa segura: {minSafe}°C – {maxSafe}°C
      </p>
      {isCritical && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-red-400"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}