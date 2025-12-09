-- Migration: Backfill scheduledDeletionAt for existing trash files
-- Date: 2024-12-09
-- Description: Calculate and set scheduledDeletionAt for files already in trash

-- Update existing trashed files with scheduledDeletionAt
-- Uses deletedAt + 30 days as the default retention period
UPDATE file_node
SET scheduled_deletion_at = deleted_at + INTERVAL '30 days'
WHERE is_delete = true 
  AND scheduled_deletion_at IS NULL
  AND deleted_at IS NOT NULL;

-- Log the number of updated records
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled scheduledDeletionAt for % files', updated_count;
END $$;
