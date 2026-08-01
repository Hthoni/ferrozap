-- Ferrozap — schema inicial (PostgreSQL)
-- Consolida as decisões de arquitetura registradas em docs/decisoes.md

-- ============================================================
-- Catálogo de veículos
-- ============================================================

CREATE TABLE fabricantes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE modelos (
    id SERIAL PRIMARY KEY,
    fabricante_id INT NOT NULL REFERENCES fabricantes(id),
    nome VARCHAR(50) NOT NULL,
    tem_submodelo_relevante BOOLEAN DEFAULT FALSE,
    UNIQUE (fabricante_id, nome)
);

CREATE TABLE submodelos (
    id SERIAL PRIMARY KEY,
    modelo_id INT NOT NULL REFERENCES modelos(id),
    nome VARCHAR(50) NOT NULL,
    UNIQUE (modelo_id, nome)
);

-- Camada opcional de refinamento. Populada aos poucos; ano/tolerância
-- é usado como fallback quando um modelo ainda não tem geração mapeada.
CREATE TABLE geracoes (
    id SERIAL PRIMARY KEY,
    modelo_id INT NOT NULL REFERENCES modelos(id),
    nome VARCHAR(30) NOT NULL,
    ano_inicio INT NOT NULL,
    ano_fim INT NOT NULL,
    CHECK (ano_fim >= ano_inicio),
    UNIQUE (modelo_id, nome)
);
CREATE INDEX idx_geracoes_modelo_range ON geracoes (modelo_id, ano_inicio, ano_fim);

-- ============================================================
-- Empresas (ferro-velhos)
-- ============================================================

CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    credenciamento_detran VARCHAR(50) NOT NULL,
    uf CHAR(2) NOT NULL,
    status_verificacao VARCHAR(20) DEFAULT 'pendente', -- pendente | verificado | rejeitado
    verificado_em TIMESTAMP NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    cep VARCHAR(9),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    plano VARCHAR(30) DEFAULT 'trial',
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_empresas_coordenadas ON empresas (latitude, longitude);

CREATE TABLE veiculos_desmonte (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id),
    modelo_id INT NOT NULL REFERENCES modelos(id),
    submodelo_id INT NULL REFERENCES submodelos(id),
    ano_fabricacao INT NOT NULL,
    geracao_id INT NULL REFERENCES geracoes(id),
    status VARCHAR(20) DEFAULT 'disponivel',
    criado_em TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_veiculos_modelo_ano ON veiculos_desmonte (modelo_id, ano_fabricacao);
CREATE INDEX idx_veiculos_geracao ON veiculos_desmonte (geracao_id);

-- ============================================================
-- Taxonomia de peças
-- ============================================================

CREATE TABLE categorias_peca (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    categoria_pai_id INT NULL REFERENCES categorias_peca(id)
);

-- ============================================================
-- Consumidor final
-- ============================================================

CREATE TABLE usuarios_finais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    aceite_termos BOOLEAN NOT NULL DEFAULT FALSE,
    aceite_promocional BOOLEAN NOT NULL DEFAULT FALSE,
    aceite_termos_em TIMESTAMP,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    cep VARCHAR(9),
    criado_em TIMESTAMP DEFAULT now()
);

-- Cada busca feita (histórico, alimenta personalização/LLM futuro)
CREATE TABLE consultas (
    id SERIAL PRIMARY KEY,
    usuario_final_id INT NOT NULL REFERENCES usuarios_finais(id),
    modelo_id INT NOT NULL REFERENCES modelos(id),
    submodelo_id INT NULL REFERENCES submodelos(id),
    ano INT NOT NULL,
    cep VARCHAR(9),
    criado_em TIMESTAMP DEFAULT now()
);

-- ============================================================
-- Mensageria própria
-- ============================================================

CREATE TABLE conversas (
    id SERIAL PRIMARY KEY,
    consulta_id INT NOT NULL REFERENCES consultas(id),
    empresa_id INT NOT NULL REFERENCES empresas(id),
    veiculo_desmonte_id INT NOT NULL REFERENCES veiculos_desmonte(id),
    status VARCHAR(20) DEFAULT 'aguardando', -- aguardando | respondida | sem_resposta
    criado_em TIMESTAMP DEFAULT now(),
    primeira_resposta_em TIMESTAMP NULL,
    ultima_atividade_em TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_conversas_status ON conversas (status);
CREATE INDEX idx_conversas_empresa ON conversas (empresa_id);

CREATE TABLE mensagens (
    id SERIAL PRIMARY KEY,
    conversa_id INT NOT NULL REFERENCES conversas(id),
    remetente_tipo VARCHAR(10) NOT NULL, -- cliente | empresa
    texto TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_mensagens_conversa ON mensagens (conversa_id);

-- ============================================================
-- Funções auxiliares
-- ============================================================

-- Distância linear entre dois pontos (Haversine), em km.
-- Uso: ordenar resultados por proximidade sem depender de roteirização.
CREATE OR REPLACE FUNCTION distancia_km(
    lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN 6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
            cos(radians(lat1)) * cos(radians(lat2)) *
            cos(radians(lon2) - radians(lon1)) +
            sin(radians(lat1)) * sin(radians(lat2))
        ))
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
