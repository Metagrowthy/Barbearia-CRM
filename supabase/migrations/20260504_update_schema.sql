-- Migration to align appointments table with app usage and add missing features
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS barber_name TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'app';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS color_class TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Update status check to be more inclusive if needed, but let's stick to what's requested
-- The app uses 'confirmado', 'cancelado', 'pendente', 'em-andamento'
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('confirmado', 'cancelado', 'pendente', 'em-andamento', 'scheduled', 'completed', 'cancelled'));

-- Barbers table: Add color
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS color TEXT;

-- Business Hours Table
CREATE TABLE IF NOT EXISTS business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL, -- 0 (Sunday) to 6 (Saturday)
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    UNIQUE(day_of_week)
);

-- Seed Business Hours
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed)
VALUES 
(0, NULL, NULL, TRUE), -- Sunday closed
(1, '08:00', '19:00', FALSE),
(2, '08:00', '19:00', FALSE),
(3, '08:00', '19:00', FALSE),
(4, '08:00', '19:00', FALSE),
(5, '08:00', '19:00', FALSE),
(6, '08:00', '14:00', FALSE)
ON CONFLICT (day_of_week) DO NOTHING;
