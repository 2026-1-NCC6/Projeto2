import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Clock, Thermometer, ShieldCheck, CheckCircle2, FileText, Activity, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TEMP_MIN, TEMP_MAX } from '@/data/mockData';
import AlertResolutionModal, { type AlertaResolvido } from '@/components/AlertResolutionModal';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Area, AreaChart } from 'recharts';
import { listarDispositivos, type Dispositivo } from '@/services/deviceApi';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Alertas = () => {
  const navigate = useNavigate();
  const [filtroDispositivo, setFiltroDispositivo] = useState<string>('todos');
  
  // Estados para os dados reais
  const [dispositivosReal, setDispositivosReal] = useState<Dispositivo[]>([]);
  const [historicoAlertas, setHistoricoAlertas] = useState<any[]>([]);
  const [dadosCompletosParaGrafico, setDadosCompletosParaGrafico] = useState<any[]>([]);

  // Estados de controle de resolução e modal
  const [resolverAlerta, setResolverAlerta] = useState<any | null>(null);
  const [alertaSelecionado, setAlertaSelecionado] = useState<any | null>(null); 
  const [idsResolvidos, setIdsResolvidos] = useState<Set<string>>(new Set());
  const [alertasResolvidos, setAlertasResolvidos] = useState<AlertaResolvido[]>([]);

  // Motor que busca dados da API
  useEffect(() => {
    const buscarDados = async () => {
      try {
        // 1. Busca status atual
        const dados = await listarDispositivos();
        
        // Aplica lógica de Offline e Rebranding Logístico
        const agora = new Date().getTime();
        const dadosMapeados = dados.map(d => {
          const tempoDesdeUltimaLeitura = agora - new Date(d.ultimaAtualizacao).getTime();
          const isOnline = tempoDesdeUltimaLeitura < 15000;

          return {
            ...d,
            nome: d.id === 'geladeira_01' ? 'Caixa Térmica Alpha' : d.nome,
            localizacao: d.id === 'geladeira_01' ? 'Empresa A | Téc: Carlos' : 'Empresa Parceira',
            conexao: isOnline ? 'online' : 'offline'
          };
        });
        
        setDispositivosReal(dadosMapeados);

        // 2. Busca todo o histórico para a tabela e gráficos
        const res = await fetch(`${API_URL}/temperaturas`);
        const todosDados = await res.json();
        
        if (todosDados && todosDados.length > 0) {
          // Salva tudo para gerar os gráficos
          setDadosCompletosParaGrafico(todosDados.reverse()); 

          // Filtra apenas os registros que foram alertas para a aba de Histórico
          const apenasAlertas = todosDados.filter((d: any) => 
            d.status === 'ALERTA' || d.temperatura < TEMP_MIN || d.temperatura > TEMP_MAX
          );
          // Ordena do mais recente para o mais antigo
          setHistoricoAlertas(apenasAlertas.sort((a: any, b: any) => new Date(b.horario).getTime() - new Date(a.horario).getTime()));
        }
      } catch (error) {
        console.error("Erro ao buscar dados de alerta:", error);
      }
    };

    buscarDados();
    const timer = setInterval(buscarDados, 3000);
    return () => clearInterval(timer);
  }, []);

  // Filtros para a tela
  const dispositivosComAlerta = dispositivosReal.filter(
    d => (d.status === 'alerta' || d.status === 'error' || d.temperaturaAtual < TEMP_MIN || d.temperaturaAtual > TEMP_MAX)
      && d.conexao !== 'offline'
      && !idsResolvidos.has(d.id)
  );

  const alertasFiltrados = filtroDispositivo === 'todos'
    ? historicoAlertas
    : historicoAlertas.filter(a => a.dispositivo === filtroDispositivo);

  const totalPendentes = dispositivosComAlerta.length;

  const handleResolved = (resolvido: AlertaResolvido) => {
    if (resolverAlerta) {
      setIdsResolvidos(prev => new Set(prev).add(resolverAlerta.id));
    }
    setAlertasResolvidos(prev => [resolvido, ...prev]);
  };

  const getResolucaoDoAlerta = (horarioAlerta: string) => {
    return alertasResolvidos.find(r => r.dataHora === horarioAlerta);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Central de Alertas Operacionais
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

        <TabsContent value="pendentes" className="space-y-6 mt-4">
          
          {totalPendentes === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 text-success" />
                  <p className="text-lg font-medium">Nenhum alerta pendente</p>
                  <p className="text-sm">Todos os transportes estão operando na faixa segura.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
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
                          {new Date(d.ultimaAtualizacao).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => setResolverAlerta({
                        id: d.id, nome: d.nome, localizacao: d.localizacao || 'Desconhecida',
                        temperatura: d.temperaturaAtual, dataHora: new Date(d.ultimaAtualizacao).toLocaleString('pt-BR'),
                      })}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Resolver Alerta
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Histórico Real de Alertas
                </CardTitle>
                <Select value={filtroDispositivo} onValueChange={setFiltroDispositivo}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar caixa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Toda a Frota</SelectItem>
                    <SelectItem value="geladeira_01">Caixa Térmica Alpha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertasFiltrados.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum alerta logístico registrado no banco de dados.
                  </p>
                ) : (
                  alertasFiltrados.map((a, index) => (
                    <div 
                      key={index} 
                      onClick={() => setAlertaSelecionado(a)}
                      className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4 cursor-pointer hover:bg-destructive/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-destructive/15 rounded-full">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-card-foreground">
                            {a.dispositivo === 'geladeira_01' ? 'Caixa Térmica Alpha' : a.dispositivo}
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(a.horario).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold font-mono text-destructive">
                          {a.temperatura.toFixed(1)}°C
                        </span>
                        <p className="text-xs font-mono text-muted-foreground">Umid: {a.umidade.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolvidos" className="space-y-4 mt-4">
           {alertasResolvidos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <FileText className="w-12 h-12" />
                  <p className="text-lg font-medium">Nenhum alerta resolvido</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            alertasResolvidos.map((r, idx) => (
              <Card key={idx} className="border-success/30">
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

      {alertaSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-3xl rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-destructive/15 rounded-lg">
                  <Activity className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Relatório de Quebra Térmica</h3>
                  <p className="text-sm text-muted-foreground">
                    Incidente logístico em {new Date(alertaSelecionado.horario).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setAlertaSelecionado(null)}>
                <X className="w-6 h-6 text-muted-foreground" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <p className="text-xs text-muted-foreground mb-1">Carga Sensível</p>
                  <p className="font-semibold">{alertaSelecionado.dispositivo === 'geladeira_01' ? 'Caixa Térmica Alpha (Empresa A)' : alertaSelecionado.dispositivo}</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-destructive/80 mb-1">Pico de Temperatura</p>
                  <p className="text-2xl font-mono font-bold text-destructive">{alertaSelecionado.temperatura.toFixed(1)}°C</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <p className="text-xs text-muted-foreground mb-1">Umidade Relativa</p>
                  <p className="text-xl font-mono font-semibold">{alertaSelecionado.umidade.toFixed(1)}%</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <p className="text-xs text-muted-foreground mb-1">Status de Resolução</p>
                  {getResolucaoDoAlerta(new Date(alertaSelecionado.horario).toLocaleString('pt-BR')) ? (
                     <Badge className="bg-success text-white">Resolvido</Badge>
                  ) : (
                     <Badge variant="outline" className="text-destructive border-destructive/50">Ação Pendente</Badge>
                  )}
                </div>
              </div>

              <div className="rounded-xl border p-4 bg-background">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Thermometer className="w-4 h-4" /> Comportamento Térmico no Período
                </h4>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosCompletosParaGrafico.slice(-20)} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="horario" 
                        tickFormatter={(timeStr) => new Date(timeStr).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} 
                        tick={{fontSize: 10}}
                      />
                      <YAxis domain={[0, 15]} tick={{fontSize: 10}} />
                      <Tooltip 
                        labelFormatter={(timeStr) => new Date(timeStr).toLocaleString('pt-BR')}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                      />
                      <ReferenceLine y={TEMP_MAX} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Máx 8°C', fill: 'hsl(var(--destructive))', fontSize: 10 }} />
                      <ReferenceLine y={TEMP_MIN} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Mín 2°C', fill: 'hsl(var(--destructive))', fontSize: 10 }} />
                      <Area type="monotone" dataKey="temperatura" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorTemp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {getResolucaoDoAlerta(new Date(alertaSelecionado.horario).toLocaleString('pt-BR')) && (
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-sm font-semibold text-success mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Ação Realizada:
                  </p>
                  <p className="text-sm text-foreground">
                    {getResolucaoDoAlerta(new Date(alertaSelecionado.horario).toLocaleString('pt-BR'))?.parecer}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Alertas;