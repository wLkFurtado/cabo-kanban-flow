import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { usePautasStore } from "@/state/pautasStore";
import { useAuthStore } from "@/state/authStore";

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
}

interface EventFormData {
  nome: string;
  secretaria: string;
  descricao: string;
  data: Date;
  horaInicio: string;
  horaFim: string;
  equipe: {
    jornalista: string[];
    filmmaker: string[];
    fotografo: string[];
    rede: string[];
  };
}

const secretarias = [
  "Secretaria de Educação",
  "Secretaria de Saúde",
  "Secretaria de Obras",
  "Secretaria de Meio Ambiente",
  "Secretaria de Cultura",
  "Secretaria de Esportes",
  "Secretaria de Assistência Social",
  "Secretaria de Administração",
  "Secretaria de Finanças",
  "Gabinete do Prefeito",
  "Outras"
];

export function EventModal({ open, onOpenChange, selectedDate }: EventModalProps) {
  const { adicionarEvento } = usePautasStore();
  const { getCurrentUser } = useAuthStore();
  const currentUser = getCurrentUser();

  const [formData, setFormData] = useState<EventFormData>({
    nome: "",
    secretaria: "",
    descricao: "",
    data: selectedDate || new Date(),
    horaInicio: "09:00",
    horaFim: "10:00",
    equipe: {
      jornalista: [""],
      filmmaker: [""],
      fotografo: [""],
      rede: [""]
    }
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome do evento é obrigatório";
    }

    if (!formData.secretaria) {
      newErrors.secretaria = "Secretaria responsável é obrigatória";
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = "Descrição do evento é obrigatória";
    }

    if (!formData.data) {
      newErrors.data = "Data do evento é obrigatória";
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

    // Criar lista de participantes da equipe
    const participantes = Object.values(formData.equipe).flat().filter(Boolean);

    // Criar evento para o sistema de pautas
    const novoEvento = {
      titulo: formData.nome,
      descricao: `${formData.descricao}\n\nSecretaria: ${formData.secretaria}\n\nEquipe:\n- Jornalista: ${formData.equipe.jornalista.length > 0 ? formData.equipe.jornalista.join(', ') : 'Não definido'}\n- Filmmaker: ${formData.equipe.filmmaker.length > 0 ? formData.equipe.filmmaker.join(', ') : 'Não definido'}\n- Fotógrafo: ${formData.equipe.fotografo.length > 0 ? formData.equipe.fotografo.join(', ') : 'Não definido'}\n- Rede: ${formData.equipe.rede.length > 0 ? formData.equipe.rede.join(', ') : 'Não definido'}`,
      dataInicio,
      dataFim,
      tipo: 'evento' as const,
      prioridade: 'media' as const,
      status: 'agendado' as const,
      responsavel: currentUser?.email || '',
      participantes,
      local: '',
      observacoes: `Criado via agenda - Secretaria: ${formData.secretaria}`,
      recorrencia: 'nenhuma' as const,
      lembrete: 15,
      tags: ['agenda', formData.secretaria.toLowerCase().replace(/\s+/g, '-')],
      anexos: []
    };

    // Adicionar evento ao sistema de pautas
    adicionarEvento(novoEvento);
    
    // Reset form
    setFormData({
      nome: "",
      secretaria: "",
      descricao: "",
      data: selectedDate || new Date(),
      horaInicio: "09:00",
      horaFim: "10:00",
      equipe: {
        jornalista: [""],
        filmmaker: [""],
        fotografo: [""],
        rede: [""]
      }
    });
    setErrors({});
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof EventFormData, value: string | Date | EventFormData['equipe']) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Evento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Evento *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              placeholder="Digite o nome do evento"
              className={errors.nome ? "border-red-500" : ""}
            />
            {errors.nome && (
              <p className="text-sm text-red-500">{errors.nome}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretaria">Secretaria Responsável *</Label>
            <Select
              value={formData.secretaria}
              onValueChange={(value) => handleInputChange("secretaria", value)}
            >
              <SelectTrigger className={errors.secretaria ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione a secretaria" />
              </SelectTrigger>
              <SelectContent>
                {secretarias.map((secretaria) => (
                  <SelectItem key={secretaria} value={secretaria}>
                    {secretaria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.secretaria && (
              <p className="text-sm text-red-500">{errors.secretaria}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data do Evento *</Label>
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
                  onSelect={(date) => handleInputChange("data", date)}
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
                onChange={(e) => handleInputChange("horaInicio", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFim">Hora de Fim</Label>
              <Input
                id="horaFim"
                type="time"
                value={formData.horaFim}
                onChange={(e) => handleInputChange("horaFim", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição do Evento *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange("descricao", e.target.value)}
              placeholder="Descreva o evento..."
              rows={4}
              className={errors.descricao ? "border-red-500" : ""}
            />
            {errors.descricao && (
              <p className="text-sm text-red-500">{errors.descricao}</p>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Equipe Responsável</Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Jornalista */}
              <div className="space-y-2">
                <Label>Jornalista</Label>
                <div className="space-y-2">
                  {formData.equipe.jornalista.map((pessoa, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={pessoa}
                        onChange={(e) => {
                          const newJornalistas = [...formData.equipe.jornalista];
                          newJornalistas[index] = e.target.value;
                          handleInputChange("equipe", { ...formData.equipe, jornalista: newJornalistas });
                        }}
                        placeholder="Nome do jornalista"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newJornalistas = formData.equipe.jornalista.filter((_, i) => i !== index);
                          handleInputChange("equipe", { ...formData.equipe, jornalista: newJornalistas });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleInputChange("equipe", { ...formData.equipe, jornalista: [...formData.equipe.jornalista, ""] });
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Jornalista
                  </Button>
                </div>
              </div>

              {/* Filmmaker */}
              <div className="space-y-2">
                <Label>Filmmaker</Label>
                <div className="space-y-2">
                  {formData.equipe.filmmaker.map((pessoa, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={pessoa}
                        onChange={(e) => {
                          const newFilmmakers = [...formData.equipe.filmmaker];
                          newFilmmakers[index] = e.target.value;
                          handleInputChange("equipe", { ...formData.equipe, filmmaker: newFilmmakers });
                        }}
                        placeholder="Nome do filmmaker"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newFilmmakers = formData.equipe.filmmaker.filter((_, i) => i !== index);
                          handleInputChange("equipe", { ...formData.equipe, filmmaker: newFilmmakers });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleInputChange("equipe", { ...formData.equipe, filmmaker: [...formData.equipe.filmmaker, ""] });
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Filmmaker
                  </Button>
                </div>
              </div>

              {/* Fotógrafo */}
              <div className="space-y-2">
                <Label>Fotógrafo</Label>
                <div className="space-y-2">
                  {formData.equipe.fotografo.map((pessoa, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={pessoa}
                        onChange={(e) => {
                          const newFotografos = [...formData.equipe.fotografo];
                          newFotografos[index] = e.target.value;
                          handleInputChange("equipe", { ...formData.equipe, fotografo: newFotografos });
                        }}
                        placeholder="Nome do fotógrafo"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newFotografos = formData.equipe.fotografo.filter((_, i) => i !== index);
                          handleInputChange("equipe", { ...formData.equipe, fotografo: newFotografos });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleInputChange("equipe", { ...formData.equipe, fotografo: [...formData.equipe.fotografo, ""] });
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Fotógrafo
                  </Button>
                </div>
              </div>

              {/* Rede */}
              <div className="space-y-2">
                <Label>Rede</Label>
                <div className="space-y-2">
                  {formData.equipe.rede.map((pessoa, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={pessoa}
                        onChange={(e) => {
                          const newRede = [...formData.equipe.rede];
                          newRede[index] = e.target.value;
                          handleInputChange("equipe", { ...formData.equipe, rede: newRede });
                        }}
                        placeholder="Responsável pelas redes"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRede = formData.equipe.rede.filter((_, i) => i !== index);
                          handleInputChange("equipe", { ...formData.equipe, rede: newRede });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleInputChange("equipe", { ...formData.equipe, rede: [...formData.equipe.rede, ""] });
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Responsável
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
            >
              Criar Evento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}