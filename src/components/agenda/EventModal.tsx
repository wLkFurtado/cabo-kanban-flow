import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, Trash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../../lib/utils";
import { useEvents } from "../../hooks/useEvents";
import type { AgendaEvent } from "../../hooks/useEvents";
import { SecretariaCombobox } from "./SecretariaCombobox";

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  eventToEdit?: AgendaEvent | null;
}

interface EventFormData {
  nome: string;
  secretaria: string;
  descricao: string;
  data: Date;
  horaInicio: string;
  horaFim: string;
}



export function EventModal({ open, onOpenChange, selectedDate, eventToEdit }: EventModalProps) {
  const { createEvent, updateEvent, deleteEvent, isCreating, isUpdating } = useEvents();

  const [formData, setFormData] = useState<EventFormData>({
    nome: "",
    secretaria: "",
    descricao: "",
    data: selectedDate || new Date(),
    horaInicio: "09:00",
    horaFim: "10:00",
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome da pauta é obrigatório";
    }

    // Secretaria opcional para edição/uso geral

    if (!formData.data) {
      newErrors.data = "Data da pauta é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!formData.data) {
      return;
    }

    // Criar datas de início e fim
    const [horaInicioHour, horaInicioMin] = formData.horaInicio.split(':').map(Number);
    const [horaFimHour, horaFimMin] = formData.horaFim.split(':').map(Number);
    
    const dataInicio = new Date(formData.data);
    dataInicio.setHours(horaInicioHour, horaInicioMin, 0, 0);
    
    const dataFim = new Date(formData.data);
    dataFim.setHours(horaFimHour, horaFimMin, 0, 0);

    // Criar evento para salvar no banco (tabela events)
    const payload = {
      title: formData.nome,
      description: formData.descricao || `Secretaria: ${formData.secretaria}`,
      start_date: dataInicio.toISOString(),
      end_date: dataFim.toISOString(),
      all_day: false,
      location: '' as string,
    };

    if (eventToEdit) {
      updateEvent({ id: eventToEdit.id, ...payload });
    } else {
      createEvent(payload);
    }
    
    // Reset form (sem equipe)
    setFormData({
      nome: "",
      secretaria: "",
      descricao: "",
      data: selectedDate || new Date(),
      horaInicio: "09:00",
      horaFim: "10:00",
    });
    setErrors({});
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof EventFormData, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpa erro ao digitar, removendo a chave do objeto
    const key = field as string;
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Preencher formulário ao editar evento
  useEffect(() => {
    if (eventToEdit) {
      const start = new Date(eventToEdit.start_date);
      const end = new Date(eventToEdit.end_date);
      const pad = (n: number) => String(n).padStart(2, '0');
      const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
      const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

      setFormData(prev => ({
        ...prev,
        nome: eventToEdit.title || "",
        secretaria: prev.secretaria || "",
        descricao: eventToEdit.description || "",
        data: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
        horaInicio: startTime,
        horaFim: endTime,
      }));
    } else if (selectedDate) {
      // Ao criar, garantir que a data inicial acompanha selectedDate
      setFormData(prev => ({ ...prev, data: selectedDate }));
    }
  }, [eventToEdit, selectedDate, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{eventToEdit ? "Editar Pauta" : "Criar Nova Pauta"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Pauta *</Label>
              <Input
                id="nome"
                value={formData.nome}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("nome", e.target.value)}
                placeholder="Digite o nome da pauta"
                className={errors.nome ? "border-red-500" : ""}
              />
            {errors.nome && (
              <p className="text-sm text-red-500">{errors.nome}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretaria">Secretaria Responsável *</Label>
            <SecretariaCombobox
              value={formData.secretaria}
              onChange={(value: string) => handleInputChange("secretaria", value)}
              error={!!errors.secretaria}
            />
            {errors.secretaria && (
              <p className="text-sm text-red-500">{errors.secretaria}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("descricao", e.target.value)}
              placeholder="Digite a descrição da pauta (opcional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data da Pauta *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.data && "text-muted-foreground",
                    errors.data && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.data ? (
                    format(formData.data, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.data}
                  onSelect={(date?: Date) => date && handleInputChange("data", date)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.data && (
              <p className="text-sm text-red-500">{errors.data}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Hora de Início</Label>
              <Input
                id="horaInicio"
                type="time"
                value={formData.horaInicio}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("horaInicio", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFim">Hora de Fim</Label>
              <Input
                id="horaFim"
                type="time"
                value={formData.horaFim}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("horaFim", e.target.value)}
              />
            </div>
          </div>

          {/* Seção de equipe removida conforme solicitado */}

          <div className="flex justify-between items-center pt-4">
            {eventToEdit && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (eventToEdit && window.confirm('Excluir esta pauta?')) {
                    deleteEvent(eventToEdit.id);
                    onOpenChange(false);
                  }
                }}
                className="flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                Excluir
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isCreating || isUpdating}
              >
                {eventToEdit ? "Salvar" : "Criar Pauta"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}