-- Telefone passa a ser o identificador central de login da empresa
-- (antes era e-mail). Precisa ser único e obrigatório.

-- 1) Rode isso primeiro, pra ver se alguma empresa já cadastrada
--    está sem telefone (o campo era opcional até agora):
SELECT id, nome, email, telefone FROM empresas WHERE telefone IS NULL OR telefone = '';

-- 2) Se a consulta acima voltar alguma linha, preencha manualmente
--    o telefone dessas empresas antes de continuar (ex: usando o
--    telefone que está no cadastro do Detran, ou contatando a
--    empresa) — os dois comandos abaixo vão FALHAR se ainda houver
--    linha com telefone vazio.

ALTER TABLE empresas ALTER COLUMN telefone SET NOT NULL;
ALTER TABLE empresas ADD CONSTRAINT empresas_telefone_key UNIQUE (telefone);
