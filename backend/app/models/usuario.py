from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class UsuarioFinal(Base):
    __tablename__ = "usuarios_finais"

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    telefone = Column(String(20), nullable=False, unique=True)
    senha_hash = Column(String(255), nullable=False)
    criado_em = Column(DateTime, server_default=func.now())
