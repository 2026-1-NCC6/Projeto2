import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Clock, Thermometer, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dispositivos as dispositivosBase, logsAuditoria, TEMP_MIN, TEMP_MAX } from '@/data/mockData';
import AlertResolutionModal, { type AlertaResolvido } from '@/components/AlertResolutionModal';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

const Alertas = () => {
  const navigate = useNavigate();
  const [filtroDispositivo, setFiltroDispositivo] = useState<string>('todos');
  const [resolverAlerta, setResolverAlerta] = useState<{
    id: string; nome: string; localizacao: string; temperatura: number; dataHora: string;
  } | null>(null);

  // IDs de dispositivos resolvidos na sessão
  const [idsResolvidos, setIdsResolvidos] = useState<Set<string>>(new Set());
  const [alertasResolvidos, setAlertasResolvidos] = useState<AlertaResolvido[]>([]);

  // Dispositivos com alerta ativo (excluindo resolvidos)
  const dispositivosComAlerta = dispositivosBase.filter(
    d => (d.status === 'alerta' || d.temperaturaAtual < TEMP_MIN || d.temperaturaAtual > TEMP_MAX)
      && d.status !== 'offline'
      && !idsResolvidos.has(d.id)
  );

  // Logs de alerta pendentes
  const alertasLog = logsAuditoria.filter(l => l.status === 'alerta');
  const alertasFiltrados = filtroDispositivo === 'todos'
    ? alertasLog
    : alertasLog.filter(a => a.dispositivoId === filtroDispositivo);

  // Dispositivos que tiveram alertas
  const dispositivosComHistoricoAlerta = useMemo(() =>
    dispositivosBase.filter(d => logsAuditoria.some(l => l.dispositivoId === d.id && l.status === 'alerta')),
    []
  );

  // Gerar timeline de temperatura (últimas 24h) para dispositivos com alerta
  const dadosTimeline = useMemo(() => {
    const horas: string[] = [];
    const agora = new Date();
    for (let i = 23; i >= 0; i--) {
      const h = new Date(agora.getTime() - i * 60 * 60 * 1000);
      horas.push(h.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
    return horas.map((hora, idx) => {
      const ponto: Record<string, string | number> = { hora };
      dispositivosComHistoricoAlerta.forEach(d => {
        const base = 5 + Math.sin(idx * 0.3) * 2;
        const isExcursao = d.id === 'esp32-003' && idx > 16;
        const temp = isExcursao ? 8.5 + Math.random() * 2.5 : base + (Math.random() - 0.5);
        ponto[d.id] = parseFloat(temp.toFixed(1));
      });
      return ponto;
    });
  }, [dispositivosComHistoricoAlerta]);

  const CORES_DISPOSITIVOS: Record<string, string> = {
    'esp32-003': 'hsl(0, 72%, 51%)',
    'esp32-001': 'hsl(210, 70%, 50%)',
    'esp32-002': 'hsl(150, 60%, 40%)',
    'esp32-004': 'hsl(35, 80%, 50%)',
    'esp32-005': 'hsl(270, 50%, 55%)',
  };

  const totalPendentes = dispositivosComAlerta.length;

  const handleResolved = (resolvido: AlertaResolvido) => {
    if (resolverAlerta) {
      setIdsResolvidos(prev => new Set(prev).add(resolverAlerta.id));
    }
    setAlertasResolvidos(prev => [resolvido, ...prev]);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Central de Alertas
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {totalPendentes > 0 && (
            <Badge className="bg-destructive/15 text-destructive border-0 animate-pulse-alert">
              {totalPendentes} pendente{totalPendentes > 1 ? 's' : ''}
            </Badge>
          )}
          {alertasResolvidos.length > 0 && (
            <Badge className="bg-success/15 text-success border-0">
              {alertasResolvidos.length} resolvido{alertasResolvidos.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pendentes">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="pendentes" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Pendentes ({totalPendentes})
          </TabsTrigger>
          <TabsTrigger value="resolvidos" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Resolvidos ({alertasResolvidos.length})
          </TabsTrigger>
        </TabsList>

        {/* ====== ABA PENDENTES ====== */}
        <TabsContent value="pendentes" className="space-y-6 mt-4">
          {totalPendentes === 0 && alertasLog.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 text-success" />
                  <p className="text-lg font-medium">Nenhum alerta pendente</p>
                  <p className="text-sm">Todos os dispositivos estão operando dentro da faixa segura.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Dispositivos em alerta */}
              {totalPendentes > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dispositivosComAlerta.map(d => (
                    <Card key={d.id} className="ring-2 ring-destructive/40">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-card-foreground">{d.nome}</p>
                            <p className="text-xs text-muted-foreground">{d.localizacao}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold font-mono text-destructive">
                              {d.temperaturaAtual.toFixed(1)}°C
                            </span>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(d.ultimaAtualizacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() => setResolverAlerta({
                            id: d.id,
                            nome: d.nome,
                            localizacao: d.localizacao,
                            temperatura: d.temperaturaAtual,
                            dataHora: new Date(d.ultimaAtualizacao).toLocaleString('pt-BR'),
                          })}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Resolver
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {totalPendentes === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-10 h-10 text-success" />
                      <p className="font-medium">Todos os alertas ativos foram resolvidos!</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Gráfico Timeline */}
              {dispositivosComHistoricoAlerta.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-destructive" />
                      Alertas por Dispositivo — Últimas 24h
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Temperatura ao longo do tempo. Linhas tracejadas indicam os limites da faixa segura ({TEMP_MIN}°C – {TEMP_MAX}°C).
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <ComposedChart data={dadosTimeline} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="hora"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          interval={3}
                        />
                        <YAxis
                          domain={[0, 14]}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          unit="°C"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '13px',
                          }}
                          formatter={(value: number, name: string) => {
                            const disp = dispositivosBase.find(d => d.id === name);
                            return [`${value}°C`, disp?.nome || name];
                          }}
                        />
                        <Legend
                          formatter={(value: string) => {
                            const disp = dispositivosBase.find(d => d.id === value);
                            return disp?.nome || value;
                          }}
                        />
                        <ReferenceLine
                          y={TEMP_MIN}
                          stroke="hsl(var(--destructive))"
                          strokeDasharray="6 3"
                          strokeOpacity={0.6}
                          label={{ value: `Mín ${TEMP_MIN}°C`, position: 'insideTopLeft', fontSize: 10, fill: 'hsl(var(--destructive))' }}
                        />
                        <ReferenceLine
                          y={TEMP_MAX}
                          stroke="hsl(var(--destructive))"
                          strokeDasharray="6 3"
                          strokeOpacity={0.6}
                          label={{ value: `Máx ${TEMP_MAX}°C`, position: 'insideTopLeft', fontSize: 10, fill: 'hsl(var(--destructive))' }}
                        />
                        {dispositivosComHistoricoAlerta.map(d => (
                          <Line
                            key={d.id}
                            type="monotone"
                            dataKey={d.id}
                            stroke={CORES_DISPOSITIVOS[d.id] || 'hsl(var(--primary))'}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        ))}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Histórico */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Histórico de Alertas
                    </CardTitle>
                    <Select value={filtroDispositivo} onValueChange={setFiltroDispositivo}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar dispositivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os dispositivos</SelectItem>
                        {dispositivosBase.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alertasFiltrados.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Nenhum alerta para este dispositivo.
                      </p>
                    ) : (
                      alertasFiltrados.map(a => (
                        <div key={a.id} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-card-foreground">{a.dispositivoNome}</p>
                              <p className="text-xs text-muted-foreground">{a.dataHora}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold font-mono text-destructive">
                              {a.temperatura.toFixed(1)}°C
                            </span>
                            <p className="text-xs font-mono text-muted-foreground">{a.umidade.toFixed(1)}%</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ====== ABA RESOLVIDOS ====== */}
        <TabsContent value="resolvidos" className="space-y-4 mt-4">
          {alertasResolvidos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <FileText className="w-12 h-12" />
                  <p className="text-lg font-medium">Nenhuma ocorrência resolvida</p>
                  <p className="text-sm">As ocorrências encerradas aparecerão aqui com o parecer técnico.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            alertasResolvidos.map(r => (
              <Card key={r.id} className="border-success/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <div>
                        <p className="font-semibold text-card-foreground">{r.dispositivoNome}</p>
                        <p className="text-xs text-muted-foreground">{r.localizacao}</p>
                      </div>
                    </div>
                    <Badge className="bg-success/15 text-success border-0 font-mono">
                      {r.temperatura.toFixed(1)}°C
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>🕐 Ocorrência: {r.dataHora}</span>
                    <span>✅ Resolvido: {r.resolvidoEm}</span>
                  </div>

                  <div className="rounded-lg bg-muted/50 border p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Parecer Técnico:</p>
                    <p className="text-sm text-foreground">{r.parecer}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de resolução */}
      <AlertResolutionModal
        open={!!resolverAlerta}
        onClose={() => setResolverAlerta(null)}
        onResolved={handleResolved}
        dispositivoId={resolverAlerta?.id ?? ''}
        dispositivoNome={resolverAlerta?.nome ?? ''}
        localizacao={resolverAlerta?.localizacao ?? ''}
        temperatura={resolverAlerta?.temperatura ?? 0}
        dataHora={resolverAlerta?.dataHora ?? ''}
      />
    </div>
  );
};

export default Alertas;
