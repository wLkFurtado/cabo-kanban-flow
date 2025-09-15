import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Calendar, Clock, User, Tag, AlertCircle, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { usePautasStore } from '../../state/pautasStore';
import { Evento } from '../../state/pautasTypes';
import { cn } from '../../lib/utils';

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
  const { adicionarEvento, atualizarEvento } = usePautasStore();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    dataInicio: '',
    horaInicio: '',
    dataFim: '',
    horaFim: '',
    tipo: 'reuniao' as Evento['tipo'],
    prioridade: 'media' as Evento['prioridade'],
    status: 'agendado' as Evento['status'],
    responsavel: '',
    participantes: [] as string[],
    local: '',
    observacoes: '',
    recorrencia: 'nenhuma' as const,
    lembrete: 15,
    tags: [] as string[],
    anexos: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  const [newParticipante, setNewParticipante] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cores predefinidas
  const predefinedColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#6366f1', '#14b8a6', '#eab308'
  ];

  // Inicializar formulário
  useEffect(() => {
    if (evento) {
      // Edição
      setFormData({
        titulo: evento.titulo,
        descricao: evento.descricao || '',
        dataInicio: format(evento.dataInicio, 'yyyy-MM-dd'),
        horaInicio: format(evento.dataInicio, 'HH:mm'),
        dataFim: format(evento.dataFim, 'yyyy-MM-dd'),
        horaFim: format(evento.dataFim, 'HH:mm'),
        tipo: evento.tipo,
        prioridade: evento.prioridade,
        status: evento.status,
        responsavel: evento.responsavel || '',
        participantes: evento.participantes || [],
        local: evento.local || '',
        observacoes: evento.observacoes || '',
        recorrencia: evento.recorrencia || 'nenhuma',
        lembrete: evento.lembrete || 15,
        tags: evento.tags || [],
        anexos: evento.anexos || []
      });
    } else if (initialDate) {
      // Novo evento com data inicial
      const startHour = initialHour || 9;
      const endHour = startHour + 1;
      
      setFormData({
        titulo: '',
        descricao: '',
        dataInicio: format(initialDate, 'yyyy-MM-dd'),
        horaInicio: `${startHour.toString().padStart(2, '0')}:00`,
        dataFim: format(initialDate, 'yyyy-MM-dd'),
        horaFim: `${endHour.toString().padStart(2, '0')}:00`,
        tipo: 'reuniao',
        prioridade: 'media',
        status: 'agendado',
        responsavel: '',
        participantes: [],
        local: '',
        observacoes: '',
        recorrencia: 'nenhuma',
        lembrete: 15,
        tags: [],
        anexos: []
      });
    } else {
      // Reset para novo evento
      const now = new Date();
      setFormData({
        titulo: '',
        descricao: '',
        dataInicio: format(now, 'yyyy-MM-dd'),
        horaInicio: '09:00',
        dataFim: format(now, 'yyyy-MM-dd'),
        horaFim: '10:00',
        tipo: 'reuniao',
        prioridade: 'media',
        status: 'agendado',
        responsavel: '',
        participantes: [],
        local: '',
        observacoes: '',
        recorrencia: 'nenhuma',
        lembrete: 15,
        tags: [],
        anexos: []
      });
    }
    setErrors({});
  }, [evento, initialDate, initialHour, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }
    
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
    
    if (!validateForm()) return;
    
    const dataInicio = new Date(`${formData.dataInicio}T${formData.horaInicio}`);
    const dataFim = new Date(`${formData.dataFim}T${formData.horaFim}`);
    
    const eventoData: Omit<Evento, 'id'> = {
      titulo: formData.titulo.trim(),
      descricao: formData.descricao.trim(),
      dataInicio,
      dataFim,
      tipo: formData.tipo,
      prioridade: formData.prioridade,
      status: formData.status,
      responsavel: formData.responsavel.trim(),
      participantes: formData.participantes,
      local: formData.local,
      observacoes: formData.observacoes,
      recorrencia: formData.recorrencia,
      lembrete: formData.lembrete,
      tags: formData.tags,
      anexos: formData.anexos
    };
    
    if (evento) {
      atualizarEvento(evento.id, eventoData);
    } else {
      adicionarEvento(eventoData);
    }
    
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addParticipante = () => {
    if (newParticipante.trim() && !formData.participantes.includes(newParticipante.trim())) {
      setFormData(prev => ({
        ...prev,
        participantes: [...prev.participantes, newParticipante.trim()]
      }));
      setNewParticipante('');
    }
  };

  const removeParticipante = (participanteToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      participantes: prev.participantes.filter(p => p !== participanteToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {evento ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Digite o título do evento"
              className={errors.titulo ? 'border-red-500' : ''}
            />
            {errors.titulo && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.titulo}
              </p>
            )}
          </div>
          
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição opcional do evento"
              rows={3}
            />
          </div>
          
          {/* Data e hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={formData.dataInicio}
                onChange={(e) => setFormData(prev => ({ ...prev, dataInicio: e.target.value }))}
                className={errors.dataInicio ? 'border-red-500' : ''}
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
                onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                className={errors.horaInicio ? 'border-red-500' : ''}
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
                onChange={(e) => setFormData(prev => ({ ...prev, dataFim: e.target.value }))}
                className={errors.dataFim ? 'border-red-500' : ''}
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
                onChange={(e) => setFormData(prev => ({ ...prev, horaFim: e.target.value }))}
                className={errors.horaFim ? 'border-red-500' : ''}
              />
              {errors.horaFim && (
                <p className="text-sm text-red-600">{errors.horaFim}</p>
              )}
            </div>
          </div>
          
          {/* Tipo, Prioridade, Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value: TipoEvento) => setFormData(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="escala">Escala</SelectItem>
                  <SelectItem value="treinamento">Treinamento</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={formData.prioridade} onValueChange={(value: PrioridadeEvento) => setFormData(prev => ({ ...prev, prioridade: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: StatusEvento) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Input
              id="responsavel"
              value={formData.responsavel}
              onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
              placeholder="Email do responsável"
            />
          </div>
          
          {/* Participantes */}
          <div className="space-y-2">
            <Label>Participantes</Label>
            <div className="flex gap-2">
              <Input
                value={newParticipante}
                onChange={(e) => setNewParticipante(e.target.value)}
                placeholder="Email do participante"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addParticipante();
                  }
                }}
              />
              <Button type="button" onClick={addParticipante} variant="outline">
                <User className="w-4 h-4" />
              </Button>
            </div>
            {formData.participantes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.participantes.map((participante, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {participante}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-500"
                      onClick={() => removeParticipante(participante)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Adicionar tag"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Tag className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Cor */}
          <div className="space-y-2">
            <Label>Cor do Evento</Label>
            <div className="flex gap-2 flex-wrap">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    formData.cor === color ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-gray-300 dark:border-gray-600'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, cor: color }))}
                />
              ))}
              <Input
                type="color"
                value={formData.cor}
                onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                className="w-8 h-8 p-0 border-2 rounded-full cursor-pointer"
              />
            </div>
          </div>
          
          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              {evento ? 'Atualizar' : 'Criar'} Evento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};