import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVehicles } from '@/hooks/useVehicles';
import type { Vehicle } from '@/state/vehicleTypes';

interface VehicleModalProps {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
}

export function VehicleModal({ open, onClose, vehicle }: VehicleModalProps) {
  const { createVehicle, updateVehicle, deleteVehicle, isCreating, isUpdating, isDeleting } = useVehicles();
  
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    plate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name,
        model: vehicle.model,
        plate: vehicle.plate,
      });
    } else {
      setFormData({
        name: '',
        model: '',
        plate: '',
      });
    }
    setErrors({});
  }, [vehicle, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Modelo é obrigatório';
    }

    if (!formData.plate.trim()) {
      newErrors.plate = 'Placa é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (vehicle) {
      updateVehicle({
        id: vehicle.id,
        name: formData.name.trim(),
        model: formData.model.trim(),
        plate: formData.plate.trim().toUpperCase(),
      });
    } else {
      createVehicle({
        name: formData.name.trim(),
        model: formData.model.trim(),
        plate: formData.plate.trim().toUpperCase(),
      });
    }

    onClose();
  };

  const handleConfirmDelete = () => {
    if (!vehicle) return;
    deleteVehicle(vehicle.id);
    setDeleteDialogOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {vehicle ? 'Editar Carro' : 'Novo Carro'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <Label htmlFor="name">Nome/Identificação *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: Carro Branco"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Modelo */}
            <div>
              <Label htmlFor="model">Modelo *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="ex: Fiat Uno"
                className={errors.model ? 'border-red-500' : ''}
              />
              {errors.model && (
                <p className="text-red-500 text-sm mt-1">{errors.model}</p>
              )}
            </div>

            {/* Placa */}
            <div>
              <Label htmlFor="plate">Placa *</Label>
              <Input
                id="plate"
                value={formData.plate}
                onChange={(e) => setFormData(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                placeholder="ex: ABC-1234"
                className={errors.plate ? 'border-red-500' : ''}
                maxLength={8}
              />
              {errors.plate && (
                <p className="text-red-500 text-sm mt-1">{errors.plate}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex justify-between pt-4">
              <div>
                {vehicle && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Excluindo...' : 'Excluir'}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir carro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{vehicle?.name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
