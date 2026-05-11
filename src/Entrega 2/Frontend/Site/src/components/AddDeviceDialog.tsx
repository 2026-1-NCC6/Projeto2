import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cadastrarDispositivo } from '@/services/deviceApi';

interface AddDeviceDialogProps {
  onAdded?: () => void;
}

/**
 * Modal de cadastro de nova placa ESP32.
 * 👉 A persistência acontece em `services/deviceApi.ts`,
 *    onde também está documentado o endpoint real da API (POST /dispositivos).
 */
const AddDeviceDialog = ({ onAdded }: AddDeviceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState('');
  const [nome, setNome] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setId('');
    setNome('');
    setLocalizacao('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !nome.trim() || !localizacao.trim()) return;

    setLoading(true);
    try {
      await cadastrarDispositivo({
        id: id.trim(),
        nome: nome.trim(),
        localizacao: localizacao.trim(),
      });
      toast({
        title: 'Placa cadastrada com sucesso',
        description: `${nome} foi adicionada ao sistema. Aguardando primeira leitura...`,
      });
      reset();
      setOpen(false);
      onAdded?.();
    } catch (err) {
      toast({
        title: 'Erro ao cadastrar',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Cadastrar placa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar nova placa ESP32</DialogTitle>
          <DialogDescription>
            Informe os dados da placa. Após o cadastro, ela aparecerá como{' '}
            <span className="font-semibold text-offline">offline</span> até enviar a primeira leitura.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="dev-id">ID da placa *</Label>
            <Input
              id="dev-id"
              placeholder="esp32-006"
              value={id}
              onChange={e => setId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              ID único enviado pelo firmware da placa (MAC ou identificador customizado).
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dev-nome">Nome amigável *</Label>
            <Input
              id="dev-nome"
              placeholder="Geladeira 05"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dev-loc">Localização *</Label>
            <Input
              id="dev-loc"
              placeholder="Sala de Vacinação"
              value={localizacao}
              onChange={e => setLocalizacao(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDeviceDialog;
