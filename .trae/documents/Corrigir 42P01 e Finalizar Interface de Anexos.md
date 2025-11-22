## Diagnóstico
- Erro 42P01 indica que a tabela `public.card_attachments` não existe na base.
- A UI passou a usar `useAttachments` (tabela dedicada), então a consulta falha enquanto a migration não estiver aplicada.

## Correção na Base de Dados
- Aplicar a migration que cria a tabela e políticas RLS:
  - Arquivo: `supabase/migrations/20251122120000_create_card_attachments.sql`.
  - Ação: Executar via Supabase SQL Editor (colar e rodar) ou `supabase db push` no projeto.
- Pré-requisitos:
  - Função `public.user_has_board_access(board_uuid uuid)` existente (referenciada nas políticas; já criada em migrations anteriores).
  - Bucket de Storage `attachments` público (migration `20251121134500_create_attachments_bucket.sql`).

## Fallback no Frontend (robustez)
- Atualizar `useAttachments` para detectar 42P01 e entrar em modo de compatibilidade:
  - Capturar erro de relação inexistente.
  - Retornar lista vazia e permitir upload (que continua gravando atividades), mantendo UI funcional.
  - Mostrar banner informativo para admins: “Ativos em modo compatível — aplique a migration para habilitar listagem completa”.
- Em `CardModal`:
  - Se `useAttachments` reportar fallback, usar a lista derivada das atividades (já implementada) para não quebrar.

## Configuração
- Definir `VITE_ATTACHMENTS_BUCKET=attachments` (ou nome do bucket existente) no `.env` do Vite e reiniciar o dev server.
- Caso o bucket não seja público, a lógica já usa `signedUrl` como fallback.

## Validação
- Após aplicar a migration:
  - Abrir um card → seção Anexos deve listar itens automaticamente.
  - Fazer upload (drag & drop e clique) e ver barra de progresso.
  - Testar Renomear, Descrição, Excluir (com confirmação) e Definir capa (apenas imagens).
  - Filtrar por tipo e ordenar por data/nome/tamanho.
- Cross‑browser: Chrome, Firefox, Safari, mobile.

## Entregáveis
- Tabela e RLS ativas no Supabase.
- Fallback e banner no frontend enquanto a tabela não existir.
- UI de anexos com todas as funcionalidades funcionando.

Confirmando, sigo aplicando a migration e adicionando o fallback no hook/UI, com os ajustes de UX solicitados.