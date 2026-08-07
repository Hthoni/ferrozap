from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from app.database import Base


class UsuarioFinal(Base):
    __tablename__ = "usuarios_finais"

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(120), nullable=False, unique=True)
    telefone = Column(String(20), nullable=False, unique=True)
    senha_hash = Column(String(255), nullable=False)
    aceite_termos = Column(Boolean, nullable=False, default=False)
    aceite_promocional = Column(Boolean, nullable=False, default=False)
    aceite_termos_em = Column(DateTime, nullable=True)
    ativo = Column(Boolean, nullable=False, default=True)
    cep = Column(String(9), nullable=True)
    criado_em = Column(DateTime, server_default=func.now())
