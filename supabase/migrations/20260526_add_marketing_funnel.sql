-- 1. Adicionar colunas de controle de funil de marketing na tabela de clientes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_marketing_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS marketing_stage TEXT DEFAULT 'none';

-- 2. Criar função para atualizar estatísticas e resetar o funil de marketing ao concluir um agendamento
CREATE OR REPLACE FUNCTION update_client_stats_on_appointment_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Dispara apenas quando o status muda para 'concluido' ou 'completed'
    IF (TG_OP = 'UPDATE' AND NEW.status IN ('concluido', 'completed') AND (OLD.status IS NULL OR OLD.status NOT IN ('concluido', 'completed')))
       OR (TG_OP = 'INSERT' AND NEW.status IN ('concluido', 'completed')) THEN
        
        UPDATE clients
        SET 
            last_visit = NOW(),
            appointments_count = COALESCE(appointments_count, 0) + 1,
            total_spent = COALESCE(total_spent, 0) + COALESCE(NEW.price, 0) + COALESCE(NEW.additional_price, 0),
            marketing_stage = 'none',          -- Reseta o funil de marketing (cliente voltou!)
            last_marketing_sent_at = NULL       -- Limpa a data de último envio de marketing
        WHERE establishment_id = NEW.establishment_id
          AND NEW.client_phone IS NOT NULL
          AND REGEXP_REPLACE(REGEXP_REPLACE(phone, '\D', '', 'g'), '^55', '') = 
              REGEXP_REPLACE(REGEXP_REPLACE(NEW.client_phone, '\D', '', 'g'), '^55', '');
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar o trigger na tabela de agendamentos
DROP TRIGGER IF EXISTS trg_update_client_stats ON appointments;
CREATE TRIGGER trg_update_client_stats
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_client_stats_on_appointment_completion();
