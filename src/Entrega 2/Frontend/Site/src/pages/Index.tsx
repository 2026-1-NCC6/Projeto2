import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Thermometer, AlertTriangle, Wifi, WifiOff, Activity } from 'lucide-react';
import DeviceCard from '@/components/DeviceCard';
import DeviceDetailModal from '@/components/DeviceDetailModal';
import DeviceListModal from '@/components/DeviceListModal';
import AddDeviceDialog from '@/components/AddDeviceDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { type Dispositivo } from '@/data/mockData';
import { getDispositivosSnapshot, subscribeDispositivos, listarDispositivos } from '@/services/deviceApi';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Estados da interface
  const [selectedDevice, setSelectedDevice] = useState<Dispositivo | null>(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>(getDispositivosSnapshot());
  
  // Estados do Gráfico
  const [historicoFlat, setHistoricoFlat] = useState<any[]>([]); // Guarda todos os dados (Reais + Exemplos)
  const [dadosGraficoFormatados, setDadosGraficoFormatados] = useState<any[]>([]);
  const [dispositivoGrafico, setDispositivoGrafico] = useState<string>('todos');
  const [filtroTempo, setFiltroTempo] = useState<string>('1h'); // NOVO: Filtro de tempo

  // Ref para manter o histórico dos dispositivos de exemplo rodando em background
  const mockHistoryRef = useRef<any[]>([]);

  useEffect(() => {
    // 1. Gera 24h de histórico estático para os exemplos caso ainda não exista
    if (mockHistoryRef.current.length === 0) {
      const initialMock = [];
      const now = Date.now();
      for (let i = 24 * 60; i >= 0; i -= 2) { // 1 leitura a cada 2 min nas últimas 24h
        const time = new Date(now - i * 60 * 1000).toISOString();
        initialMock.push({ dispositivo: 'mock_01', horario: time, temperatura: Number((4 + Math.random() * 1.5).toFixed(1)) });
        initialMock.push({ dispositivo: 'mock_02', horario: time, temperatura: Number((5 + Math.random() * 2).toFixed(1)) });
        initialMock.push({ dispositivo: 'mock_03', horario: time, temperatura: Number((3 + Math.random() * 1.2).toFixed(1)) });
      }
      mockHistoryRef.current = initialMock;
    }

    // Função Principal de Busca de Dados
    const buscarDadosDaAPI = async () => {
      try {
        const timeNow = new Date().toISOString();
        const agora = new Date().getTime();

        // 2. Busca e Mapeia Dispositivo Real (Com Lógica Online/Offline real)
        const dadosReais = await listarDispositivos();
        const dadosMapeadosReais = dadosReais.map(d => {
          const tempoDesdeUltimaLeitura = agora - new Date(d.ultimaAtualizacao).getTime();
          const isOnline = tempoDesdeUltimaLeitura < 15000; // 15 segundos sem leitura = Offline
          return {
            ...d,
            nome: d.id === 'geladeira_01' ? 'Caixa Térmica Alpha' : d.nome,
            localizacao: d.id === 'geladeira_01' ? 'Empresa A | Téc: Carlos' : 'Empresa Parceira',
            conexao: isOnline ? 'online' : 'offline'
          };
        });

        // 3. Cria pontos atuais e cards para os 3 Dispositivos de Exemplo
        const m1Temp = Number((4 + Math.random() * 1.5).toFixed(1));
        const m2Temp = Number((5 + Math.random() * 2).toFixed(1));
        const m3Temp = Number((3 + Math.random() * 1.2).toFixed(1));

        // Adiciona a leitura atual no histórico de exemplos
        mockHistoryRef.current = [
          ...mockHistoryRef.current,
          { dispositivo: 'mock_01', horario: timeNow, temperatura: m1Temp },
          { dispositivo: 'mock_02', horario: timeNow, temperatura: m2Temp },
          { dispositivo: 'mock_03', horario: timeNow, temperatura: m3Temp }
        ];

        const cardsExemplo: Dispositivo[] = [
          { id: 'mock_01', nome: 'Caixa Exemplo 1', localizacao: 'Empresa B | Téc: Ana', temperaturaAtual: m1Temp, umidadeAtual: 45, status: 'normal', conexao: 'online', ultimaAtualizacao: timeNow },
          { id: 'mock_02', nome: 'Caixa Exemplo 2', localizacao: 'Empresa C | Téc: João', temperaturaAtual: m2Temp, umidadeAtual: 50, status: 'normal', conexao: 'online', ultimaAtualizacao: timeNow },
          { id: 'mock_03', nome: 'Caixa Exemplo 3', localizacao: 'Empresa D | Téc: Maria', temperaturaAtual: m3Temp, umidadeAtual: 55, status: 'normal', conexao: 'online', ultimaAtualizacao: timeNow }
        ];

        // Atualiza a interface com reais e exemplos
        setDispositivos([...dadosMapeadosReais, ...cardsExemplo]);

        // 4. Busca histórico do Banco de Dados real
        const res = await fetch(`${API_URL}/temperaturas`);
        const dadosHistoricoReais = await res.json();
        
        // 5. Junta histórico real com o histórico dos exemplos e salva
        if (dadosHistoricoReais && dadosHistoricoReais.length > 0) {
          const historiaRevertida = dadosHistoricoReais.reverse(); // Deixa o mais antigo pro mais novo
          setHistoricoFlat([...historiaRevertida, ...mockHistoryRef.current]);
        } else {
          setHistoricoFlat([...mockHistoryRef.current]);
        }

      } catch (erro) {
        console.error("Erro ao puxar dados no Dashboard:", erro);
      }
    };

    buscarDadosDaAPI();
    const timerAtualizacao = setInterval(buscarDadosDaAPI, 3000);
    const unsubscribe = subscribeDispositivos(() => setDispositivos([...getDispositivosSnapshot()]));

    return () => {
      clearInterval(timerAtualizacao);
      unsubscribe();
    };
  }, []);

  // 6. Efeito para Processar o Gráfico Sempre que os Filtros ou Dados Mudarem
  useEffect(() => {
    if (historicoFlat.length === 0) return;

    const agora = Date.now();
    let limiteTempo = 0;
    
    // Filtro de tempo em milissegundos
    switch(filtroTempo) {
      case '15m': limiteTempo = agora - (15 * 60 * 1000); break;
      case '1h':  limiteTempo = agora - (60 * 60 * 1000); break;
      case '6h':  limiteTempo = agora - (6 * 60 * 60 * 1000); break;
      case '24h': limiteTempo = agora - (24 * 60 * 60 * 1000); break;
    }

    // Aplica o filtro de período de tempo
    const dadosNoPeriodo = historicoFlat.filter(d => new Date(d.horario).getTime() >= limiteTempo);

    // Agrupa os dados por minuto para renderizar as múltiplas linhas no Recharts perfeitamente
    const dadosAgrupados: any = {};
    dadosNoPeriodo.forEach(d => {
      // Arredonda para o minuto exato para alinhar os pontos dos dispositivos diferentes
      const dataObj = new Date(d.horario);
      dataObj.setSeconds(0, 0); 
      const timeKey = dataObj.toISOString();

      if (!dadosAgrupados[timeKey]) {
        dadosAgrupados[timeKey] = {
          timeOriginal: timeKey,
          horario: dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
        };
      }
      dadosAgrupados[timeKey][d.dispositivo] = d.temperatura;
    });

    const arrayFinal = Object.values(dadosAgrupados).sort((a: any, b: any) => 
      new Date(a.timeOriginal).getTime() - new Date(b.timeOriginal).getTime()
    );

    setDadosGraficoFormatados(arrayFinal);
  }, [historicoFlat, filtroTempo, dispositivoGrafico]);

  const totalOnline = dispositivos.filter(d => d.conexao === 'online').length;
  const totalAlertas = dispositivos.filter(d => d.status === 'error' || d.status === 'alerta').length;

  // Paleta de cores para o gráfico
  const coresGrafico = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      
      {/* Cards principais (Contadores) */}
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
              <p className="text-sm font-medium text-muted-foreground">Cargas Monitoradas</p>
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
                {totalAlertas > 0 ? 'Sinistros Ativos' : 'Rotas Seguras'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Online / Offline Real */}
      <div className="flex items-center justify-center gap-8 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col items-center gap-1">
          <Wifi className="w-5 h-5 text-success" />
          <span className="text-2xl font-bold font-mono text-foreground">{totalOnline}</span>
          <span className="text-xs text-muted-foreground">Em Trânsito (Online)</span>
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="flex flex-col items-center gap-1">
          <WifiOff className="w-5 h-5 text-offline" />
          <span className="text-2xl font-bold font-mono text-foreground">{dispositivos.length - totalOnline}</span>
          <span className="text-xs text-muted-foreground">Sinal Perdido (Offline)</span>
        </div>
      </div>

      {/* GRÁFICO FUNCIONAL COM FILTROS DE TEMPO E DISPOSITIVO */}
      {dadosGraficoFormatados.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <CardTitle className="text-base flex items-center gap-2 w-full sm:w-auto">
                <Activity className="w-5 h-5 text-primary" />
                Telemetria Multi-Rotas em Tempo Real
              </CardTitle>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* NOVO: Filtro de Período (Tempo) */}
                <Select value={filtroTempo} onValueChange={setFiltroTempo}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15m">Últimos 15 Min</SelectItem>
                    <SelectItem value="1h">Última 1 Hora</SelectItem>
                    <SelectItem value="6h">Últimas 6 Horas</SelectItem>
                    <SelectItem value="24h">Últimas 24 Horas</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro de Equipamento */}
                <Select value={dispositivoGrafico} onValueChange={setDispositivoGrafico}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar Equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Frota Completa</SelectItem>
                    {dispositivos.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGraficoFormatados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="horario" tick={{fontSize: 11}} />
                  <YAxis domain={[0, 15]} tick={{fontSize: 11}} unit="°C" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <ReferenceLine y={8} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Máx 8°C', fill: 'hsl(var(--destructive))', fontSize: 10 }} />
                  <ReferenceLine y={2} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Mín 2°C', fill: 'hsl(var(--destructive))', fontSize: 10 }} />
                  
                  {/* Renderiza as linhas dinamicamente baseado na seleção */}
                  {dispositivos.map((d, index) => {
                    if (dispositivoGrafico !== 'todos' && d.id !== dispositivoGrafico) return null;
                    return (
                      <Line 
                        key={d.id}
                        type="monotone" 
                        dataKey={d.id === 'geladeira_01' ? 'geladeira_01' : d.id} 
                        name={d.nome}
                        stroke={coresGrafico[index % coresGrafico.length]} 
                        strokeWidth={3} 
                        dot={false}
                        connectNulls={true}
                        activeDot={{ r: 6 }} 
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Dispositivos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Relatório de Rastreamento (Unidades)</h2>
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

export default Dashboard;