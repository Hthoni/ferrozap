import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func

from app.database import Base

VALIDADE_MINUTOS = 30


class TokenRedefinicaoSenha(Base):
    """
    Token de uso único para o fluxo "esqueci minha senha", tanto de
    UsuarioFinal quanto de Empresa (o campo `tipo` distingue as duas).
    Expira em 30 minutos, e é marcado como usado depois de aplicado --
    nunca reutilizável, mesmo dentro da janela de validade.
    """
    __tablename__ = "tokens_redefinicao_senha"

    id = Column(Integer, primary_key=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    tipo = Column(String(20), nullable=False)  # "usuario_final" | "empresa"
    sujeito_id = Column(Integer, nullable=False)
    criado_em = Column(DateTime, server_default=func.now())
    expira_em = Column(DateTime, nullable=False)
    usado = Column(Boolean, default=False, nullable=False)

    @staticmethod
    def gerar_token() -> str:
        return secrets.token_urlsafe(32)

    @staticmethod
    def calcular_expiracao() -> datetime:
        return datetime.now(timezone.utc) + timedelta(minutes=VALIDADE_MINUTOS)
