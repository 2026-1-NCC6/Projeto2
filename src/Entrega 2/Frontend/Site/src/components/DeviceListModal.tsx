import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Thermometer, MapPin } from 'lucide-react';
import { dispositivos } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface DeviceListModalProps {
  open: boolean;
  onClose: () => void;
}

const DeviceListModal = ({ open, onClose }: DeviceListModalProps) => {
  const online = dispositivos.filter(d => d.conexao === 'online');
  const offline = dispositivos.filter(d => d.conexao === 'offline');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            Dispositivos ({dispositivos.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Online */}
          <div>
            <p className="text-sm font-semibold text-success mb-2 flex items-center gap-1.5">
              <Wifi className="w-4 h-4" /> Online ({online.length})
            </p>
            <div className="space-y-2">
              {online.map(d => (
                <DeviceRow key={d.id} nome={d.nome} localizacao={d.localizacao} temperatura={d.temperaturaAtual} status={d.status} />
              ))}
            </div>
          </div>

          {/* Offline */}
          {offline.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-offline mb-2 flex items-center gap-1.5">
                <WifiOff className="w-4 h-4" /> Offline ({offline.length})
              </p>
              <div className="space-y-2">
                {offline.map(d => (
                  <DeviceRow key={d.id} nome={d.nome} localizacao={d.localizacao} status={d.status} />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

function DeviceRow({ nome, localizacao, temperatura, status }: { nome: string; localizacao: string; temperatura?: number; status: string }) {
  return (
    <div className={cn(
      'flex items-center justify-between rounded-lg border bg-card p-3',
      status === 'alerta' && 'ring-1 ring-destructive/40'
    )}>
      <div>
        <p className="text-sm font-medium text-card-foreground">{nome}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {localizacao}
        </p>
      </div>
      <div className="text-right">
        {temperatura !== undefined ? (
          <span className={cn(
            'text-lg font-bold font-mono',
            status === 'alerta' ? 'text-destructive' : 'text-foreground'
          )}>
            {temperatura.toFixed(1)}°C
          </span>
        ) : (
          <span className="text-sm text-offline font-mono">--</span>
        )}
        {status === 'alerta' && (
          <Badge className="bg-destructive/15 text-destructive border-0 text-[10px] ml-2">ALERTA</Badge>
        )}
      </div>
    </div>
  );
}

export default DeviceListModal;
