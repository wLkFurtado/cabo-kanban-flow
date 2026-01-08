import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Save, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Evento } from '../../state/pautasTypes';
import { usePautas } from '../../hooks/usePautas';
import { RoleUserSelect } from './RoleUserSelect';
import { useAdminRole } from '../../hooks/useAdminRole';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  evento?: Evento;
  initialDate?: Date;
  initialHour?: number;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  evento,
  initialDate,
  initialHour
}) => {
  const { createEvent, updateEvent, deleteEvent, isCreating, isUpdating, isDeleting } = usePautas();
  const { isAdmin, hasScope, loading: adminLoading } = useAdminRole();
  const canEdit = isAdmin || hasScope('pautas_admin');
  const [formData, setFormData] = useState({
    dataInicio: '',
    horaInicio: '',
    dataFim: '',
    horaFim: '',
    filmmaker: '',
    fotografo: '',
    jornalista: '',
    rede: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Cores predefinidas
  // (UI simplificada não usa cores/tags/participantes)

  // Inicializar formulário
  useEffect(() => {
    if (evento) {
      // Edição
      setFormData({
        dataInicio: format(evento.dataInicio, 'yyyy-MM-dd'),
        horaInicio: format(evento.dataInicio, 'HH:mm'),
        dataFim: format(evento.dataFim, 'yyyy-MM-dd'),
        horaFim: format(evento.dataFim, 'HH:mm'),
        filmmaker: evento.filmmaker || '',
        fotografo: evento.fotografo || '',
        jornalista: evento.jornalista || '',
        rede: evento.rede || ''
      });
    } else if (initialDate) {
      // Novo evento com data inicial
      const startHour = initialHour || 9;
      const endHour = startHour + 1;
      
      setFormData({
        dataInicio: format(initialDate, 'yyyy-MM-dd'),
        horaInicio: `${startHour.toString().padStart(2, '0')}:00`,
        dataFim: format(initialDate, 'yyyy-MM-dd'),
        horaFim: `${endHour.toString().padStart(2, '0')}:00`,
        filmmaker: '',
        fotografo: '',
        jornalista: '',
        rede: ''
      });
    } else {
      // Reset para novo evento
      const now = new Date();
      setFormData({
        dataInicio: format(now, 'yyyy-MM-dd'),
        horaInicio: '09:00',
        dataFim: format(now, 'yyyy-MM-dd'),
        horaFim: '10:00',
        filmmaker: '',
        fotografo: '',
        jornalista: '',
        rede: ''
      });
    }
    setErrors({});
  }, [evento, initialDate, initialHour, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.dataInicio) {
      newErrors.dataInicio = 'Data de início é obrigatória';
    }
    
    if (!formData.horaInicio) {
      newErrors.horaInicio = 'Hora de início é obrigatória';
    }
    
    if (!formData.dataFim) {
      newErrors.dataFim = 'Data de fim é obrigatória';
    }
    
    if (!formData.horaFim) {
      newErrors.horaFim = 'Hora de fim é obrigatória';
    }
    
    // Validar se data/hora de fim é posterior ao início
    if (formData.dataInicio && formData.horaInicio && formData.dataFim && formData.horaFim) {
      const inicio = new Date(`${formData.dataInicio}T${formData.horaInicio}`);
      const fim = new Date(`${formData.dataFim}T${formData.horaFim}`);
      
      if (fim <= inicio) {
        newErrors.dataFim = 'Data/hora de fim deve ser posterior ao início';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    
    if (!validateForm()) return;
    
    const dataInicio = new Date(`${formData.dataInicio}T${formData.horaInicio}`);
    const dataFim = new Date(`${formData.dataFim}T${formData.horaFim}`);
    
    if (evento) {
      updateEvent({
        id: evento.id,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        filmmaker_id: formData.filmmaker || null,
        fotografo_id: formData.fotografo || null,
        jornalista_id: formData.jornalista || null,
        rede_id: formData.rede || null,
      });
    } else {
      createEvent({
        titulo: 'Evento',
        descricao: '',
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        tipo: 'evento',
        prioridade: 'media',
        status: 'pendente',
        recorrencia: 'nenhuma',
        cor: '#3b82f6',
        local: '',
        filmmaker_id: formData.filmmaker || null,
        fotografo_id: formData.fotografo || null,
        jornalista_id: formData.jornalista || null,
        rede_id: formData.rede || null,
      });
    }
    
  onClose();
  };

  const handleDelete = () => {
    if (!evento) return;
    if (!canEdit) return;
    // Abre o modal de confirmação de exclusão
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!evento) return;
    deleteEvent(evento.id);
    setDeleteConfirmOpen(false);
    onClose();
  };

  // Removidos: gerenciamento de tags/participantes para UI simplificada
  // Nenhuma lógica adicional de participantes/tags/cores no modal simplificado

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {evento ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Data e hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={formData.dataInicio}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, dataInicio: e.target.value }))}
                className={errors.dataInicio ? 'border-red-500' : ''}
                disabled={!canEdit}
              />
              {errors.dataInicio && (
                <p className="text-sm text-red-600">{errors.dataInicio}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Hora de Início *</Label>
              <Input
                id="horaInicio"
                type="time"
                value={formData.horaInicio}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                className={errors.horaInicio ? 'border-red-500' : ''}
                disabled={!canEdit}
              />
              {errors.horaInicio && (
                <p className="text-sm text-red-600">{errors.horaInicio}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim *</Label>
              <Input
                id="dataFim"
                type="date"
                value={formData.dataFim}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, dataFim: e.target.value }))}
                className={errors.dataFim ? 'border-red-500' : ''}
                disabled={!canEdit}
              />
              {errors.dataFim && (
                <p className="text-sm text-red-600">{errors.dataFim}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="horaFim">Hora de Fim *</Label>
              <Input
                id="horaFim"
                type="time"
                value={formData.horaFim}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, horaFim: e.target.value }))}
                className={errors.horaFim ? 'border-red-500' : ''}
                disabled={!canEdit}
              />
              {errors.horaFim && (
                <p className="text-sm text-red-600">{errors.horaFim}</p>
              )}
            </div>
          </div>
          
          {/* Equipe: seleção por área (filtrando perfis por cargo) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RoleUserSelect
              label="Filmmaker"
              cargo="filmmaker"
              value={formData.filmmaker || undefined}
              onChange={(userId?: string) => setFormData(prev => ({ ...prev, filmmaker: userId || '' }))}
              placeholder="Selecionar filmmaker"
              disabled={!canEdit}
            />
            <RoleUserSelect
              label="Fotógrafo"
              cargo="fotografo"
              value={formData.fotografo || undefined}
              onChange={(userId?: string) => setFormData(prev => ({ ...prev, fotografo: userId || '' }))}
              placeholder="Selecionar fotógrafo"
              disabled={!canEdit}
            />
            <RoleUserSelect
              label="Jornalista"
              cargo="jornalista"
              value={formData.jornalista || undefined}
              onChange={(userId?: string) => setFormData(prev => ({ ...prev, jornalista: userId || '' }))}
              placeholder="Selecionar jornalista"
              disabled={!canEdit}
            />
            <RoleUserSelect
              label="Rede"
              cargo="rede"
              value={formData.rede || undefined}
              onChange={(userId?: string) => setFormData(prev => ({ ...prev, rede: userId || '' }))}
              placeholder="Selecionar responsável de redes"
              disabled={!canEdit}
            />
          </div>
          
          {/* Aviso de permissões */}
          {!adminLoading && !canEdit && (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 text-sm">
              Edição restrita: apenas administradores ou usuários com escopo "pautas_admin" podem editar.
            </div>
          )}
          
          {/* Campos adicionais removidos para simplificação conforme solicitado */}

          
          {/* Botões */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <div>
              {evento && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting || !canEdit}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Pauta
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating || !canEdit}>
                <Save className="w-4 h-4 mr-2" />
                {evento ? 'Atualizar' : 'Criar'} Evento
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Modal de confirmação de exclusão */}
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir pauta?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir esta pauta? Esta ação não pode ser desfeita e o evento será removido permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={confirmDelete}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};