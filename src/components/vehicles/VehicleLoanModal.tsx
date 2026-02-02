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
import { supabase } from '@/integrations/supabase/client';
import type { Vehicle } from '@/state/vehicleTypes';

interface VehicleLoanModalProps {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
}

export function VehicleLoanModal({ open, onClose, vehicle }: VehicleLoanModalProps) {
  const { loanVehicle, isLoaning } = useVehicleLoans();
  
  const [kmInicial, setKmInicial] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [lastKmFinal, setLastKmFinal] = useState<number | null>(null);

  useEffect(() => {
    const initializeModal = async () => {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Get last loan's final km for this vehicle
      if (vehicle) {
        const { data: lastLoan } = await supabase
          .from('vehicle_loans')
          .select('km_final')
          .eq('vehicle_id', vehicle.id)
          .not('km_final', 'is', null)
          .order('returned_at', { ascending: false })
          .limit(1)
          .single();

        if (lastLoan?.km_final) {
          setLastKmFinal(lastLoan.km_final);
        }
      }
    };
    
    if (open) {
      initializeModal();
    }
  }, [open, vehicle]);

  useEffect(() => {
    setKmInicial('');
    setNotes('');
    setError('');
    setLastKmFinal(null);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicle || !currentUserId) return;
    
    const kmValue = Number(kmInicial);
    
    if (!kmInicial || isNaN(kmValue) || kmValue < 0) {
      setError('Informe a quilometragem inicial válida');
      return;
    }

    // Validate against last km_final
    if (lastKmFinal !== null && kmValue < lastKmFinal) {
      setError(`O KM inicial deve ser no mínimo ${lastKmFinal.toLocaleString('pt-BR')} km (último KM registrado)`);
      return;
    }

    loanVehicle({
      vehicle_id: vehicle.id,
      user_id: currentUserId,
      km_inicial: kmValue,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pegar Carro</DialogTitle>
        </DialogHeader>

        {vehicle && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {vehicle.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {vehicle.model} • {vehicle.plate}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* KM Inicial */}
          <div>
            <Label htmlFor="km-inicial">Quilometragem Inicial *</Label>
            <Input
              id="km-inicial"
              type="number"
              min={lastKmFinal || 0}
              value={kmInicial}
              onChange={(e) => {
                setKmInicial(e.target.value);
                setError('');
              }}
              placeholder={lastKmFinal ? `Mínimo: ${lastKmFinal.toLocaleString('pt-BR')} km` : "ex: 15000"}
              className={error ? 'border-red-500' : ''}
            />
            {lastKmFinal && !error && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Último KM registrado: {lastKmFinal.toLocaleString('pt-BR')} km
              </p>
            )}
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoaning}>
              {isLoaning ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
