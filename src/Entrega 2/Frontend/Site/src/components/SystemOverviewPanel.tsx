import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TEMP_MIN, TEMP_MAX, UMID_MIN, UMID_MAX, logsAuditoria } from '@/data/mockData';

/**
 * Dados mock para o gráfico de tendência global.
 * TODO: Substituir por chamada à API REST (ex: GET /api/sistema/tendencia?periodo=6h)
 */
function gerarTendenciaGlobal() {
  const dados: { hora: string; temperatura: number; umidade: number }[] = [];
  const agora = new Date();
  for (let i = 24; i >= 0; i--) {
    const t = new Date(agora.getTime() - i * 15 * 60 * 1000);
    const temp = 3.5 + Math.random() * 3.5;
    const umid = 35 + Math.random() * 10;
    dados.push({
      hora: t.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      temperatura: parseFloat(temp.toFixed(1)),
      umidade: parseFloat(umid.toFixed(1)),
    });
  }
  return dados;
}

const SystemOverviewPanel = () => {
  const navigate = useNavigate();
  const dadosTendencia = useMemo(() => gerarTendenciaGlobal(), []);

  const alertasRecentes = logsAuditoria
    .filter(l => l.status === 'alerta')
    .slice(0, 3);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Gráfico de Tendência */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Tendência do Sistema (Últimas 6h)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosTendencia} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hora" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="temp" domain={[0, 12]} tick={{ fontSize: 10 }} stroke="hsl(190, 70%, 45%)" unit="°C" />
              <YAxis yAxisId="umid" orientation="right" domain={[20, 60]} tick={{ fontSize: 10 }} stroke="hsl(210, 70%, 50%)" unit="%" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'temperatura') return [`${value}°C`, 'Temperatura'];
                  return [`${value}%`, 'Umidade'];
                }}
              />
              <Legend formatter={(v) => v === 'temperatura' ? 'Temp. (°C)' : 'Umid. (%)'} />
              <ReferenceLine yAxisId="temp" y={TEMP_MIN} stroke="hsl(var(--primary))" strokeDasharray="6 3" />
              <ReferenceLine yAxisId="temp" y={TEMP_MAX} stroke="hsl(var(--destructive))" strokeDasharray="6 3" />
              <ReferenceLine yAxisId="umid" y={UMID_MIN} stroke="hsl(210, 50%, 60%)" strokeDasharray="4 3" strokeOpacity={0.5} />
              <ReferenceLine yAxisId="umid" y={UMID_MAX} stroke="hsl(210, 50%, 60%)" strokeDasharray="4 3" strokeOpacity={0.5} />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temperatura"
                stroke="hsl(190, 70%, 45%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
              />
              <Line
                yAxisId="umid"
                type="monotone"
                dataKey="umidade"
                stroke="hsl(210, 70%, 50%)"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="5 2"
                activeDot={{ r: 4, fill: 'hsl(210, 70%, 50%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Coluna 2: Alertas Recentes */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Últimas Ocorrências</h3>
          </div>

          {alertasRecentes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-9">Dispositivo</TableHead>
                  <TableHead className="text-xs h-9">Temp.</TableHead>
                  <TableHead className="text-xs h-9">Umid.</TableHead>
                  <TableHead className="text-xs h-9">Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertasRecentes.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs py-2 font-medium">{a.dispositivoNome}</TableCell>
                    <TableCell className="text-xs py-2 font-mono text-destructive font-semibold">{a.temperatura}°C</TableCell>
                    <TableCell className="text-xs py-2 font-mono text-muted-foreground">{a.umidade}%</TableCell>
                    <TableCell className="text-xs py-2 text-muted-foreground">
                      {a.dataHora.split(' ')[1]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum alerta recente.</p>
          )}

          <button
            onClick={() => navigate('/alertas')}
            className="mt-3 text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
          >
            Ver todo o histórico →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemOverviewPanel;
