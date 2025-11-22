## Objetivo
Implementar uma interface de anexos sempre visível e rica em funcionalidades, alinhada ao Trello: listagem com miniaturas, tipo/formato/tamanho, ações de renomear/descrição/excluir/definir capa, drag‑and‑drop, barra de progresso, filtros e ordenação, com validações e feedback claros.

## Arquitetura de Dados
- Tabela `card_attachments` (Supabase):
  - Campos: `id`, `board_id`, `card_id`, `name`, `description`, `size`, `type`, `url`, `path`, `created_at`, `updated_at`
  - RLS: leitura/escrita somente para membros do board; `ON DELETE CASCADE` vinculado a `cards`
- Capa do card:
  - Persistir em `cards.cover_images` (primeira posição é a capa); quando “Definir capa” for escolhido em um anexo imagem, colocar `url` na posição 0 (mantendo demais em ordem)
- Storage:
  - Usar `VITE_ATTACHMENTS_BUCKET` (fallback para `attachments`), leitura pública; se não houver `publicUrl`, gerar `signedUrl` como fallback

## UI/UX no Frontend (CardModal)
- Seção “Anexos” sempre visível:
  - Área Dropzone (arrastar e soltar), com fallback de botão/input
  - Barra de progresso por arquivo e geral
  - Lista de anexos:
    - Miniatura para imagens, ícone por tipo para outros formatos
    - Nome clicável, tamanho e rótulo amigável de tipo, “adicionado há X tempo”
    - Indicador visual “Capa” quando for a imagem de capa
  - Ações por anexo:
    - Abrir, Baixar
    - Renomear (inline) e Editar descrição (modal simples)
    - Definir como capa (apenas imagens)
    - Excluir com confirmação
- Filtros e ordenação:
  - Filtros: Todos, Imagens, Vídeos, Documentos (PDF/Office), Áudio, Compactados, Código, Links
  - Ordenação: Nome, Tamanho, Data (asc/desc)
- Feedback:
  - Toasts de sucesso/erro
  - Estados hover/focus claros e acessíveis (teclado)

## Integração e Estado
- Consultas/mutações (React Query):
  - `useQuery(['card-attachments', cardId])` para listar
  - `useMutation` para upload (cria registro), renomear/descricao (update), excluir (remove storage + registro), definir capa (update em `cards.cover_images`)
- Persistência atual de anexos via atividades será mantida para histórico, mas a listagem passa a usar `card_attachments`

## Validações e Compatibilidade
- Tamanho máximo: 13 MB; MIME coerente; múltiplos uploads simultâneos
- Fallback para `signedUrl` quando bucket não for público
- Testar arrastar e soltar em Chrome, Firefox, Safari e mobile (toque/seleção)
- Acessibilidade: navegação por teclado, foco visível, labels

## Alterações Técnicas (arquivos)
- `src/components/kanban/CardModal.tsx`:
  - Tornar “Anexos” sempre visível (remover condicional)
  - Adicionar Dropzone e barra de progresso
  - Renderizar lista com miniaturas/ícones, nome/tamanho/tipo/tempo
  - Incluir ações (renomear, descrição, capa, excluir com confirmação)
  - Adicionar filtros e ordenação
- `src/hooks/useAttachments.ts` (novo hook):
  - Encapsular listagem/mutações de `card_attachments`
- Supabase migrations:
  - Criar `card_attachments` + RLS + FK para `cards`
  - Garantir bucket `attachments` público (migração existente já cobre)

## Fluxo de Upload
1. Seleção/drag‑and‑drop → validação (tamanho/tipo)
2. Upload para Storage → progresso (stream ou polling)
3. Obter `publicUrl`/`signedUrl` → criar registro em `card_attachments`
4. Se imagem e primeira do card, oferecer “Definir capa” (auto ou manual)

## Testes e Verificação
- Unit: helpers de tipo/ícone/rótulo; ordenação/filtragem
- Integração: upload, renomear, descrição, excluir, definir capa
- Manual: cross‑browser, mobile, acessibilidade

## Entregáveis
- UI de anexos no `CardModal` pronta e acessível
- Hook de anexos com cache e mutações
- Migração Supabase para `card_attachments` com RLS
- Validações, toasts e progresso funcionais

Confirma este plano para iniciar a implementação?