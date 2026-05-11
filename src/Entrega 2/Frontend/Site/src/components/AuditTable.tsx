import { FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { logsAuditoria } from '@/data/mockData';
import { toast } from 'sonner';

const AuditTable = () => {
  const handleExportPDF = () => {
    toast.success('Relatório PDF gerado com sucesso!', {
      description: 'Funcionalidade será conectada ao backend Python.',
    });
  };

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Logs de Auditoria</CardTitle>
            <p className="text-sm text-muted-foreground">Histórico de registros térmicos — Anvisa / Seguradoras</p>
          </div>
          <Button onClick={handleExportPDF} className="gap-2">
            <FileDown className="w-4 h-4" />
            Exportar Relatório PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead className="text-right">Temperatura</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsAuditoria.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.dataHora}</TableCell>
                  <TableCell className="font-medium">{log.dispositivoNome}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {log.temperatura.toFixed(1)}°C
                  </TableCell>
                  <TableCell>
                    {log.status === 'normal' ? (
                      <Badge className="bg-success/15 text-success hover:bg-success/25 border-0 text-xs">
                        NORMAL
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/25 border-0 text-xs">
                        ALERTA
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditTable;
