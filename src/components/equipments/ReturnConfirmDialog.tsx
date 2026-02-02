import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { EquipmentWithActiveLoan } from '@/state/equipmentTypes';

interface ReturnConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  equipment?: EquipmentWithActiveLoan | null;
  isReturning: boolean;
}

export function ReturnConfirmDialog({ 
  open, 
  onClose, 
  onConfirm, 
  equipment,
  isReturning 
}: ReturnConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Devolução</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja registrar a devolução do equipamento{' '}
            <span className="font-semibold">{equipment?.name}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isReturning}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isReturning}>
            {isReturning ? 'Devolvendo...' : 'Confirmar Devolução'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
