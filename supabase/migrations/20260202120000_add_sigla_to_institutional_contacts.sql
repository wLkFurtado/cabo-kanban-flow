-- Adicionar coluna sigla à tabela institutional_contacts
ALTER TABLE public.institutional_contacts 
ADD COLUMN IF NOT EXISTS sigla TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.institutional_contacts.sigla IS 'Sigla ou abreviação da instituição';
