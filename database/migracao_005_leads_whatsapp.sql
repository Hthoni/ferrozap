CREATE TABLE IF NOT EXISTS leads_whatsapp (
    id SERIAL PRIMARY KEY,
    usuario_final_id INT NOT NULL REFERENCES usuarios_finais(id),
    empresa_id INT NOT NULL REFERENCES empresas(id),
    veiculo_desmonte_id INT NOT NULL REFERENCES veiculos_desmonte(id),
    descricao_peca TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_empresa ON leads_whatsapp (empresa_id);
