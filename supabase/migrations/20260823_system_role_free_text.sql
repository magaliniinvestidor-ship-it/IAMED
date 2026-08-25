-- Funções de usuário personalizadas (Módulo 14)
-- A tabela system_users foi criada manualmente com um CHECK fixo na coluna
-- system_role, bloqueando papéis fora da lista original. Como a função agora
-- é texto livre escolhido no formulário (validação Zod: 1..60 chars),
-- a constraint antiga é substituída por uma verificação de formato mínimo.

ALTER TABLE system_users
  DROP CONSTRAINT IF EXISTS system_users_system_role_check;

ALTER TABLE system_users
  ADD CONSTRAINT system_users_system_role_check
  CHECK (system_role IS NOT NULL AND char_length(system_role) BETWEEN 2 AND 60);
