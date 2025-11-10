-- Permitir exclusão de cards apenas por usuários com acesso ao board
-- Mantém as políticas existentes (donos/membros) e adiciona esta regra permissiva
-- Atenção: política é PERMISSIVA; combine com outras políticas restritivas conforme necessário.

begin;

-- Criar política adicional para DELETE na tabela cards
create policy cards_delete_accessible_boards
  on public.cards
  as permissive
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.board_lists bl
      where bl.id = list_id
        and public.user_has_board_access(bl.board_id)
    )
  );

commit;