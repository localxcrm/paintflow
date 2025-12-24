-- SQL para criar tabela OSTemplate no Supabase
-- Execute este SQL no console do Supabase (SQL Editor)

-- Criar tabela OSTemplate
CREATE TABLE IF NOT EXISTS public."OSTemplate" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "organizationId" TEXT NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rooms JSONB DEFAULT '[]'::jsonb,
    tasks JSONB DEFAULT '[]'::jsonb,
    materials JSONB DEFAULT '[]'::jsonb,
    "estimatedDuration" INTEGER,
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("organizationId", name)
);

-- Índice para busca por organização
CREATE INDEX IF NOT EXISTS idx_os_template_org ON public."OSTemplate"("organizationId");

-- Índice para busca de template padrão
CREATE INDEX IF NOT EXISTS idx_os_template_default ON public."OSTemplate"("organizationId", "isDefault") WHERE "isDefault" = true;

-- Habilitar RLS (Row Level Security)
ALTER TABLE public."OSTemplate" ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT (leitura)
CREATE POLICY "os_template_select_policy" ON public."OSTemplate"
    FOR SELECT
    USING (true);

-- Policy para INSERT (inserção)
CREATE POLICY "os_template_insert_policy" ON public."OSTemplate"
    FOR INSERT
    WITH CHECK (true);

-- Policy para UPDATE (atualização)
CREATE POLICY "os_template_update_policy" ON public."OSTemplate"
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy para DELETE (exclusão)
CREATE POLICY "os_template_delete_policy" ON public."OSTemplate"
    FOR DELETE
    USING (true);

-- Comentário na tabela
COMMENT ON TABLE public."OSTemplate" IS 'Templates de Ordem de Serviço para configurações padrão';
