-- ========================================
-- LIMPAR DUPLICADOS EM system_users
-- Mantém apenas o registro mais recente
-- Execute no Supabase SQL Editor
-- ========================================

-- 1. Ver duplicados por professional_id
SELECT professional_id, COUNT(*) as qtd 
FROM system_users 
WHERE professional_id IS NOT NULL
GROUP BY professional_id 
HAVING COUNT(*) > 1;

-- 2. Deletar duplicados por professional_id (manter o mais recente)
DELETE FROM system_users 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY professional_id ORDER BY created_at DESC) as rn
    FROM system_users
    WHERE professional_id IS NOT NULL
  ) t WHERE rn > 1
);

-- 3. Deletar duplicados por ci (manter o mais recente)
DELETE FROM system_users 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY ci ORDER BY created_at DESC) as rn
    FROM system_users
    WHERE ci IS NOT NULL
  ) t WHERE rn > 1
);

-- 4. Verificar resultado
SELECT id, system_role, ci, location, professional_id, created_at 
FROM system_users 
ORDER BY created_at DESC;
