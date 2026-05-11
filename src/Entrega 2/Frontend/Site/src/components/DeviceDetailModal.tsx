import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Thermometer, Droplets, Wifi, WifiOff, TrendingDown, TrendingUp, BarChart3, ShieldCheck, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Dispositivo, PeriodoFiltro } from '@/data/mockData';
import { TEMP_MIN, TEMP_MAX, UMID_MIN, UMID_MAX, gerarHistoricoPorPeriodo, calcularEstatisticas } from '@/data/mockData';

interface DeviceDetailModalProps {
  dispositivo: Dispositivo | null;
  open: boolean;
  onClose: () => void;
}

const periodos: { valor: PeriodoFiltro; label: string }[] = [
  { valor: '6h', label: '6 horas' },
  { valor: '12h', label: '12 horas' },
  { valor: '24h', label: '24 horas' },
  { valor: '3d', label: '3 dias' },
  { valor: '7d', label: '7 dias' },
  { valor: '30d', label: '30 dias' },
];

const DeviceDetailModal = ({ dispositivo, open, onClose }: DeviceDetailModalProps) => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('24h');
  const [grafico, setGrafico] = useState<'temperatura' | 'umidade' | 'ambos'>('ambos');

  const dados = useMemo(() => {
    if (!dispositivo) return [];
    return gerarHistoricoPorPeriodo(dispositivo.id, periodo);
  }, [dispositivo?.id, periodo]);

  const stats = useMemo(() => calcularEstatisticas(dados), [dados]);

  if (!dispositivo) return null;

  const exportarCSV = () => {
    const header = 'Data/Hora,Temperatura (°C),Umidade (%),Mínima Temp (°C),Máxima Temp (°C),Mín Umid (%),Máx Umid (%),Status\n';
    const linhas = dados.map(d => {
      const status = d.temperatura < TEMP_MIN || d.temperatura > TEMP_MAX ? 'ALERTA' : 'NORMAL';
      return `${d.hora},${d.temperatura},${d.umidade},${d.min},${d.max},${d.umidMin},${d.umidMax},${status}`;
    }).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + header + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dispositivo.nome.replace(/\s+/g, '_')}_${periodo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isAlerta = dispositivo.status === 'alerta';
  const isOffline = dispositivo.status === 'offline';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header colorido */}
        <div className={cn(
          'px-6 py-5 rounded-t-lg',
          isAlerta ? 'bg-destructive/10' : isOffline ? 'bg-muted' : 'bg-primary/5'
        )}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-xl',
                  isAlerta ? 'bg-destructive/15' : isOffline ? 'bg-offline/15' : 'bg-primary/15'
                )}>
                  <Thermometer className={cn(
                    'w-6 h-6',
                    isAlerta ? 'text-destructive' : isOffline ? 'text-offline' : 'text-primary'
                  )} />
                </div>
                <div>
                  <DialogTitle className="text-xl">{dispositivo.nome}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{dispositivo.localizacao} • {dispositivo.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {dispositivo.conexao === 'online' ? (
                  <Badge className="bg-success/15 text-success border-0 gap-1">
                    <Wifi className="w-3 h-3" /> Online
                  </Badge>
                ) : (
                  <Badge className="bg-offline/15 text-offline border-0 gap-1">
                    <WifiOff className="w-3 h-3" /> Offline
                  </Badge>
                )}
                {isAlerta && (
                  <Badge className="bg-destructive/15 text-destructive border-0 animate-pulse-alert gap-1">
                    <AlertTriangle className="w-3 h-3" /> ALERTA
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Temperatura e umidade atual */}
          {!isOffline && (
            <div className="mt-4 flex items-end gap-6">
              <div className="flex items-end gap-1">
                <Thermometer className="w-6 h-6 text-muted-foreground mb-1" />
                <span className={cn(
                  'text-5xl font-bold font-mono tracking-tight',
                  isAlerta ? 'text-destructive' : 'text-foreground'
                )}>
                  {dispositivo.temperaturaAtual.toFixed(1)}
                </span>
                <span className="text-2xl text-muted-foreground mb-1">°C</span>
              </div>
              <div className="flex items-end gap-1">
                <Droplets className="w-5 h-5 text-muted-foreground mb-1" />
                <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  {dispositivo.umidadeAtual.toFixed(1)}
                </span>
                <span className="text-lg text-muted-foreground mb-1">%</span>
              </div>
              <span className="text-sm text-muted-foreground mb-2 ml-2">
                Atualizado às {new Date(dispositivo.ultimaAtualizacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<TrendingDown className="w-4 h-4 text-primary" />} label="Mín. Temp" value={`${stats.minima}°C`} />
            <StatCard icon={<TrendingUp className="w-4 h-4 text-destructive" />} label="Máx. Temp" value={`${stats.maxima}°C`} />
            <StatCard icon={<Droplets className="w-4 h-4 text-primary/60" />} label="Méd. Umid" value={`${stats.mediaUmid}%`} />
            <StatCard
              icon={<ShieldCheck className="w-4 h-4 text-success" />}
              label="Conformidade"
              value={`${stats.conformidade}%`}
              highlight={stats.conformidade < 100}
            />
          </div>

          {/* Filtro de período + seletor de gráfico */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Período de análise</p>
              <Button variant="outline" size="sm" onClick={exportarCSV} className="gap-1.5">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex flex-wrap gap-2">
                {periodos.map((p) => (
                  <button
                    key={p.valor}
                    onClick={() => setPeriodo(p.valor)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      periodo === p.valor
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Tabs value={grafico} onValueChange={(v) => setGrafico(v as typeof grafico)}>
                <TabsList className="h-8">
                  <TabsTrigger value="ambos" className="text-xs px-2.5 h-6">Ambos</TabsTrigger>
                  <TabsTrigger value="temperatura" className="text-xs px-2.5 h-6">Temp.</TabsTrigger>
                  <TabsTrigger value="umidade" className="text-xs px-2.5 h-6">Umid.</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Gráfico */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">
              Variação — {periodos.find(p => p.valor === periodo)?.label}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dados} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(190, 70%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(190, 70%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="umidGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 70%, 50%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(210, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hora" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                
                {(grafico === 'temperatura' || grafico === 'ambos') && (
                  <YAxis yAxisId="temp" domain={[0, 12]} tick={{ fontSize: 11 }} stroke="hsl(190, 70%, 45%)" unit="°C" />
                )}
                {(grafico === 'umidade' || grafico === 'ambos') && (
                  <YAxis yAxisId="umid" orientation="right" domain={[20, 60]} tick={{ fontSize: 11 }} stroke="hsl(210, 70%, 50%)" unit="%" />
                )}

                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'temperatura') return [`${value}°C`, 'Temperatura'];
                    return [`${value}%`, 'Umidade'];
                  }}
                />
                <Legend formatter={(v) => v === 'temperatura' ? 'Temperatura (°C)' : 'Umidade (%)'} />

                {(grafico === 'temperatura' || grafico === 'ambos') && (
                  <>
                    <ReferenceLine yAxisId="temp" y={TEMP_MIN} stroke="hsl(205, 85%, 35%)" strokeDasharray="6 3" label={{ value: `Mín ${TEMP_MIN}°C`, position: 'insideTopLeft', fontSize: 10 }} />
                    <ReferenceLine yAxisId="temp" y={TEMP_MAX} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" label={{ value: `Máx ${TEMP_MAX}°C`, position: 'insideTopLeft', fontSize: 10 }} />
                    <Area
                      yAxisId="temp"
                      type="monotone"
                      dataKey="temperatura"
                      stroke="hsl(190, 70%, 45%)"
                      strokeWidth={2}
                      fill="url(#tempGradient)"
                      dot={{ r: 1.5, fill: 'hsl(190, 70%, 45%)' }}
                      activeDot={{ r: 5, fill: 'hsl(205, 85%, 35%)' }}
                    />
                  </>
                )}

                {(grafico === 'umidade' || grafico === 'ambos') && (
                  <>
                    <ReferenceLine yAxisId="umid" y={UMID_MIN} stroke="hsl(210, 50%, 60%)" strokeDasharray="4 3" />
                    <ReferenceLine yAxisId="umid" y={UMID_MAX} stroke="hsl(210, 50%, 60%)" strokeDasharray="4 3" />
                    <Area
                      yAxisId="umid"
                      type="monotone"
                      dataKey="umidade"
                      stroke="hsl(210, 70%, 50%)"
                      strokeWidth={1.5}
                      fill="url(#umidGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: 'hsl(210, 70%, 50%)' }}
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Info extra */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
            <span>{stats.totalLeituras} leituras no período</span>
            <span>{stats.excursoes} excursão(ões) térmica(s) detectada(s)</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 rounded-lg bg-muted/50 p-3 border',
      highlight && 'ring-1 ring-warning/40'
    )}>
      {icon}
      <div>
        <p className="text-lg font-bold font-mono text-foreground leading-tight">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default DeviceDetailModal;
