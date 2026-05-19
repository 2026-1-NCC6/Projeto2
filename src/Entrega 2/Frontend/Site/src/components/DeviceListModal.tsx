import { useEffect, useState } from 'react';
import { X, Wifi, WifiOff, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { listarDispositivos } from '@/services/deviceApi';
import type { Dispositivo } from '@/data/mockData'; 

interface DeviceListModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DeviceListModal({ open, onClose }: DeviceListModalProps) {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (open) {
      const buscarDados = async () => {
        setCarregando(true);
        try {
          const dados = await listarDispositivos();
          const agora = new Date().getTime();
          
          const mapeados: Dispositivo[] = dados.map(d => {
            const tempoSemLeitura = agora - new Date(d.ultimaAtualizacao).getTime();
            const isOnline = tempoSemLeitura < 15000;
            return {
              ...d,
              nome: d.id === 'geladeira_01' ? 'Caixa Térmica Alpha' : d.nome,
              localizacao: d.id === 'geladeira_01' ? 'Empresa A | Téc: Carlos' : 'Empresa Parceira',
              // CORREÇÃO 1: Avisando pro TypeScript que é exatamente 'online' ou 'offline'
              conexao: (isOnline ? 'online' : 'offline') as 'online' | 'offline'
            };
          });

          const timeNow = new Date().toISOString();
          const exemplos: Dispositivo[] = [
            { id: 'mock_01', nome: 'Caixa Exemplo 1', localizacao: 'Empresa B | Téc: Ana', temperaturaAtual: 4.5, umidadeAtual: 45, status: 'normal', conexao: 'online', ultimaAtualizacao: timeNow },
            { id: 'mock_02', nome: 'Caixa Exemplo 2', localizacao: 'Empresa C | Téc: João', temperaturaAtual: 5.2, umidadeAtual: 50, status: 'normal', conexao: 'online', ultimaAtualizacao: timeNow },
            { id: 'mock_03', nome: 'Caixa Exemplo 3', localizacao: 'Empresa D | Téc: Maria', temperaturaAtual: 3.8, umidadeAtual: 55, status: 'normal', conexao: 'online', ultimaAtualizacao: timeNow }
          ];

          setDispositivos([...mapeados, ...exemplos]);
        } catch (error) {
          console.error("Erro ao carregar lista de dispositivos no modal:", error);
        } finally {
          setCarregando(false);
        }
      };

      buscarDados();
    }
  }, [open]);

  const onlineDevices = dispositivos.filter(d => d.conexao === 'online');
  const offlineDevices = dispositivos.filter(d => d.conexao === 'offline');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-lg">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <span className="text-primary text-2xl font-normal block mb-1">🌡️</span> 
              Unidades em Rota ({dispositivos.length})
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          
          {carregando ? (
            <p className="text-center text-sm text-muted-foreground py-4">Sincronizando com a frota...</p>
          ) : (
            <>
              {onlineDevices.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-success">
                    <Wifi className="w-4 h-4" /> 
                    Transmitindo ({onlineDevices.length})
                  </h4>
                  <div className="space-y-2">
                    {onlineDevices.map(d => (
                      <div 
                        key={d.id} 
                        // CORREÇÃO 2: Removido o d.status === 'error' que o TypeScript estava odiando
                        className={`flex items-center justify-between p-3 rounded-lg border bg-background transition-colors ${
                          d.status === 'alerta' || d.temperaturaAtual > 8 || d.temperaturaAtual < 2 
                            ? 'border-destructive/40 bg-destructive/5' 
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm">{d.nome}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {d.localizacao}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold font-mono ${
                            d.status === 'alerta' || d.temperaturaAtual > 8 || d.temperaturaAtual < 2 
                              ? 'text-destructive' 
                              : 'text-foreground'
                          }`}>
                            {d.temperaturaAtual.toFixed(1)}°C
                          </span>
                          {(d.status === 'alerta' || d.temperaturaAtual > 8 || d.temperaturaAtual < 2) && (
                            <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive border-0 text-[10px] px-1.5 py-0.5">
                              ALERTA
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {offlineDevices.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <WifiOff className="w-4 h-4" /> 
                    Sinal Perdido ({offlineDevices.length})
                  </h4>
                  <div className="space-y-2">
                    {offlineDevices.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 opacity-70">
                        <div>
                          <p className="font-semibold text-muted-foreground text-sm">{d.nome}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {d.localizacao}
                          </p>
                        </div>
                        <span className="text-muted-foreground font-mono">--</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}