-- Migration for Multi-tenancy and RBAC
-- Run this in your Supabase SQL Editor

-- 1. Create Establishments Table
CREATE TABLE IF NOT EXISTS establishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    establishment_id UUID REFERENCES establishments(id),
    full_name TEXT,
    role TEXT DEFAULT 'employee' CHECK (role IN ('owner', 'employee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add establishment_id to existing tables
-- We use DO blocks to avoid errors if columns already exist

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='establishment_id') THEN
        ALTER TABLE services ADD COLUMN establishment_id UUID REFERENCES establishments(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory' AND column_name='establishment_id') THEN
        ALTER TABLE inventory ADD COLUMN establishment_id UUID REFERENCES establishments(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='establishment_id') THEN
        ALTER TABLE clients ADD COLUMN establishment_id UUID REFERENCES establishments(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='barbers' AND column_name='establishment_id') THEN
        ALTER TABLE barbers ADD COLUMN establishment_id UUID REFERENCES establishments(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='establishment_id') THEN
        ALTER TABLE appointments ADD COLUMN establishment_id UUID REFERENCES establishments(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_records' AND column_name='establishment_id') THEN
        ALTER TABLE financial_records ADD COLUMN establishment_id UUID REFERENCES establishments(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='business_hours' AND column_name='establishment_id') THEN
        ALTER TABLE business_hours ADD COLUMN establishment_id UUID REFERENCES establishments(id);
    END IF;
END $$;

-- 4. Enable RLS on new tables
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS Policies for Multi-tenancy
-- Note: These policies assume the user has a profile with the correct establishment_id

-- Establishments: Users can see the establishment they belong to
CREATE POLICY "Users can view their own establishment" ON establishments
    FOR SELECT USING (
        id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid())
    );

-- Profiles: Users can see their own profile
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Common Policy Pattern for other tables:
-- "Allow access if user belongs to the same establishment"

CREATE POLICY "Multi-tenant access for services" ON services
    FOR ALL USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Multi-tenant access for inventory" ON inventory
    FOR ALL USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Multi-tenant access for clients" ON clients
    FOR ALL USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Multi-tenant access for barbers" ON barbers
    FOR ALL USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Multi-tenant access for appointments" ON appointments
    FOR ALL USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Multi-tenant access for financial_records" ON financial_records
    FOR ALL USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Multi-tenant access for business_hours" ON business_hours
    FOR ALL USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));
