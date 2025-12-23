-- ============================================
-- RESET SCRIPT FOR SUPABASE
-- Run this FIRST to drop all existing tables
-- ============================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS set_timestamp_user ON "User";
DROP TRIGGER IF EXISTS set_timestamp_business_settings ON "BusinessSettings";
DROP TRIGGER IF EXISTS set_timestamp_team_member ON "TeamMember";
DROP TRIGGER IF EXISTS set_timestamp_subcontractor ON "Subcontractor";
DROP TRIGGER IF EXISTS set_timestamp_lead ON "Lead";
DROP TRIGGER IF EXISTS set_timestamp_estimate ON "Estimate";
DROP TRIGGER IF EXISTS set_timestamp_room_price ON "RoomPrice";
DROP TRIGGER IF EXISTS set_timestamp_exterior_price ON "ExteriorPrice";
DROP TRIGGER IF EXISTS set_timestamp_addon ON "Addon";
DROP TRIGGER IF EXISTS set_timestamp_vto ON "VTO";
DROP TRIGGER IF EXISTS set_timestamp_rock ON "Rock";
DROP TRIGGER IF EXISTS set_timestamp_todo ON "Todo";
DROP TRIGGER IF EXISTS set_timestamp_issue ON "Issue";
DROP TRIGGER IF EXISTS set_timestamp_seat ON "Seat";
DROP TRIGGER IF EXISTS set_timestamp_meeting ON "Meeting";
DROP TRIGGER IF EXISTS set_timestamp_scorecard_metric ON "ScorecardMetric";
DROP TRIGGER IF EXISTS set_timestamp_people_analyzer ON "PeopleAnalyzer";
DROP TRIGGER IF EXISTS set_timestamp_company_estimate_settings ON "CompanyEstimateSettings";
DROP TRIGGER IF EXISTS set_timestamp_job ON "Job";
DROP TRIGGER IF EXISTS set_timestamp_job_photo ON "JobPhoto";
DROP TRIGGER IF EXISTS set_timestamp_payment_history ON "PaymentHistory";
DROP TRIGGER IF EXISTS set_timestamp_marketing_spend ON "MarketingSpend";
DROP TRIGGER IF EXISTS set_timestamp_knowledge_article ON "KnowledgeArticle";

-- Drop function
DROP FUNCTION IF EXISTS trigger_set_timestamp();

-- Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS "AIMessage" CASCADE;
DROP TABLE IF EXISTS "AIConversation" CASCADE;
DROP TABLE IF EXISTS "PortfolioImage" CASCADE;
DROP TABLE IF EXISTS "CompanyEstimateSettings" CASCADE;
DROP TABLE IF EXISTS "PeopleAnalyzer" CASCADE;
DROP TABLE IF EXISTS "ScorecardEntry" CASCADE;
DROP TABLE IF EXISTS "ScorecardMetric" CASCADE;
DROP TABLE IF EXISTS "Meeting" CASCADE;
DROP TABLE IF EXISTS "Seat" CASCADE;
DROP TABLE IF EXISTS "Issue" CASCADE;
DROP TABLE IF EXISTS "Todo" CASCADE;
DROP TABLE IF EXISTS "Rock" CASCADE;
DROP TABLE IF EXISTS "VTO" CASCADE;
DROP TABLE IF EXISTS "Addon" CASCADE;
DROP TABLE IF EXISTS "ExteriorPrice" CASCADE;
DROP TABLE IF EXISTS "RoomPrice" CASCADE;
DROP TABLE IF EXISTS "PaymentHistory" CASCADE;
DROP TABLE IF EXISTS "JobPhoto" CASCADE;
DROP TABLE IF EXISTS "Job" CASCADE;
DROP TABLE IF EXISTS "EstimateSignature" CASCADE;
DROP TABLE IF EXISTS "EstimateLineItem" CASCADE;
DROP TABLE IF EXISTS "Estimate" CASCADE;
DROP TABLE IF EXISTS "Lead" CASCADE;
DROP TABLE IF EXISTS "Subcontractor" CASCADE;
DROP TABLE IF EXISTS "TeamMember" CASCADE;
DROP TABLE IF EXISTS "MarketingSpend" CASCADE;
DROP TABLE IF EXISTS "KnowledgeArticle" CASCADE;
DROP TABLE IF EXISTS "BusinessSettings" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop all enums
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "TeamRole" CASCADE;
DROP TYPE IF EXISTS "SubcontractorType" CASCADE;
DROP TYPE IF EXISTS "LeadStatus" CASCADE;
DROP TYPE IF EXISTS "ProjectType" CASCADE;
DROP TYPE IF EXISTS "EstimateStatus" CASCADE;
DROP TYPE IF EXISTS "Scope" CASCADE;
DROP TYPE IF EXISTS "JobStatus" CASCADE;
DROP TYPE IF EXISTS "ProfitFlag" CASCADE;
DROP TYPE IF EXISTS "AddonCategory" CASCADE;
DROP TYPE IF EXISTS "RockType" CASCADE;
DROP TYPE IF EXISTS "RockStatus" CASCADE;
DROP TYPE IF EXISTS "TodoStatus" CASCADE;
DROP TYPE IF EXISTS "IssueType" CASCADE;
DROP TYPE IF EXISTS "IssueStatus" CASCADE;
DROP TYPE IF EXISTS "MeetingType" CASCADE;
DROP TYPE IF EXISTS "GoalType" CASCADE;
DROP TYPE IF EXISTS "GoalDirection" CASCADE;
DROP TYPE IF EXISTS "MetricCategory" CASCADE;
DROP TYPE IF EXISTS "PersonStatus" CASCADE;
DROP TYPE IF EXISTS "AIRole" CASCADE;
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
DROP TYPE IF EXISTS "PaymentType" CASCADE;
DROP TYPE IF EXISTS "PhotoType" CASCADE;

-- ============================================
-- Now you can run the main schema file
-- ============================================
