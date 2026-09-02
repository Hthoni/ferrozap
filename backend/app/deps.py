from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.auth import decodificar_token
from app.database import get_db
from app.models import Admin, Empresa, UsuarioFinal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def _extrair_payload(token: str | None) -> dict:
    if token is None:
        raise HTTPException(status_code=401, detail="Não autenticado.")
    payload = decodificar_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")
    return payload


def get_admin_atual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Admin:
    payload = _extrair_payload(token)
    if payload.get("tipo") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    admin = db.query(Admin).filter(Admin.id == int(payload["sub"])).first()
    if admin is None or not admin.ativo:
        raise HTTPException(status_code=401, detail="Administrador não encontrado ou inativo.")
    return admin


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
    if usuario is None or not usuario.ativo:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou inativo.")
    return usuario


def get_sujeito_atual(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Para rotas acessadas tanto por empresa quanto por usuário final
    (ex: mensageria), onde a checagem de "quem pode ver o quê" depende
    do dado sendo acessado, não do tipo em si. Retorna {"tipo", "id"}.
    """
    payload = _extrair_payload(token)
    return {"tipo": payload.get("tipo"), "id": int(payload["sub"])}
