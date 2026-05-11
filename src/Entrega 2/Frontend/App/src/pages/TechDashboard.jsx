import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { PackageCheck, AlertTriangle, RotateCw, Cpu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import AppHeader from "../components/flexhealth/AppHeader";
import IncidentModal from "../components/flexhealth/IncidentModal";
import ConfirmDeliveryModal from "../components/flexhealth/ConfirmDeliveryModal";
import DeviceConnectionCard from "../components/flexhealth/DeviceConnectionCard";
import AssignmentApprovalCard from "../components/flexhealth/AssignmentApprovalCard";
import StartTripModal from "../components/flexhealth/StartTripModal";
import PostTripModal from "../components/flexhealth/PostTripModal";
import TripMonitor from "../components/flexhealth/TripMonitor";

const MIN_SAFE = 2;
const MAX_SAFE = 8;

export default function TechDashboard() {
  const [user, setUser] = useState(null);
  const [trip, setTrip] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [assignedDevice, setAssignedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("monitor");
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [startTripOpen, setStartTripOpen] = useState(false);
  const [postTripOpen, setPostTripOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Simulated sensor state
  const [simulatedTemp, setSimulatedTemp] = useState(4.5);
  const [simulatedHumidity, setSimulatedHumidity] = useState(65);
  const tempHistoryRef = useRef([]);

  useEffect(() => { loadData(); }, []);

  // Simulate IoT sensor readings every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedTemp(prev => {
        const next = Math.round((prev + (Math.random() - 0.48) * 0.8) * 10) / 10;
        return Math.max(0, Math.min(15, next));
      });
      setSimulatedHumidity(prev => {
        const next = Math.round((prev + (Math.random() - 0.5) * 1.5) * 10) / 10;
        return Math.max(40, Math.min(95, next));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Push readings into history and persist to DB when trip is active
  useEffect(() => {
    if (!trip || trip.status !== "em_transito") return;

    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const reading = { time: now, temp: simulatedTemp, humidity: simulatedHumidity };
    const newHistory = [...(tempHistoryRef.current), reading].slice(-60);
    tempHistoryRef.current = newHistory;

    const isAlert = simulatedTemp < MIN_SAFE || simulatedTemp > MAX_SAFE;
    const newAlertCount = isAlert ? (trip.alert_count ?? 0) + 1 : (trip.alert_count ?? 0);

    setTrip(prev => prev ? {
      ...prev,
      current_temp: simulatedTemp,
      current_humidity: simulatedHumidity,
      temp_history: newHistory,
      alert_count: isAlert ? newAlertCount : prev.alert_count,
    } : prev);

    // Persist every ~5 readings (15s)
    if (newHistory.length % 5 === 0) {
      base44.entities.Trip.update(trip.id, {
        current_temp: simulatedTemp,
        current_humidity: simulatedHumidity,
        temp_history: newHistory,
        alert_count: newAlertCount,
      });
    }
  }, [simulatedTemp, simulatedHumidity]);

  const loadData = async () => {
    setLoading(true);
    const me = await base44.auth.me();
    setUser(me);
    const [trips, assignments] = await Promise.all([
      base44.entities.Trip.filter({ technician_email: me.email, status: "em_transito" }, "-created_date", 1),
      base44.entities.Assignment.filter({ technician_email: me.email, active: true }, "-created_date", 1),
    ]);
    if (trips.length > 0) {
      const t = trips[0];
      setTrip(t);
      setSimulatedTemp(t.current_temp ?? 4.5);
      setSimulatedHumidity(t.current_humidity ?? 65);
      tempHistoryRef.current = t.temp_history ?? [];
    } else {
      setTrip(null);
    }
    if (assignments.length > 0) {
      setAssignment(assignments[0]);
      const devices = await base44.entities.Device.filter({ device_id: assignments[0].device_id }, "-created_date", 1);
      if (devices.length > 0) setAssignedDevice(devices[0]);
    } else {
      setAssignment(null);
      setAssignedDevice(null);
    }
    setLoading(false);
  };

  const handleLogout = () => base44.auth.logout("/");

  const handleStartTrip = async ({ origin, destination, vehicle, route_name }) => {
    const me = user;
    const device = assignedDevice;
    const newTrip = await base44.entities.Trip.create({
      technician_name: me.full_name,
      technician_email: me.email,
      box_id: device?.box_id || assignment?.device_id || "—",
      route_name,
      origin,
      destination,
      vehicle,
      status: "em_transito",
      current_temp: simulatedTemp,
      current_humidity: simulatedHumidity,
      temp_history: [],
      alert_count: 0,
      started_at: new Date().toISOString(),
    });
    setTrip(newTrip);
    tempHistoryRef.current = [];
    setStartTripOpen(false);
    toast({ title: "Viagem iniciada!", description: `Rota: ${route_name}` });
  };

  const handleFinishTrip = () => setDeliveryOpen(true);

  const handleConfirmDelivery = async () => {
    if (!trip) return;
    setConfirming(true);
    await base44.entities.Trip.update(trip.id, {
      status: "entregue",
      ended_at: new Date().toISOString(),
      temp_history: tempHistoryRef.current,
      current_temp: simulatedTemp,
      current_humidity: simulatedHumidity,
    });
    setConfirming(false);
    setDeliveryOpen(false);
    setPostTripOpen(true);
  };

  const handlePostTrip = async (notes) => {
    if (trip && notes) {
      await base44.entities.Trip.update(trip.id, { post_trip_notes: notes });
    }
    setPostTripOpen(false);
    toast({ title: "Viagem finalizada!", description: "Monitoramento encerrado com sucesso." });
    setTrip(null);
    tempHistoryRef.current = [];
  };

  const handleIncidentClose = (submitted) => {
    setIncidentOpen(false);
    if (submitted) {
      toast({ title: "Sinistro reportado!", description: "O administrador foi alertado." });
      if (trip) {
        base44.entities.Trip.update(trip.id, { status: "sinistro" });
        setTrip(prev => prev ? { ...prev, status: "sinistro" } : prev);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const hasApprovedDevice = assignment && assignment.approval_status === "aprovado";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={user?.full_name || "Técnico"} role="tech" onLogout={handleLogout} />

      <main className="max-w-lg mx-auto px-4 pb-32">
        {/* Tabs */}
        <div className="flex border-b border-border mb-5 sticky top-[60px] bg-background z-10">
          {[
            { id: "monitor", label: "Monitoramento" },
            { id: "device", label: "Dispositivo" + (hasApprovedDevice ? " ✅" : assignment ? " ⏳" : "") },
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

        {/* Device Tab */}
        {activeTab === "device" ? (
          assignment ? (
            assignment.approval_status === "pendente" ? (
              <AssignmentApprovalCard
                assignment={assignment}
                deviceInfo={assignedDevice}
                onRespond={async (approved) => {
                  await base44.entities.Assignment.update(assignment.id, {
                    approval_status: approved ? "aprovado" : "rejeitado",
                    active: approved,
                  });
                  if (!approved) {
                    setAssignment(null);
                    setAssignedDevice(null);
                  } else {
                    setAssignment(prev => ({ ...prev, approval_status: "aprovado" }));
                  }
                }}
              />
            ) : (
              <DeviceConnectionCard
                assignment={assignment}
                deviceInfo={assignedDevice}
                onStatusUpdate={(status) => setAssignment(prev => prev ? { ...prev, connection_status: status } : prev)}
              />
            )
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Cpu className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum dispositivo atribuído a você ainda.</p>
              <p className="text-[11px] mt-1">Aguarde a atribuição pelo administrador.</p>
            </div>
          )
        ) : (
          /* Monitor Tab */
          trip && trip.status === "em_transito" ? (
            <TripMonitor
              trip={trip}
              onFinish={handleFinishTrip}
              onIncident={() => setIncidentOpen(true)}
            />
          ) : trip && trip.status === "sinistro" ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center space-y-4 py-10"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-700">Sinistro Reportado</h2>
              <p className="text-sm text-muted-foreground">O administrador foi notificado. Aguarde instruções.</p>
              <Button onClick={loadData} variant="outline" className="rounded-xl mt-4">
                <RotateCw className="w-4 h-4 mr-2" /> Atualizar
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center space-y-4 py-10"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <PackageCheck className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold">Nenhuma viagem ativa</h2>
              <p className="text-sm text-muted-foreground">
                {hasApprovedDevice
                  ? "Dispositivo conectado. Inicie uma nova viagem."
                  : "Aprove seu dispositivo antes de iniciar uma viagem."}
              </p>
              <div className="flex flex-col gap-2 mt-4">
                {hasApprovedDevice && (
                  <Button
                    onClick={() => setStartTripOpen(true)}
                    className="rounded-xl h-12 font-bold gap-2"
                  >
                    <Plus className="w-4 h-4" /> Iniciar Nova Viagem
                  </Button>
                )}
                <Button onClick={loadData} variant="outline" className="rounded-xl h-11">
                  <RotateCw className="w-4 h-4 mr-2" /> Atualizar
                </Button>
              </div>
            </motion.div>
          )
        )}
      </main>

      {/* Modals */}
      <StartTripModal
        open={startTripOpen}
        onClose={() => setStartTripOpen(false)}
        onStart={handleStartTrip}
        deviceInfo={assignedDevice}
        user={user}
      />

      <PostTripModal
        open={postTripOpen}
        onClose={() => handlePostTrip("")}
        onSubmit={handlePostTrip}
      />

      {trip && (
        <>
          <IncidentModal
            open={incidentOpen}
            onClose={handleIncidentClose}
            tripId={trip.id}
            technicianEmail={user?.email}
          />
          <ConfirmDeliveryModal
            open={deliveryOpen}
            onClose={() => setDeliveryOpen(false)}
            onConfirm={handleConfirmDelivery}
            loading={confirming}
          />
        </>
      )}
    </div>
  );
}