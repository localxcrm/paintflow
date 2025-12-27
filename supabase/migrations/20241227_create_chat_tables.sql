-- Create Chat table
-- Each Work Order has one Chat for communication between company and subcontractor
CREATE TABLE IF NOT EXISTS "Chat" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "workOrderId" UUID NOT NULL REFERENCES "WorkOrder"("id") ON DELETE CASCADE,
    "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "subcontractorId" UUID REFERENCES "Subcontractor"("id") ON DELETE SET NULL,
    "lastMessageAt" TIMESTAMP WITH TIME ZONE,
    "lastMessagePreview" TEXT,
    "unreadCountCompany" INTEGER NOT NULL DEFAULT 0,
    "unreadCountSubcontractor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE("workOrderId")
);

-- Create ChatMessage table
CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "chatId" UUID NOT NULL REFERENCES "Chat"("id") ON DELETE CASCADE,
    "authorId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
    "authorName" TEXT NOT NULL,
    "authorType" TEXT NOT NULL CHECK ("authorType" IN ('company', 'subcontractor')),
    "text" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text' CHECK ("type" IN ('text', 'audio', 'image', 'video')),
    "mediaUrl" TEXT,
    "mediaPath" TEXT,
    "mediaDuration" INTEGER,
    "mediaThumbnail" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_chat_organization" ON "Chat"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_chat_subcontractor" ON "Chat"("subcontractorId");
CREATE INDEX IF NOT EXISTS "idx_chat_workorder" ON "Chat"("workOrderId");
CREATE INDEX IF NOT EXISTS "idx_chat_last_message" ON "Chat"("lastMessageAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_chatmessage_chat" ON "ChatMessage"("chatId");
CREATE INDEX IF NOT EXISTS "idx_chatmessage_created" ON "ChatMessage"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_chatmessage_unread" ON "ChatMessage"("chatId", "isRead") WHERE "isRead" = FALSE;

-- Enable RLS
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Chat
CREATE POLICY "Chat access for organization members" ON "Chat"
    FOR ALL USING (
        "organizationId" IN (
            SELECT "organizationId" FROM "User" WHERE "id" = auth.uid()
        )
    );

CREATE POLICY "Chat access for subcontractors" ON "Chat"
    FOR ALL USING (
        "subcontractorId" IN (
            SELECT "id" FROM "Subcontractor" WHERE "userId" = auth.uid()
        )
    );

-- RLS Policies for ChatMessage
CREATE POLICY "ChatMessage access via Chat" ON "ChatMessage"
    FOR ALL USING (
        "chatId" IN (
            SELECT "id" FROM "Chat" WHERE
                "organizationId" IN (SELECT "organizationId" FROM "User" WHERE "id" = auth.uid())
                OR "subcontractorId" IN (SELECT "id" FROM "Subcontractor" WHERE "userId" = auth.uid())
        )
    );

-- Function to update Chat lastMessageAt and preview when a message is sent
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "Chat"
    SET
        "lastMessageAt" = NEW."createdAt",
        "lastMessagePreview" = CASE
            WHEN NEW."type" = 'text' THEN LEFT(NEW."text", 100)
            WHEN NEW."type" = 'audio' THEN '🎤 Áudio'
            WHEN NEW."type" = 'image' THEN '📷 Imagem'
            WHEN NEW."type" = 'video' THEN '🎥 Vídeo'
            ELSE ''
        END,
        "updatedAt" = NOW(),
        -- Increment unread count for the other party
        "unreadCountCompany" = CASE
            WHEN NEW."authorType" = 'subcontractor' THEN "unreadCountCompany" + 1
            ELSE "unreadCountCompany"
        END,
        "unreadCountSubcontractor" = CASE
            WHEN NEW."authorType" = 'company' THEN "unreadCountSubcontractor" + 1
            ELSE "unreadCountSubcontractor"
        END
    WHERE "id" = NEW."chatId";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update chat on new message
DROP TRIGGER IF EXISTS trigger_update_chat_last_message ON "ChatMessage";
CREATE TRIGGER trigger_update_chat_last_message
    AFTER INSERT ON "ChatMessage"
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_message();

-- Add comment
COMMENT ON TABLE "Chat" IS 'Chat conversations linked to Work Orders for company-subcontractor communication';
COMMENT ON TABLE "ChatMessage" IS 'Individual messages within a Chat conversation';
