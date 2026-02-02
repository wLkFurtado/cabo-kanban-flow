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
import { useEquipments } from '@/hooks/useEquipments';
import type { Equipment } from '@/state/equipmentTypes';

interface EquipmentModalProps {
  open: boolean;
  onClose: () => void;
  equipment?: Equipment | null;
}

export function EquipmentModal({ open, onClose, equipment }: EquipmentModalProps) {
  const { createEquipment, updateEquipment, deleteEquipment, isCreating, isUpdating, isDeleting } = useEquipments();
  
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serial_number: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Carregar dados do equipamento ao editar
  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        model: equipment.model,
        serial_number: equipment.serial_number,
      });
    } else {
      setFormData({
        name: '',
        model: '',
        serial_number: '',
      });
    }
    setErrors({});
  }, [equipment, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Modelo é obrigatório';
    }

    if (!formData.serial_number.trim()) {
      newErrors.serial_number = 'Número de série é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (equipment) {
      updateEquipment({
        id: equipment.id,
        name: formData.name.trim(),
        model: formData.model.trim(),
        serial_number: formData.serial_number.trim(),
      });
    } else {
      createEquipment({
        name: formData.name.trim(),
        model: formData.model.trim(),
        serial_number: formData.serial_number.trim(),
      });
    }

    onClose();
  };

  const handleConfirmDelete = () => {
    if (!equipment) return;
    deleteEquipment(equipment.id);
    setDeleteDialogOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {equipment ? 'Editar Equipamento' : 'Novo Equipamento'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: Câmera DSLR"
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
                placeholder="ex: Canon EOS R5"
                className={errors.model ? 'border-red-500' : ''}
              />
              {errors.model && (
                <p className="text-red-500 text-sm mt-1">{errors.model}</p>
              )}
            </div>

            {/* Número de Série */}
            <div>
              <Label htmlFor="serial_number">Número de Série *</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                placeholder="ex: SN123456789"
                className={errors.serial_number ? 'border-red-500' : ''}
              />
              {errors.serial_number && (
                <p className="text-red-500 text-sm mt-1">{errors.serial_number}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex justify-between pt-4">
              <div>
                {equipment && (
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
            <AlertDialogTitle>Excluir equipamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{equipment?.name}</strong>? 
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
