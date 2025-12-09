# Database Migrations

This directory contains SQL migration scripts for the trash retention configuration feature.

## Running Migrations

Execute the migrations in order using your PostgreSQL client:

```bash
# Connect to your database
psql -U your_username -d your_database

# Run migrations in order
\i src/migrations/001-add-scheduled-deletion-at.sql
\i src/migrations/002-add-trash-retention-days.sql
\i src/migrations/003-backfill-scheduled-deletion-at.sql
```

Or using a single command:

```bash
psql -U your_username -d your_database -f src/migrations/001-add-scheduled-deletion-at.sql
psql -U your_username -d your_database -f src/migrations/002-add-trash-retention-days.sql
psql -U your_username -d your_database -f src/migrations/003-backfill-scheduled-deletion-at.sql
```

## Migration Details

### 001-add-scheduled-deletion-at.sql

- Adds `scheduled_deletion_at` column to `file_node` table
- Creates index for efficient cron job queries
- Adds column documentation

### 002-add-trash-retention-days.sql

- Adds `trash_retention_days` column to `users` table
- Adds check constraint to ensure positive values
- Adds column documentation

### 003-backfill-scheduled-deletion-at.sql

- Backfills `scheduled_deletion_at` for existing trashed files
- Uses `deleted_at + 30 days` as default
- Logs number of updated records

## Verification

After running migrations, verify the changes:

```sql
-- Check file_node table
\d file_node

-- Check users table
\d users

-- Verify backfill
SELECT COUNT(*) FROM file_node
WHERE is_delete = true AND scheduled_deletion_at IS NOT NULL;
```

## Rollback

If you need to rollback the migrations:

```sql
-- Remove scheduled_deletion_at column
ALTER TABLE file_node DROP COLUMN IF EXISTS scheduled_deletion_at;
DROP INDEX IF EXISTS idx_file_node_scheduled_deletion_at;

-- Remove trash_retention_days column
ALTER TABLE users DROP COLUMN IF EXISTS trash_retention_days;
```
