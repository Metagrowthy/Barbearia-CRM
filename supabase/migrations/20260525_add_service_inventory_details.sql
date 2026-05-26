-- Adiciona coluna de descrição e URL da imagem na tabela services
ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Adiciona coluna de descrição e URL da imagem na tabela inventory
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS image_url TEXT;
