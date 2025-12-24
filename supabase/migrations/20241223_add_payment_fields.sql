-- ============================================
-- Migration: Add Payment Tracking Fields to Job
-- Date: 2024-12-23
-- Description: Adds fields for payment methods, dates, and history
-- ============================================

-- Add payment method and date fields for deposits
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "depositPaymentMethod" TEXT CHECK ("depositPaymentMethod" IN ('pix', 'credit_card', 'debit_card', 'cash', 'check', 'bank_transfer'));
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "depositPaymentDate" DATE;

-- Add payment method and date fields for final job payment
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "jobPaymentMethod" TEXT CHECK ("jobPaymentMethod" IN ('pix', 'credit_card', 'debit_card', 'cash', 'check', 'bank_transfer'));
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "jobPaymentDate" DATE;

-- Add payment history as JSONB for tracking all transactions
-- Structure: [{id, date, type, method, amount, notes}]
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "paymentHistory" JSONB DEFAULT '[]';

-- Add photos array for job documentation
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "photos" JSONB DEFAULT '[]';

-- Add index for payment status queries
CREATE INDEX IF NOT EXISTS "idx_job_payment_status" ON "Job" ("depositPaid", "jobPaid", "organizationId");
