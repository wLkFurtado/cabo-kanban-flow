-- ============================================================================
-- DISPARAR WEBHOOK DE PAUTAS MANUALMENTE
-- ============================================================================
-- Use este script quando precisar enviar o webhook de pautas fora do horário
-- agendado (18h todo dia)

-- EXECUTAR WEBHOOK DE PAUTAS AGORA
SELECT public.test_daily_pautas_webhook();

-- OU, se preferir chamar direto a função principal:
-- SELECT public.send_daily_pautas_webhook();

-- ============================================================================
-- O QUE FAZ
-- ============================================================================
-- Busca todas as pautas programadas para AMANHÃ
-- Envia para: https://webhooks.growave.com.br/webhook/PAUTAS
-- 
-- Formato do payload:
-- {
--   "tipo": "pautas_diarias",
--   "data": "2024-01-24",
--   "pautas": [
--     {
--       "titulo": "...",
--       "data_inicio": "...",
--       "data_fim": "...",
--       "equipe": {
--         "filmmaker": { "nome": "...", "telefone": "..." },
--         "fotografo": { "nome": "...", "telefone": "..." },
--         "jornalista": { "nome": "...", "telefone": "..." },
--         "rede": { "nome": "...", "telefone": "..." }
--       }
--     }
--   ]
-- }
-- ============================================================================
