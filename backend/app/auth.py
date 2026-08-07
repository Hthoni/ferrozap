from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError

from app.config import settings

ALGORITHM = "HS256"
EXPIRA_EM_MINUTOS = 60 * 24 * 7  # 7 dias


def criar_token(sujeito_id: int, tipo: str) -> str:
    """
    tipo: 'empresa' ou 'usuario_final' — grava no token pra diferenciar
    quem está autenticado, já que são duas tabelas distintas.
    """
    expira = datetime.now(timezone.utc) + timedelta(minutes=EXPIRA_EM_MINUTOS)
    payload = {"sub": str(sujeito_id), "tipo": tipo, "exp": expira}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decodificar_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
