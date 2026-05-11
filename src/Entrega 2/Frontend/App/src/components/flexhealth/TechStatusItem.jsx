import { User, Thermometer, Package } from "lucide-react";

export default function TechStatusItem({ trip }) {
  const temp = trip.current_temp ?? 0;
  const isSafe = temp >= 2 && temp <= 8;

  return (
    <div className={`rounded-2xl border-2 p-4 transition-all ${
      trip.status === "sinistro"
        ? "border-red-300 bg-red-50"
        : isSafe
        ? "border-border bg-card"
        : "border-amber-300 bg-amber-50"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{trip.technician_name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <Package className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                Caixa {trip.box_id} · {trip.route_name}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 ${isSafe ? "text-emerald-600" : "text-red-600"}`}>
            <Thermometer className="w-4 h-4" />
            <span className="text-lg font-black tabular-nums">{temp.toFixed(1)}°</span>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
            trip.status === "em_transito"
              ? isSafe ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              : trip.status === "entregue"
              ? "bg-slate-100 text-slate-600"
              : "bg-red-100 text-red-700"
          }`}>
            {trip.status === "em_transito"
              ? isSafe ? "OK" : "ALERTA"
              : trip.status === "entregue"
              ? "Entregue"
              : "Sinistro"}
          </span>
        </div>
      </div>
    </div>
  );
}