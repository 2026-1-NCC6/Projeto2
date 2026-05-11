import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, PackageCheck, Truck, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppHeader from "../components/flexhealth/AppHeader";
import TechStatusItem from "../components/flexhealth/TechStatusItem";
import DeviceAssignmentTab from "../components/flexhealth/DeviceAssignmentTab";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("field");

  useEffect(() => {
    loadData();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubTrips = base44.entities.Trip.subscribe((event) => {
      if (event.type === "create") {
        setTrips((prev) => [event.data, ...prev]);
      } else if (event.type === "update") {
        setTrips((prev) => prev.map((t) => (t.id === event.id ? event.data : t)));
      } else if (event.type === "delete") {
        setTrips((prev) => prev.filter((t) => t.id !== event.id));
      }
    });

    const unsubIncidents = base44.entities.Incident.subscribe((event) => {
      if (event.type === "create") {
        setIncidents((prev) => [event.data, ...prev]);
      }
    });

    return () => {
      unsubTrips();
      unsubIncidents();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const me = await base44.auth.me();
    setUser(me);
    const [allTrips, allIncidents] = await Promise.all([
      base44.entities.Trip.list("-created_date", 50),
      base44.entities.Incident.filter({ resolved: false }, "-created_date", 20),
    ]);
    setTrips(allTrips);
    setIncidents(allIncidents);
    setLoading(false);
  };

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  const activeTrips = trips.filter((t) => t.status === "em_transito");
  const alertTrips = activeTrips.filter(
    (t) => t.current_temp != null && (t.current_temp < 2 || t.current_temp > 8)
  );
  const completedTrips = trips.filter((t) => t.status === "entregue");
  const incidentTrips = trips.filter((t) => t.status === "sinistro");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        userName={user?.full_name || "Admin"}
        role="admin"
        onLogout={handleLogout}
      />

      <main className="max-w-lg mx-auto px-4 pb-10">
        {/* Tabs */}
        <div className="flex border-b border-border mb-5 sticky top-[60px] bg-background z-10">
          {[
            { id: "field", label: "Campo" },
            { id: "devices", label: "Dispositivos" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "devices" ? (
          <DeviceAssignmentTab />
        ) : (
        <div className="space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            icon={<Truck className="w-5 h-5" />}
            label="Em Trânsito"
            value={activeTrips.length}
            color="primary"
          />
          <SummaryCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Alertas"
            value={alertTrips.length + incidentTrips.length}
            color="destructive"
          />
          <SummaryCard
            icon={<PackageCheck className="w-5 h-5" />}
            label="Entregas"
            value={completedTrips.length}
            color="emerald"
          />
          <SummaryCard
            icon={<Activity className="w-5 h-5" />}
            label="Incidentes"
            value={incidents.length}
            color="amber"
          />
        </div>

        {/* Active Incidents Banner */}
        {incidents.length > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-2xl bg-red-50 border-2 border-red-200 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-red-700">
                {incidents.length} incidente(s) não resolvido(s)
              </span>
            </div>
            <div className="space-y-2">
              {incidents.slice(0, 3).map((inc) => (
                <div key={inc.id} className="flex items-center justify-between text-xs">
                  <span className="text-red-700 font-medium">{inc.reason}</span>
                  <span className="text-red-500">{inc.technician_email}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Technicians in the field */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Técnicos em Campo
            </h2>
            <Button
              onClick={loadData}
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
            >
              <RotateCw className="w-3.5 h-3.5 mr-1" />
              Atualizar
            </Button>
          </div>

          {activeTrips.length === 0 && incidentTrips.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Truck className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhum técnico em trânsito no momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...incidentTrips, ...activeTrips].map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TechStatusItem trip={trip} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Completed trips */}
        {completedTrips.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
              Entregas Concluídas
            </h2>
            <div className="space-y-3">
              {completedTrips.slice(0, 5).map((trip) => (
                <TechStatusItem key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        )}
        </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-red-100 text-red-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className={`w-9 h-9 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
    </div>
  );
}