-- ========================================
-- MIGRATION: Prevenir duplicados em system_users
-- IMPORTANTE: Execute cleanup_duplicates.sql PRIMEIRO
-- ========================================

-- Verificar se ainda há duplicados antes de criar a constraint
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT professional_id FROM system_users 
    WHERE professional_id IS NOT NULL 
    GROUP BY professional_id HAVING COUNT(*) > 1
  ) t;
  
  IF dup_count > 0 THEN
    RAISE NOTICE 'Ainda existem % professional_ids duplicados. Limpe os dados primeiro.', dup_count;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'system_users_professional_id_unique'
    ) THEN
      ALTER TABLE system_users 
      ADD CONSTRAINT system_users_professional_id_unique 
      UNIQUE (professional_id);
      RAISE NOTICE 'Constraint criada com sucesso.';
    END IF;
  END IF;
END $$;
