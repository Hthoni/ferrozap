from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.auth import decodificar_token
from app.database import get_db
from app.models import Empresa, UsuarioFinal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def _extrair_payload(token: str | None) -> dict:
    if token is None:
        raise HTTPException(status_code=401, detail="Não autenticado.")
    payload = decodificar_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")
    return payload


def get_empresa_atual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Empresa:
    payload = _extrair_payload(token)
    if payload.get("tipo") != "empresa":
        raise HTTPException(status_code=403, detail="Acesso restrito a empresas.")
    empresa = db.query(Empresa).filter(Empresa.id == int(payload["sub"])).first()
    if empresa is None or not empresa.ativo:
        raise HTTPException(status_code=401, detail="Empresa não encontrada ou inativa.")
    return empresa


def get_usuario_atual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> UsuarioFinal:
    payload = _extrair_payload(token)
    if payload.get("tipo") != "usuario_final":
        raise HTTPException(status_code=403, detail="Acesso restrito a clientes.")
    usuario = db.query(UsuarioFinal).filter(UsuarioFinal.id == int(payload["sub"])).first()
    if usuario is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado.")
    return usuario
