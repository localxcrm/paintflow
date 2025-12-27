-- Migration script to move existing WorkOrder comments to Chat/ChatMessage tables
-- This runs AFTER the chat tables are created

-- Step 1: Create a Chat for each WorkOrder that has comments or a subcontractor assigned
INSERT INTO "Chat" ("workOrderId", "organizationId", "subcontractorId", "createdAt", "updatedAt")
SELECT DISTINCT
    wo."id" as "workOrderId",
    wo."organizationId",
    wo."assignedSubcontractorId" as "subcontractorId",
    wo."createdAt",
    NOW()
FROM "WorkOrder" wo
WHERE wo."assignedSubcontractorId" IS NOT NULL
   OR (wo."comments" IS NOT NULL AND jsonb_array_length(wo."comments") > 0)
ON CONFLICT ("workOrderId") DO NOTHING;

-- Step 2: Migrate comments from WorkOrder.comments JSONB array to ChatMessage table
-- This uses a lateral join to unnest the JSONB array
INSERT INTO "ChatMessage" (
    "chatId",
    "authorName",
    "authorType",
    "text",
    "type",
    "mediaUrl",
    "mediaPath",
    "mediaDuration",
    "mediaThumbnail",
    "isRead",
    "createdAt"
)
SELECT
    c."id" as "chatId",
    COALESCE(comment->>'author', 'Unknown') as "authorName",
    COALESCE(comment->>'authorType', 'company') as "authorType",
    comment->>'text' as "text",
    COALESCE(comment->>'type', 'text') as "type",
    comment->>'mediaUrl' as "mediaUrl",
    comment->>'mediaPath' as "mediaPath",
    (comment->>'mediaDuration')::INTEGER as "mediaDuration",
    comment->>'mediaThumbnail' as "mediaThumbnail",
    TRUE as "isRead", -- Mark all migrated messages as read
    COALESCE(
        (comment->>'createdAt')::TIMESTAMP WITH TIME ZONE,
        NOW()
    ) as "createdAt"
FROM "WorkOrder" wo
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(wo."comments", '[]'::jsonb)) as comment
JOIN "Chat" c ON c."workOrderId" = wo."id"
WHERE wo."comments" IS NOT NULL
  AND jsonb_array_length(wo."comments") > 0;

-- Step 3: Update Chat lastMessageAt and lastMessagePreview based on migrated messages
UPDATE "Chat" c
SET
    "lastMessageAt" = subq."lastMessageAt",
    "lastMessagePreview" = subq."lastMessagePreview"
FROM (
    SELECT
        cm."chatId",
        cm."createdAt" as "lastMessageAt",
        CASE
            WHEN cm."type" = 'text' THEN LEFT(cm."text", 100)
            WHEN cm."type" = 'audio' THEN '🎤 Áudio'
            WHEN cm."type" = 'image' THEN '📷 Imagem'
            WHEN cm."type" = 'video' THEN '🎥 Vídeo'
            ELSE ''
        END as "lastMessagePreview"
    FROM "ChatMessage" cm
    WHERE cm."createdAt" = (
        SELECT MAX("createdAt")
        FROM "ChatMessage"
        WHERE "chatId" = cm."chatId"
    )
) subq
WHERE c."id" = subq."chatId";

-- Log migration results
DO $$
DECLARE
    chat_count INTEGER;
    message_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO chat_count FROM "Chat";
    SELECT COUNT(*) INTO message_count FROM "ChatMessage";
    RAISE NOTICE 'Migration complete: % chats created, % messages migrated', chat_count, message_count;
END $$;
