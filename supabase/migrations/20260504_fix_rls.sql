-- Migration to fix RLS for business_hours and ensure other tables are accessible
-- Migration to fix RLS for all tables and ensure full access for development
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Enable all access for local development" ON %I', table_name);
        EXECUTE format('CREATE POLICY "Enable all access for local development" ON %I FOR ALL TO public USING (true) WITH CHECK (true)', table_name);
    END LOOP;
END $$;
