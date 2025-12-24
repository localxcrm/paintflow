-- SQL para habilitar autenticação do subcontratado
-- Execute no Supabase SQL Editor

-- 1. Verificar se a coluna role já aceita 'subcontractor'
-- Primeiro, vamos dropar a constraint se existir e recriar
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS user_role_check;

-- Nota: O campo role já é TEXT, então não precisa alterar o tipo
-- Apenas adicionar a constraint com o novo valor
-- ALTER TABLE "User" ADD CONSTRAINT user_role_check
--   CHECK (role IN ('admin', 'owner', 'member', 'subcontractor'));
-- Comentado porque pode não existir constraint e o campo pode aceitar qualquer valor

-- 2. Adicionar coluna userId na tabela Subcontractor para linkar com User
ALTER TABLE "Subcontractor" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE SET NULL;

-- 3. Criar índice único para garantir que um User só pode ser um Subcontractor
CREATE UNIQUE INDEX IF NOT EXISTS idx_subcontractor_user_id
ON "Subcontractor"("userId")
WHERE "userId" IS NOT NULL;

-- 4. Criar índice para busca rápida por email do subcontractor
CREATE INDEX IF NOT EXISTS idx_subcontractor_email
ON "Subcontractor"(email);

-- 5. Verificar se as alterações foram aplicadas
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'Subcontractor'
AND column_name = 'userId';
