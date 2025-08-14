-- Initialize PostgreSQL database for Government Platform

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create database user for application (if not exists)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'gov_app') THEN
      
      CREATE ROLE gov_app LOGIN PASSWORD 'gov_app_password';
   END IF;
END
$do$;

-- Grant permissions
GRANT CONNECT ON DATABASE gov_platform TO gov_app;
GRANT USAGE ON SCHEMA public TO gov_app;
GRANT CREATE ON SCHEMA public TO gov_app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gov_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO gov_app;

-- Create indexes for better performance
-- These will be created after tables are set up by Drizzle migrations

-- Set timezone
SET timezone = 'Europe/Moscow';

-- Create audit trigger function for tracking changes
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable WAL level for logical replication (useful for scaling)
-- This requires restart: wal_level = logical

-- Performance settings (should be in postgresql.conf)
-- shared_buffers = 256MB
-- effective_cache_size = 1GB
-- maintenance_work_mem = 64MB
-- checkpoint_completion_target = 0.9
-- wal_buffers = 16MB
-- default_statistics_target = 100
-- random_page_cost = 1.1
-- effective_io_concurrency = 200
