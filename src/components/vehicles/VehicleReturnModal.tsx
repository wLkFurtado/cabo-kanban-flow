import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useVehicleLoans } from '@/hooks/useVehicleLoans';
import type { VehicleWithActiveLoan } from '@/state/vehicleTypes';

interface VehicleReturnModalProps {
  open: boolean;
  onClose: () => void;
  vehicle?: VehicleWithActiveLoan | null;
}

export function VehicleReturnModal({ open, onClose, vehicle }: VehicleReturnModalProps) {
  const { returnVehicle, isReturning } = useVehicleLoans();
  
  const [kmFinal, setKmFinal] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setKmFinal('');
    setNotes('');
    setError('');
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicle?.active_loan) return;
    
    const kmFinalNum = Number(kmFinal);
    const kmInicial = vehicle.active_loan.km_inicial;
    
    if (!kmFinal || isNaN(kmFinalNum) || kmFinalNum < 0) {
      setError('Informe a quilometragem final válida');
      return;
    }
    
    if (kmFinalNum < kmInicial) {
      setError(`A quilometragem final deve ser maior ou igual à inicial (${kmInicial} km)`);
      return;
    }

    returnVehicle({
      loanId: vehicle.active_loan.id,
      input: {
        km_final: kmFinalNum,
        notes: notes.trim() || undefined,
      },
    });

    onClose();
  };

  const kmRodado = vehicle?.active_loan && kmFinal 
    ? Number(kmFinal) - vehicle.active_loan.km_inicial 
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Devolver Carro</DialogTitle>
        </DialogHeader>

        {vehicle && vehicle.active_loan && (
          <>
            {/* Info do carro */}
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {vehicle.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {vehicle.model} • {vehicle.plate}
              </p>
            </div>

            {/* Info do empréstimo */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Com:
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {vehicle.active_loan.user?.full_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <strong>KM Inicial:</strong> {vehicle.active_loan.km_inicial.toLocaleString('pt-BR')} km
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* KM Final */}
              <div>
                <Label htmlFor="km-final">Quilometragem Final *</Label>
                <Input
                  id="km-final"
                  type="number"
                  min={vehicle.active_loan.km_inicial}
                  value={kmFinal}
                  onChange={(e) => {
                    setKmFinal(e.target.value);
                    setError('');
                  }}
                  placeholder={`Mínimo: ${vehicle.active_loan.km_inicial} km`}
                  className={error ? 'border-red-500' : ''}
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
                
                {/* Mostrar KM rodado */}
                {kmRodado !== null && kmRodado >= 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ✓ KM rodado: <strong>{kmRodado.toLocaleString('pt-BR')} km</strong>
                  </p>
                )}
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Estado do carro, problemas encontrados, etc..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isReturning}>
                  {isReturning ? 'Devolvendo...' : 'Confirmar Devolução'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
