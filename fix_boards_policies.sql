-- Script para corrigir políticas RLS da tabela boards
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Remover todas as políticas problemáticas da tabela boards
DROP POLICY IF EXISTS "boards_insert" ON boards;
DROP POLICY IF EXISTS "boards_select_owner" ON boards;
DROP POLICY IF EXISTS "boards_select_member" ON boards;
DROP POLICY IF EXISTS "boards_update" ON boards;
DROP POLICY IF EXISTS "boards_delete" ON boards;

-- 2. Criar políticas simples sem recursão
-- Política para INSERT: apenas o dono pode inserir
CREATE POLICY "boards_insert_simple" ON boards
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Política para SELECT: dono pode ver seus boards
CREATE POLICY "boards_select_owner_simple" ON boards
  FOR SELECT USING (owner_id = auth.uid());

-- Política para UPDATE: apenas o dono pode atualizar
CREATE POLICY "boards_update_simple" ON boards
  FOR UPDATE USING (owner_id = auth.uid());

-- Política para DELETE: apenas o dono pode deletar
CREATE POLICY "boards_delete_simple" ON boards
  FOR DELETE USING (owner_id = auth.uid());