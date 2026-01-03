-- Set passwords for Supabase roles and create realtime schema
-- This script runs after the Supabase postgres image's init scripts
-- which create the roles but don't set passwords

\set pgpass `echo "$POSTGRES_PASSWORD"`

-- Core roles that always exist
ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';

-- Create realtime schema for Supabase Realtime service
CREATE SCHEMA IF NOT EXISTS _realtime;
ALTER SCHEMA _realtime OWNER TO supabase_admin;

-- Optional role (only exists if pg_net extension is installed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_functions_admin') THEN
    EXECUTE format('ALTER USER supabase_functions_admin WITH PASSWORD %L',
                   current_setting('app.settings.pgpass', true));
  END IF;
END
$$;
