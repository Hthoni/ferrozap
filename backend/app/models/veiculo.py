from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Fabricante(Base):
    __tablename__ = "fabricantes"

    id = Column(Integer, primary_key=True)
    nome = Column(String(50), nullable=False, unique=True)

    modelos = relationship("Modelo", back_populates="fabricante")


class Modelo(Base):
    __tablename__ = "modelos"

    id = Column(Integer, primary_key=True)
    fabricante_id = Column(Integer, ForeignKey("fabricantes.id"), nullable=False)
    nome = Column(String(50), nullable=False)
    tem_submodelo_relevante = Column(Boolean, default=False)

    fabricante = relationship("Fabricante", back_populates="modelos")
    submodelos = relationship("Submodelo", back_populates="modelo")
    geracoes = relationship("Geracao", back_populates="modelo")


class Submodelo(Base):
    __tablename__ = "submodelos"

    id = Column(Integer, primary_key=True)
    modelo_id = Column(Integer, ForeignKey("modelos.id"), nullable=False)
    nome = Column(String(50), nullable=False)

    modelo = relationship("Modelo", back_populates="submodelos")


class Geracao(Base):
    __tablename__ = "geracoes"
    __table_args__ = (CheckConstraint("ano_fim >= ano_inicio"),)

    id = Column(Integer, primary_key=True)
    modelo_id = Column(Integer, ForeignKey("modelos.id"), nullable=False)
    nome = Column(String(30), nullable=False)
    ano_inicio = Column(Integer, nullable=False)
    ano_fim = Column(Integer, nullable=False)

    modelo = relationship("Modelo", back_populates="geracoes")
