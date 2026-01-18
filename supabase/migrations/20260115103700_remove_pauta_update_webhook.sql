-- ============================================================================
-- REMOVER WEBHOOK DE ATUALIZAÇÃO DE PAUTAS
-- ============================================================================
-- Remove o trigger que enviava webhook toda vez que uma pauta era atualizada
-- Mantém apenas o webhook diário agendado às 18h
-- ============================================================================

-- 1. REMOVER O TRIGGER
DROP TRIGGER IF EXISTS on_pauta_team_change ON public.pautas_events;

-- 2. REMOVER AS FUNÇÕES RELACIONADAS
DROP FUNCTION IF EXISTS public.send_pauta_webhook_direct();
DROP FUNCTION IF EXISTS public.trigger_pauta_webhook();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
-- Agora os webhooks de pauta são enviados APENAS:
-- - Todos os dias às 18h (hora de Brasília) via pg_cron
-- - Com o resumo de todas as pautas do dia seguinte
-- 
-- NÃO será mais enviado webhook ao:
-- - Atualizar uma pauta existente
-- - Inserir uma nova pauta
-- - Modificar membros da equipe
-- ============================================================================
