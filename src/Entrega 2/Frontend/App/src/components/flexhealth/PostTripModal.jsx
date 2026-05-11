import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PostTripModal({ open, onClose, onSubmit }) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onSubmit(notes);
    setSaving(false);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle className="text-lg font-bold">Observações Pós-Viagem</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Deseja registrar algum problema ou observação sobre esta viagem?
          </p>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Trânsito intenso, desvio de rota, produto intacto, etc..."
            className="rounded-xl min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onSubmit("")} className="flex-1 h-11 rounded-xl">
              Pular
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 h-11 rounded-xl font-bold"
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}