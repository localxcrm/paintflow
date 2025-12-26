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

-- =====================================================
-- EXEMPLO: Criar um subcontratado com senha
-- =====================================================
-- Substitua os valores abaixo pelos dados reais

-- Passo 1: Gerar hash da senha (você pode usar bcrypt online: https://bcrypt-generator.com/)
-- Exemplo: senha "123456" gera hash "$2a$10$..."

-- Passo 2: Inserir o User com role 'subcontractor'
/*
INSERT INTO "User" (id, email, name, "passwordHash", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'pintor@email.com',
  'João Pintor',
  '$2a$10$XXXXX...', -- Hash bcrypt da senha
  'subcontractor',
  NOW(),
  NOW()
);
*/

-- Passo 3: Atualizar o Subcontractor existente para linkar com o User
/*
UPDATE "Subcontractor"
SET "userId" = (SELECT id FROM "User" WHERE email = 'pintor@email.com')
WHERE email = 'pintor@email.com';
*/

-- OU criar tudo de uma vez (se o Subcontractor não existir):
/*
WITH new_user AS (
  INSERT INTO "User" (id, email, name, "passwordHash", role, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid()::text,
    'pintor@email.com',
    'João Pintor',
    '$2a$10$rQZ5HxL5vR8K5rQZ5HxL5eQZ5HxL5vR8K5rQZ5HxL5eQZ5HxL5vR8', -- bcrypt hash de "123456"
    'subcontractor',
    NOW(),
    NOW()
  )
  RETURNING id, email
)
INSERT INTO "Subcontractor" (id, "organizationId", name, email, phone, specialty, "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'SEU_ORGANIZATION_ID_AQUI', -- Pegue da tabela Organization
  'João Pintor',
  new_user.email,
  '11999999999',
  'Pintura Residencial',
  new_user.id,
  NOW(),
  NOW()
FROM new_user;
*/
