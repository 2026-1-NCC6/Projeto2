import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function ConfirmDeliveryModal({ open, onClose, onConfirm, loading }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <AlertDialogTitle className="text-lg font-bold">Finalizar Viagem</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm">
            Tem certeza que deseja finalizar a viagem e encerrar o monitoramento desta rota?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="w-full h-14 text-base font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? "Processando..." : "📦 Finalizar Viagem"}
          </AlertDialogAction>
          <AlertDialogCancel className="w-full h-12 rounded-xl">
            Cancelar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}