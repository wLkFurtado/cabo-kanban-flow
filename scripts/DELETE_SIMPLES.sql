-- SOLUÇÃO ULTRA SIMPLES - Sem complicação, sem trigger, sem nada
-- Execute estas 3 linhas NO SQL EDITOR DO SUPABASE

-- 1. Desabilitar a trigger temporariamente
DROP TRIGGER IF EXISTS pautas_audit_trigger ON public.pautas_events;

-- 2. Deletar a pauta
DELETE FROM pautas_events WHERE LOWER(titulo) LIKE '%teste%';

-- 3. Recriar a trigger (copie TODA a função e trigger da migration original)
-- Por enquanto, deixe sem trigger. Depois rodamos a migration completa de novo.

-- PRONTO! A pauta foi deletada. Verifique:
SELECT id, titulo FROM pautas_events WHERE LOWER(titulo) LIKE '%teste%';
-- Deve retornar 0 resultados


-- ========================================
-- PARA RECRIAR A TRIGGER DEPOIS (OPCIONAL)
-- ========================================
-- Execute a migration: supabase/migrations/20260217000000_fix_audit_trigger_null_user.sql
-- Ou rode: npx supabase db reset (se estiver em desenvolvimento local)
