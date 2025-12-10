-- Migration: Add trashRetentionDays column to users table
-- Date: 2024-12-09
-- Description: Adds trashRetentionDays column to allow users to configure personal trash retention period

-- Add trashRetentionDays column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trash_retention_days INTEGER NULL;

-- Add check constraint to ensure positive values
ALTER TABLE users 
ADD CONSTRAINT chk_trash_retention_days_positive 
CHECK (trash_retention_days IS NULL OR trash_retention_days > 0);

-- Add comment for documentation
COMMENT ON COLUMN users.trash_retention_days IS 'Number of days before files are permanently deleted from trash (user-specific override)';
