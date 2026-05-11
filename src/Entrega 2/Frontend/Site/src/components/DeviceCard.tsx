import { Thermometer, Droplets, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Dispositivo } from '@/data/mockData';
import { TEMP_MIN, TEMP_MAX, UMID_MIN, UMID_MAX } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface DeviceCardProps {
  dispositivo: Dispositivo;
  index: number;
  onClick?: () => void;
}

const DeviceCard = ({ dispositivo, index, onClick }: DeviceCardProps) => {
  const isAlerta = dispositivo.status === 'alerta';
  const isOffline = dispositivo.status === 'offline';
  const isNormal = dispositivo.status === 'normal';

  const umidadeAlerta = dispositivo.umidadeAtual < UMID_MIN || dispositivo.umidadeAtual > UMID_MAX;

  return (
    <Card
      className={cn(
        'animate-fade-in-up overflow-hidden transition-shadow hover:shadow-lg cursor-pointer',
        isAlerta && 'ring-2 ring-destructive/50',
        isOffline && 'opacity-70'
      )}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-card-foreground">{dispositivo.nome}</h3>
            <p className="text-xs text-muted-foreground">{dispositivo.localizacao}</p>
          </div>
          <div className="flex items-center gap-2">
            {dispositivo.conexao === 'online' ? (
              <Wifi className="w-4 h-4 text-success" />
            ) : (
              <WifiOff className="w-4 h-4 text-offline" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Temperatura e Umidade lado a lado */}
        <div className="flex items-end gap-4 mb-3">
          <div className="flex items-end gap-1.5">
            <Thermometer className={cn(
              'w-7 h-7',
              isAlerta && 'text-destructive',
              isNormal && 'text-primary',
              isOffline && 'text-offline'
            )} />
            <span className={cn(
              'text-3xl font-bold font-mono tracking-tight',
              isAlerta && 'text-destructive',
              isNormal && 'text-foreground',
              isOffline && 'text-offline'
            )}>
              {isOffline ? '--' : dispositivo.temperaturaAtual.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground mb-0.5">°C</span>
          </div>
          <div className="flex items-end gap-1.5">
            <Droplets className={cn(
              'w-5 h-5',
              umidadeAlerta && !isOffline ? 'text-warning' : 'text-primary/60',
              isOffline && 'text-offline'
            )} />
            <span className={cn(
              'text-xl font-bold font-mono tracking-tight',
              umidadeAlerta && !isOffline ? 'text-warning' : 'text-foreground',
              isOffline && 'text-offline'
            )}>
              {isOffline ? '--' : dispositivo.umidadeAtual.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground mb-0.5">%</span>
          </div>
        </div>

        {/* Barras visuais */}
        {!isOffline && (
          <div className="space-y-2 mb-3">
            {/* Barra temperatura */}
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>0°C</span>
                <span className="text-success font-medium">Faixa segura ({TEMP_MIN}–{TEMP_MAX}°C)</span>
                <span>15°C</span>
              </div>
              <div className="h-2 rounded-full bg-destructive/25 overflow-hidden relative">
                <div
                  className="absolute inset-y-0 bg-success/50 rounded-full"
                  style={{
                    left: `${(TEMP_MIN / 15) * 100}%`,
                    width: `${((TEMP_MAX - TEMP_MIN) / 15) * 100}%`,
                  }}
                />
                <div
                  className={cn(
                    'absolute top-1/2 w-3 h-3 rounded-full border-2 border-card shadow-md',
                    isAlerta ? 'bg-destructive' : 'bg-success'
                  )}
                  style={{
                    left: `${Math.min(Math.max((dispositivo.temperaturaAtual / 15) * 100, 2), 98)}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>
            </div>

            {/* Barra umidade */}
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>20%</span>
                <span className="text-primary/70 font-medium">Umidade ({UMID_MIN}–{UMID_MAX}%)</span>
                <span>60%</span>
              </div>
              <div className="h-2 rounded-full bg-warning/20 overflow-hidden relative">
                <div
                  className="absolute inset-y-0 bg-primary/30 rounded-full"
                  style={{
                    left: `${((UMID_MIN - 20) / 40) * 100}%`,
                    width: `${((UMID_MAX - UMID_MIN) / 40) * 100}%`,
                  }}
                />
                <div
                  className={cn(
                    'absolute top-1/2 w-3 h-3 rounded-full border-2 border-card shadow-md',
                    umidadeAlerta ? 'bg-warning' : 'bg-primary/70'
                  )}
                  style={{
                    left: `${Math.min(Math.max(((dispositivo.umidadeAtual - 20) / 40) * 100, 2), 98)}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="flex items-center justify-between">
          {isNormal && (
            <Badge className="bg-success/15 text-success hover:bg-success/25 border-0 font-semibold">
              NORMAL
            </Badge>
          )}
          {isAlerta && (
            <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/25 border-0 font-semibold animate-pulse-alert">
              <AlertTriangle className="w-3 h-3 mr-1" />
              ALERTA CRÍTICO
            </Badge>
          )}
          {isOffline && (
            <Badge className="bg-offline/15 text-offline hover:bg-offline/25 border-0 font-semibold">
              OFFLINE
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            {new Date(dispositivo.ultimaAtualizacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceCard;
