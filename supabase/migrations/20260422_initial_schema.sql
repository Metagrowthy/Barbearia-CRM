-- Initial Schema for Royal Precision CRM

-- 1. Services Table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    duration TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inventory Table (Drinks and Supplies)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('drink', 'supply')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    last_visit TIMESTAMP WITH TIME ZONE,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    appointments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Barbers Table
CREATE TABLE barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialty TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Appointments Table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    barber_id UUID REFERENCES barbers(id),
    service_id UUID REFERENCES services(id),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Basic Public Access Policy (for demo purposes, restrict in production)
CREATE POLICY "Enable all access for local development" ON services FOR ALL USING (true);
CREATE POLICY "Enable all access for local development" ON inventory FOR ALL USING (true);
CREATE POLICY "Enable all access for local development" ON clients FOR ALL USING (true);
CREATE POLICY "Enable all access for local development" ON barbers FOR ALL USING (true);
CREATE POLICY "Enable all access for local development" ON appointments FOR ALL USING (true);

-- Insert Initial Mock Data
INSERT INTO barbers (name, specialty) VALUES 
('Arthur Morgan', 'Cortes Clássicos'),
('John Marston', 'Cabelo & Barba'),
('Sadie Adler', 'Estilo Moderno');

INSERT INTO services (name, duration, price, category) VALUES 
('Corte Masculino', '45 min', 60.00, 'Cabelo'),
('Barba Profissional', '30 min', 45.00, 'Barba'),
('Combo (Corte + Barba)', '75 min', 95.00, 'Combos'),
('Hidratação Capilar', '25 min', 40.00, 'Tratamentos');

INSERT INTO inventory (name, price, category, stock, type) VALUES 
('Cerveja Stella Artois', 12.00, 'Cerveja', 24, 'drink'),
('Coca-Cola 350ml', 6.50, 'Refrigerante', 15, 'drink'),
('Água Mineral', 4.00, 'Água', 30, 'drink'),
('Pomada Modeladora Matte', 45.00, 'Cabelo', 2, 'supply'),
('Minoxidil 5% (Frasco)', 85.00, 'Barba', 8, 'supply'),
('Creme de Barbear Premium', 35.00, 'Barba', 10, 'supply');
