import { Package, MapPin, Truck } from "lucide-react";

export default function TripCard({ trip }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Caixa Térmica {trip.box_id}
            </h3>
            <p className="text-[11px] text-muted-foreground">{trip.vehicle || "Veículo não informado"}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
          trip.status === "em_transito"
            ? "bg-primary/10 text-primary"
            : trip.status === "entregue"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-red-100 text-red-700"
        }`}>
          {trip.status === "em_transito" ? "Em Trânsito" : trip.status === "entregue" ? "Entregue" : "Sinistro"}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="w-3.5 h-3.5" />
        <span>{trip.route_name}</span>
      </div>
      {trip.vehicle && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Truck className="w-3.5 h-3.5" />
          <span>{trip.vehicle}</span>
        </div>
      )}
    </div>
  );
}