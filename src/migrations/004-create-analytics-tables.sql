-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_node_id UUID REFERENCES file_node(id) ON DELETE SET NULL,
    bytes_transferred BIGINT,
    ip_address VARCHAR,
    user_agent VARCHAR,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type_created_at ON analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id_created_at ON analytics_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_file_node_id_created_at ON analytics_events(file_node_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Create daily_metrics table
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_uploads INTEGER DEFAULT 0,
    total_downloads INTEGER DEFAULT 0,
    total_bytes_uploaded BIGINT DEFAULT 0,
    total_bytes_downloaded BIGINT DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    total_files INTEGER DEFAULT 0,
    total_storage_used BIGINT DEFAULT 0,
    share_links_created INTEGER DEFAULT 0,
    total_share_links INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    transactions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for daily_metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to analytics_events
DROP TRIGGER IF EXISTS update_analytics_events_updated_at ON analytics_events;
CREATE TRIGGER update_analytics_events_updated_at
    BEFORE UPDATE ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to daily_metrics
DROP TRIGGER IF EXISTS update_daily_metrics_updated_at ON daily_metrics;
CREATE TRIGGER update_daily_metrics_updated_at
    BEFORE UPDATE ON daily_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();