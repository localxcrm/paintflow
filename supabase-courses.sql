-- =====================================================
-- SISTEMA DE CURSOS DE TREINAMENTO
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Criar tabela de Cursos
CREATE TABLE IF NOT EXISTS "TrainingCourse" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "coverImage" TEXT,
  "order" INTEGER DEFAULT 0,
  "isPublished" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar coluna courseId na tabela de modulos
ALTER TABLE "SubcontractorTraining"
ADD COLUMN IF NOT EXISTS "courseId" UUID REFERENCES "TrainingCourse"("id") ON DELETE SET NULL;

-- 3. Criar indice para performance
CREATE INDEX IF NOT EXISTS "idx_training_course_org" ON "TrainingCourse"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_training_module_course" ON "SubcontractorTraining"("courseId");

-- 4. Enable RLS
ALTER TABLE "TrainingCourse" ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies para TrainingCourse
CREATE POLICY "Allow all for authenticated users on TrainingCourse"
ON "TrainingCourse"
FOR ALL
USING (true)
WITH CHECK (true);
