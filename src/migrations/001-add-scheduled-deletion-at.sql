-- Migration: Add scheduledDeletionAt column to file_node table
-- Date: 2024-12-09
-- Description: Adds scheduledDeletionAt column to support configurable trash retention

-- Add scheduledDeletionAt column
ALTER TABLE file_node 
ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMPTZ NULL;

-- Add index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_file_node_scheduled_deletion_at 
ON file_node(scheduled_deletion_at) 
WHERE scheduled_deletion_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN file_node.scheduled_deletion_at IS 'The calculated date when a file in trash will be permanently deleted';
