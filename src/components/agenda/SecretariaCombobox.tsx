import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const secretarias = [
  "Gabinete do Prefeito",
  "Chefia de Gabinete",
  "Controladoria Geral do Município",
  "Procuradoria Geral do Município",
  "Secretaria de Municipal de Comunicação",
  "Secretaria Municipal da Cidade",
  "Secretaria Municipal de Administração",
  "Secretaria Municipal de Agricultura e Pesca",
  "Secretaria Municipal de Assistência Social",
  "Secretaria Municipal de Cultura",
  "Secretaria Municipal de Desenvolvimento Econômico",
  "Secretaria Municipal de Educação",
  "Secretaria Municipal de Esporte e Lazer",
  "Secretaria Municipal de Fazenda",
  "Secretaria Municipal de Gestão e Inovação",
  "Secretaria Municipal de Governo",
  "Secretaria Municipal de Meio Ambiente, Clima e Saneamento",
  "Secretaria Municipal de Mobilidade Urbana",
  "Secretaria Municipal de Saúde",
  "Secretaria Municipal de Segurança e Ordem Pública",
  "Secretaria Municipal de Serviços Públicos",
  "Secretaria Municipal de Turismo",
  "Subsecretária-Adjunta de Subchefia do Gabinete do Prefeito",
  "Secretário-Adjunto de Eventos",
  "Subcontrolador-Geral",
  "Procuradoria-Geral",
  "Procurador-Chefe de Licitações e Contratos",
  "Procurador-Chefe Fazendário",
  "Procurador-Chefe de Contencioso Judicial",
  "Procurador-Chefe Residual e Legislativo",
  "Secretário-Adjunto de Administração",
  "Secretário-Adjunto de Gestão e Documentação Administrativa",
  "Secretário-Adjunto de Assuntos Fazendários",
  "Secretário-Adjunto de Fazenda em Tamoios",
  "Secretário-Adjunto de Receita",
  "Subprefeito de Maria Joaquina",
  "Subprefeito de Tamoios",
  "Subprefeito do Peró",
  "Subprefeito do Jardim Esperança",
  "Secretário-Adjunto de Compras e Licitação",
  "Secretário-Adjunto de Serviços Públicos",
  "Secretário-Adjunto de Licenciamento e Fiscalização (ADLIF)",
  "Secretário-Adjunto de Pesca e Aquicultura",
  "Secretário-Adjunto de Assistência Social",
  "Secretário-Adjunto de Políticas Públicas da Pessoa com Deficiência e Autismo",
  "Secretário-Adjunto de Assistência Social em Tamoios",
  "Secretário-Adjunto de Políticas Públicas da Mulher",
  "Secretário da Família e da Juventude",
  "Secretário-Adjunto da Melhor Idade",
  "Secretário-Adjunto Administrativo Turismo",
  "Secretário-Adjunto de Desenvolvimento Cultural",
  "Secretário-Adjunto de Produção Cultural",
  "Secretário-Adjunto de Cultura em Tamoios",
  "Secretário-Adjunto de Licenciamento e Fiscalização SEGOP",
  "Secretário-Adjunto de Gestão Pedagógica",
  "Secretário-Adjunto de Gestão Administrativa",
  "Secretário-Adjunto de Educação em Tamoios",
  "Secretário-Adjunto de Educação no Jardim Esperança",
  "Secretário-Adjunto de Meio Ambiente e Saneamento em Tamoios",
  "Secretário-Adjunto de Saneamento",
  "Secretário-Adjunto de Mobilidade Urbana",
  "Secretário-Adjunto de Mobilidade Urbana em Tamoios",
  "Secretário-Adjunto de Planejamento, Trânsito e Fiscalização",
  "Secretário-Adjunto de Administração de Saúde",
  "Secretário-Adjunto de Atenção à Saúde",
  "Secretário-Adjunto de Vigilância em Saúde e Atenção Básica",
  "Secretário-Adjunto de Saúde em Tamoios",
  "Secretário-Adjunto de Esporte e Lazer",
  "Secretário-Adjunto de Gestão de Equipamentos Esportivos",
  "Secretário-Adjunto de Esporte e Lazer em Tamoios",
  "Secretário-Adjunto de Gestão e Inovação",
  "Secretário-Adjunto de Ciência e Tecnologia",
  "Secretário-Adjunto de Relações Institucionais",
  "Secretário-Adjunto de Planejamento e Projeto Especiais",
  "Secretário-Adjunto de Desenvolvimento Urbano",
  "Secretário-Adjunto de Execução e Fiscalização",
  "Secretário-Adjunto de Planejamento e Gestão Interna",
  "Secretário-Adjunto de Obras",
  "Secretário-Adjunto de Gestão Territorial e Economia Azul",
  "Secretário-Adjunto de Relações Institucionais",
  "Coordenadoria-Geral de Segurança",
  "Coordenadoria-Geral de Controladoria-Geral do Município",
  "Coordenadoria-Geral de Desenvolvimento Econômico",
  "Coordenadoria-Geral de Cerimonial",
  "Coordenadoria-Geral da Criança e do Adolescente",
  "Coordenador-Geral Administrativo",
  "Coordenador-Geral de Projetos",
  "Coordenador-Geral Administrativo - SEMMURB",
  "Coordenador-Geral de Economia Azul",
  "Coordenadoria-Geral de Administração do Parque de Exposições",
  "Coordenadoria-Geral de Monitoramento e Controle de Governo",
  "Coordenador-Geral da Procuradoria",
  "Coordenadoria-Geral de Gestão Fiscal",
  "Coordenadoria-Geral de Supervisão Executiva",
  "Coordenadoria-Geral de Licenciamento e Regularização Urbanística",
  "Coordenadoria-Geral de Políticas Públicas",
  "Coordenador-Geral de Políticas Públicas da Mulher em Tamoios",
  "Coordenadoria-Geral de Ouvidora-geral do Município",
  "Coordenadoria-Geral de Segurança e Ordem Pública",
  "Coordenador-Geral de Estudo, Regulamento e Planejamento de Mobilidade Urbana",
  "Coordenadoria-Geral de Administração de Pessoal 2º distrito",
  "Coordenadoria-Geral Administrativo - SEMAS",
  "Coordenadoria-Geral de Defesa Civil",
  "Coordenador-Geral Administrativo - SEMAS",
  "Coordenadoria-Geral Administrativo - PROCON",
  "Coordenador-Geral de Administração de Pessoal - Setores VII e Praia do Peró",
  "Coordenador-Geral de Administração de Pessoal - Praia do Forte e Setores I, II, III e IV",
  "Coordenadoria-Geral da Melhor Idade",
  "Coordenadoria-Geral de Governo",
  "Coordenador-Geral de Planejamento e Políticas Econômicas e Fiscais",
  "Coordenador-Geral de Administração de Pessoal - Setores V e VI",
  "Coordenadoria-Geral de Produção Cultural",
  "Coordenadoria-Geral de Política de Pessoal",
  "Coordenador-Geral de Assuntos Fundiários (COGEAF)",
  "Coordenadoria-Geral de Administrativo - SEMOB",
  "Coordenador-Geral de Geoprocessamento",
  "Coordenadoria-Geral de Tecnologia da Inovação",
  "Coordenadoria-Geral de Administrativo - SEGOV",
];

interface SecretariaComboboxProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function SecretariaCombobox({ value, onChange, error }: SecretariaComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left h-auto min-h-[40px] py-2 pr-8",
            !value && "text-muted-foreground",
            error && "border-red-500"
          )}
        >
          <span className="truncate block max-w-[calc(100%-2rem)] text-sm leading-tight">
            {value || "Selecione a secretaria..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0 pointer-events-auto" align="start">
        <Command>
          <CommandInput 
            placeholder="Pesquisar secretaria..." 
          />
          <CommandList>
            <CommandEmpty>Nenhuma secretaria encontrada.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {secretarias.map((secretaria) => (
                <CommandItem
                  key={secretaria}
                  value={secretaria}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="py-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === secretaria ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-sm leading-tight break-words">{secretaria}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
