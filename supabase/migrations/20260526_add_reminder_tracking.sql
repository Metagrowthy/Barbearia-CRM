-- Adicionar colunas de controle de envio de notificações na tabela de agendamentos
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS post_sale_sent BOOLEAN DEFAULT FALSE;
