-- Rodar uma vez no SQL Editor do Supabase, no banco já existente.
-- (Em instalação nova, schema.sql já vem com esses campos.)

ALTER TABLE usuarios_finais ADD COLUMN IF NOT EXISTS email VARCHAR(120);
ALTER TABLE usuarios_finais ADD COLUMN IF NOT EXISTS aceite_termos BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios_finais ADD COLUMN IF NOT EXISTS aceite_promocional BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios_finais ADD COLUMN IF NOT EXISTS aceite_termos_em TIMESTAMP;
ALTER TABLE usuarios_finais ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;

-- Se já existirem contas cadastradas sem e-mail, o UNIQUE abaixo falha.
-- Rode isso só depois de confirmar que não há linha com email NULL,
-- ou trate manualmente as linhas antigas primeiro.
ALTER TABLE usuarios_finais ADD CONSTRAINT usuarios_finais_email_key UNIQUE (email);
