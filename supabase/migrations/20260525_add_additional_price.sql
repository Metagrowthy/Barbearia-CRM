-- Adiciona coluna de preço adicional (gorjeta/extra) na tabela appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS additional_price DECIMAL(10, 2) DEFAULT 0;

-- Adiciona coluna de preço adicional na tabela financial_records para rastreamento no fluxo de caixa
ALTER TABLE financial_records ADD COLUMN IF NOT EXISTS additional_price DECIMAL(10, 2) DEFAULT 0;
