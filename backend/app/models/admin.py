from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Admin(Base):
    """
    Usuário administrador do sistema -- separado de Empresa e
    UsuarioFinal de propósito, já que tem permissões completamente
    diferentes (acesso ao /admin, verificação de empresa, reset de
    senha de terceiros). Criado manualmente via SQL na primeira vez
    (ver database/migracao_008_admin.sql) -- não existe cadastro
    público de admin, por segurança.
    """
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True)
    usuario = Column(String(60), unique=True, nullable=False)  # login, não é e-mail necessariamente
    senha_hash = Column(String(255), nullable=False)
    nome = Column(String(150), nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    criado_em = Column(DateTime, server_default=func.now())
