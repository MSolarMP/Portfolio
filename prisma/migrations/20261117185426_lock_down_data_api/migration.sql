-- Lock the database down to server-side access only.
--
-- The app connects directly as the table owner through Prisma, so it is not
-- affected by any of this. Supabase also exposes every table in `public`
-- through its auto-generated REST/GraphQL Data API using the `anon` and
-- `authenticated` roles. Nothing in this app uses that API, so we:
--   1. enable Row Level Security on every table with no policies (deny all), and
--   2. revoke the API roles' privileges on existing and future objects.

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END
$$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Tables created by future migrations (run as this same role) start locked too.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
