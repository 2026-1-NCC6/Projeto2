import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { gerarHistorico24h, dispositivos, TEMP_MIN, TEMP_MAX, UMID_MIN, UMID_MAX } from '@/data/mockData';
import { useState } from 'react';

const TemperatureChart = () => {
  const [dispositivoSelecionado, setDispositivoSelecionado] = useState(dispositivos[0].id);
  const [grafico, setGrafico] = useState<'temperatura' | 'umidade' | 'ambos'>('ambos');
  const dados = gerarHistorico24h(dispositivoSelecionado);
  const nomeDispositivo = dispositivos.find(d => d.id === dispositivoSelecionado)?.nome || '';

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg">Variação Térmica e Umidade — Últimas 24h</CardTitle>
          <div className="flex gap-2">
            <Select value={dispositivoSelecionado} onValueChange={setDispositivoSelecionado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dispositivos.filter(d => d.conexao === 'online').map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground mr-2">{nomeDispositivo}</p>
          <Tabs value={grafico} onValueChange={(v) => setGrafico(v as typeof grafico)}>
            <TabsList className="h-8">
              <TabsTrigger value="ambos" className="text-xs px-2.5 h-6">Ambos</TabsTrigger>
              <TabsTrigger value="temperatura" className="text-xs px-2.5 h-6">Temperatura</TabsTrigger>
              <TabsTrigger value="umidade" className="text-xs px-2.5 h-6">Umidade</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={dados} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="hora" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            
            {/* Eixo Y esquerdo: Temperatura */}
            {(grafico === 'temperatura' || grafico === 'ambos') && (
              <YAxis yAxisId="temp" domain={[0, 12]} tick={{ fontSize: 11 }} stroke="hsl(190, 70%, 45%)" unit="°C" />
            )}
            
            {/* Eixo Y direito: Umidade */}
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
                if (name === 'umidade') return [`${value}%`, 'Umidade'];
                return [value, name];
              }}
            />
            <Legend formatter={(value) => value === 'temperatura' ? 'Temperatura (°C)' : 'Umidade (%)'} />

            {/* Limites temperatura */}
            {(grafico === 'temperatura' || grafico === 'ambos') && (
              <>
                <ReferenceLine yAxisId="temp" y={TEMP_MIN} stroke="hsl(205, 85%, 35%)" strokeDasharray="6 3" label={{ value: `Mín ${TEMP_MIN}°C`, position: 'left', fontSize: 10 }} />
                <ReferenceLine yAxisId="temp" y={TEMP_MAX} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" label={{ value: `Máx ${TEMP_MAX}°C`, position: 'left', fontSize: 10 }} />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temperatura"
                  stroke="hsl(190, 70%, 45%)"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: 'hsl(190, 70%, 45%)' }}
                  activeDot={{ r: 5, fill: 'hsl(205, 85%, 35%)' }}
                />
              </>
            )}

            {/* Limites umidade */}
            {(grafico === 'umidade' || grafico === 'ambos') && (
              <>
                <ReferenceLine yAxisId="umid" y={UMID_MIN} stroke="hsl(210, 50%, 60%)" strokeDasharray="4 3" />
                <ReferenceLine yAxisId="umid" y={UMID_MAX} stroke="hsl(210, 50%, 60%)" strokeDasharray="4 3" />
                <Line
                  yAxisId="umid"
                  type="monotone"
                  dataKey="umidade"
                  stroke="hsl(210, 70%, 50%)"
                  strokeWidth={2}
                  dot={{ r: 2, fill: 'hsl(210, 70%, 50%)' }}
                  activeDot={{ r: 5, fill: 'hsl(210, 80%, 40%)' }}
                  strokeDasharray="5 2"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TemperatureChart;
