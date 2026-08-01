-- Rodar uma vez no SQL Editor do Supabase, no banco já existente.
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS lida BOOLEAN NOT NULL DEFAULT FALSE;
