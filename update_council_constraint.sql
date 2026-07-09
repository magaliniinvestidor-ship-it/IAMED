-- ========================================
-- ATUALIZAR CHECK CONSTRAINT DA COLUNA council
-- Execute ANTES do seed de profissionais
-- ========================================

-- Primeiro, remover a constraint antiga
ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_council_check;

-- Criar nova constraint com todos os conselhos permitidos
ALTER TABLE professionals ADD CONSTRAINT professionals_council_check 
CHECK (council IN (
  'CRM',
  'COREN',
  'CREFITO',
  'CFP',
  'CFN',
  'CRO',
  'CRESS',
  'CRFa',
  'CRF',
  'CRBM',
  'CREF',
  'N/A'
));
