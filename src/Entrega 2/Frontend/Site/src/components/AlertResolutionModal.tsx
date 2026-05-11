import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Circle, FileDown, Thermometer, Clock, MapPin } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export interface AlertaResolvido {
  id: string;
  dispositivoNome: string;
  localizacao: string;
  temperatura: number;
  dataHora: string;
  parecer: string;
  resolvidoEm: string;
}

interface AlertResolutionModalProps {
  open: boolean;
  onClose: () => void;
  onResolved?: (resolved: AlertaResolvido) => void;
  dispositivoId: string;
  dispositivoNome: string;
  localizacao: string;
  temperatura: number;
  dataHora: string;
}

const POP_CHECKLIST = [
  'Inspeção visual do equipamento (portas e vedações) realizada.',
  'Avaliação da integridade física das embalagens/frascos.',
  'Ajuste de termostato ou acionamento de plano de contingência (caixas térmicas).',
];

const AlertResolutionModal = ({
  open,
  onClose,
  onResolved,
  dispositivoId,
  dispositivoNome,
  localizacao,
  temperatura,
  dataHora,
}: AlertResolutionModalProps) => {
  const [checked, setChecked] = useState<boolean[]>(POP_CHECKLIST.map(() => false));
  const [parecer, setParecer] = useState('');

  const allChecked = checked.every(Boolean);
  const parecerValido = parecer.trim().length >= 10;
  const podeEncerrar = allChecked && parecerValido;

  const toggleCheck = (index: number) => {
    setChecked(prev => prev.map((v, i) => (i === index ? !v : v)));
  };

  const handleEncerrar = () => {
    const resolvido: AlertaResolvido = {
      id: `${dispositivoId}-${Date.now()}`,
      dispositivoNome,
      localizacao,
      temperatura,
      dataHora,
      parecer: parecer.trim(),
      resolvidoEm: new Date().toLocaleString('pt-BR'),
    };
    onResolved?.(resolvido);
    toast.success('Ocorrência encerrada com sucesso!', {
      description: `Parecer registrado para ${dispositivoNome}.`,
    });
    setChecked(POP_CHECKLIST.map(() => false));
    setParecer('');
    onClose();
  };

  const handleExportPDF = () => {
    toast.info('Relatório PDF será gerado.', {
      description: 'Funcionalidade será conectada ao backend.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Resolução de Excursão Térmica
          </DialogTitle>
          <DialogDescription>
            Preencha o checklist POP e registre o parecer técnico para encerrar esta ocorrência.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo do sinistro */}
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-card-foreground">{dispositivoNome}</span>
            </div>
            <Badge className="bg-destructive/15 text-destructive border-0 text-base font-mono font-bold px-3">
              {temperatura.toFixed(1)}°C
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{localizacao}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{dataHora}</span>
          </div>
        </div>

        <Separator />

        {/* Checklist POP */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Checklist de Ações (POP)</h4>
          {POP_CHECKLIST.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleCheck(i)}
              className={`flex items-start gap-3 w-full text-left rounded-lg border p-3 transition-colors ${
                checked[i]
                  ? 'border-success/40 bg-success/5'
                  : 'border-border bg-card hover:bg-accent/50'
              }`}
            >
              {checked[i] ? (
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              )}
              <span className={`text-sm ${checked[i] ? 'text-foreground' : 'text-muted-foreground'}`}>
                {item}
              </span>
            </button>
          ))}
        </div>

        <Separator />

        {/* Parecer técnico */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Parecer Técnico</h4>
          <Textarea
            placeholder="Descreva a causa do problema e as ações corretivas tomadas..."
            value={parecer}
            onChange={(e) => setParecer(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          {parecer.length > 0 && parecer.trim().length < 10 && (
            <p className="text-xs text-destructive">Mínimo de 10 caracteres ({parecer.trim().length}/10)</p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
            <FileDown className="w-4 h-4" />
            Exportar Relatório (PDF)
          </Button>
          <Button
            disabled={!podeEncerrar}
            onClick={handleEncerrar}
            className={`gap-2 ${
              podeEncerrar
                ? 'bg-success hover:bg-success/90 text-success-foreground'
                : ''
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Encerrar Ocorrência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertResolutionModal;
