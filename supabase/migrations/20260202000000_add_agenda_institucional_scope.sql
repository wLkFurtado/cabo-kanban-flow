-- Adicionar suporte a scope para Agenda Institucional
-- Atualizar RLS policy para permitir usuários com scope agenda_institucional_admin

-- 1. Atualizar policy de gerenciamento
DROP POLICY IF EXISTS "Admins can manage institutional contacts" ON public.institutional_contacts;

CREATE POLICY "Admins and scoped users can manage institutional contacts" 
  ON public.institutional_contacts
  FOR ALL 
  USING (public.has_scope('agenda_institucional_admin'));
