from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    cnpj = Column(String(18), nullable=False, unique=True)
    credenciamento_detran = Column(String(50), nullable=False)
    uf = Column(String(2), nullable=False)
    status_verificacao = Column(String(20), default="pendente")
    verificado_em = Column(DateTime, nullable=True)
    email = Column(String(120), nullable=False, unique=True)
    senha_hash = Column(String(255), nullable=False)
    telefone = Column(String(20))
    endereco = Column(String)
    cep = Column(String(9))
    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)
    plano = Column(String(30), default="trial")
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, server_default=func.now())

    veiculos = relationship("VeiculoDesmonte", back_populates="empresa")


class VeiculoDesmonte(Base):
    __tablename__ = "veiculos_desmonte"

    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    modelo_id = Column(Integer, ForeignKey("modelos.id"), nullable=False)
    submodelo_id = Column(Integer, ForeignKey("submodelos.id"), nullable=True)
    ano_fabricacao = Column(Integer, nullable=False)
    geracao_id = Column(Integer, ForeignKey("geracoes.id"), nullable=True)
    status = Column(String(20), default="disponivel")
    criado_em = Column(DateTime, server_default=func.now())

    empresa = relationship("Empresa", back_populates="veiculos")
