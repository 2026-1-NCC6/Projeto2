import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Thermometer, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import DeviceCard from '@/components/DeviceCard';
import DeviceDetailModal from '@/components/DeviceDetailModal';
import DeviceListModal from '@/components/DeviceListModal';
import SystemOverviewPanel from '@/components/SystemOverviewPanel';
import AddDeviceDialog from '@/components/AddDeviceDialog';
import { type Dispositivo } from '@/data/mockData';
import { getDispositivosSnapshot, subscribeDispositivos } from '@/services/deviceApi';

const Dashboard = () => {
  const [selectedDevice, setSelectedDevice] = useState<Dispositivo | null>(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>(getDispositivosSnapshot());
  const navigate = useNavigate();

  // 🔌 Quando migrar para a API real, troque por um useQuery em GET /dispositivos
  useEffect(() => {
    return subscribeDispositivos(() => setDispositivos([...getDispositivosSnapshot()]));
  }, []);

  const totalOnline = dispositivos.filter(d => d.conexao === 'online').length;
  const totalAlertas = dispositivos.filter(d => d.status === 'alerta').length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className="cursor-pointer rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/5 p-5 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
          onClick={() => setShowDeviceList(true)}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/15">
              <Thermometer className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-foreground">{dispositivos.length}</p>
              <p className="text-sm font-medium text-muted-foreground">Dispositivos</p>
            </div>
          </div>
        </div>

        <div
          className={`cursor-pointer rounded-xl border-2 p-5 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] ${
            totalAlertas > 0
              ? 'border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 animate-pulse-alert'
              : 'border-success/20 bg-gradient-to-br from-success/10 to-success/5'
          }`}
          onClick={() => navigate('/alertas')}
        >
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${totalAlertas > 0 ? 'bg-destructive/15' : 'bg-success/15'}`}>
              <AlertTriangle className={`w-6 h-6 ${totalAlertas > 0 ? 'text-destructive' : 'text-success'}`} />
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-foreground">{totalAlertas}</p>
              <p className="text-sm font-medium text-muted-foreground">
                {totalAlertas > 0 ? 'Alertas Ativos' : 'Sem Alertas'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Online / Offline */}
      <div className="flex items-center justify-center gap-8 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col items-center gap-1">
          <Wifi className="w-5 h-5 text-success" />
          <span className="text-2xl font-bold font-mono text-foreground">{totalOnline}</span>
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="flex flex-col items-center gap-1">
          <WifiOff className="w-5 h-5 text-offline" />
          <span className="text-2xl font-bold font-mono text-foreground">{dispositivos.length - totalOnline}</span>
          <span className="text-xs text-muted-foreground">Offline</span>
        </div>
      </div>

      {/* Painel de Visão Geral do Sistema */}
      <SystemOverviewPanel />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Monitoramento em Tempo Real</h2>
          <AddDeviceDialog />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dispositivos.map((d, i) => (
            <DeviceCard key={d.id} dispositivo={d} index={i} onClick={() => setSelectedDevice(d)} />
          ))}
        </div>
      </div>

      <DeviceDetailModal
        dispositivo={selectedDevice}
        open={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
      />
      <DeviceListModal
        open={showDeviceList}
        onClose={() => setShowDeviceList(false)}
      />
    </div>
  );
};

function SummaryCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg bg-card p-4 shadow-sm border ${highlight ? 'ring-2 ring-destructive/40' : ''}`}>
      {icon}
      <div>
        <p className="text-2xl font-bold font-mono text-card-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default Dashboard;
