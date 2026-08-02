from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Empresa, UsuarioFinal

# TODO: proteger com autenticação de admin antes de ir para produção.
# Ainda não existe conceito de usuário admin no sistema — só empresa e
# usuário final. Ver docs/decisoes.md, seção "Pendências em aberto".
router = APIRouter(prefix="/admin", tags=["admin"])


class VerificacaoUpdate(BaseModel):
    status_verificacao: str  # verificado | rejeitado
    latitude: float | None = None
    longitude: float | None = None


class AtivoUpdate(BaseModel):
    ativo: bool


class AdminEmpresaUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None
    telefone: str | None = None
    endereco: str | None = None
    cep: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class AdminUsuarioUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None
    telefone: str | None = None
    cep: str | None = None


@router.get("/empresas/pendentes")
def listar_pendentes(db: Session = Depends(get_db)):
    empresas = (
        db.query(Empresa).filter(Empresa.status_verificacao == "pendente").all()
    )
    return [
        {
            "id": e.id,
            "nome": e.nome,
            "cnpj": e.cnpj,
            "credenciamento_detran": e.credenciamento_detran,
            "uf": e.uf,
            "endereco": e.endereco,
            "cep": e.cep,
            "criado_em": e.criado_em,
        }
        for e in empresas
    ]


@router.get("/empresas")
def listar_todas_empresas(db: Session = Depends(get_db)):
    empresas = db.query(Empresa).order_by(Empresa.criado_em.desc()).all()
    return [
        {
            "id": e.id,
            "nome": e.nome,
            "cnpj": e.cnpj,
            "email": e.email,
            "uf": e.uf,
            "status_verificacao": e.status_verificacao,
            "ativo": e.ativo,
            "plano": e.plano,
            "criado_em": e.criado_em,
        }
        for e in empresas
    ]


@router.get("/usuarios")
def listar_todos_usuarios(db: Session = Depends(get_db)):
    usuarios = db.query(UsuarioFinal).order_by(UsuarioFinal.criado_em.desc()).all()
    return [
        {
            "id": u.id,
            "nome": u.nome,
            "email": u.email,
            "telefone": u.telefone,
            "ativo": u.ativo,
            "aceite_promocional": u.aceite_promocional,
            "criado_em": u.criado_em,
        }
        for u in usuarios
    ]


@router.patch("/empresas/{empresa_id}/verificacao")
def atualizar_verificacao(
    empresa_id: int, dados: VerificacaoUpdate, db: Session = Depends(get_db)
):
    if dados.status_verificacao not in ("verificado", "rejeitado"):
        raise HTTPException(status_code=400, detail="Status inválido.")

    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    if dados.latitude is not None:
        empresa.latitude = dados.latitude
    if dados.longitude is not None:
        empresa.longitude = dados.longitude

    if dados.status_verificacao == "verificado":
        if empresa.latitude is None or empresa.longitude is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Não é possível aprovar sem coordenadas. Informe "
                    "latitude e longitude junto com a aprovação."
                ),
            )

    empresa.status_verificacao = dados.status_verificacao
    empresa.verificado_em = datetime.now(timezone.utc)
    db.commit()
    return {
        "id": empresa.id,
        "status_verificacao": empresa.status_verificacao,
        "latitude": empresa.latitude,
        "longitude": empresa.longitude,
    }


@router.patch("/empresas/{empresa_id}/ativo")
def atualizar_ativo_empresa(empresa_id: int, dados: AtivoUpdate, db: Session = Depends(get_db)):
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    empresa.ativo = dados.ativo
    db.commit()
    return {"id": empresa.id, "ativo": empresa.ativo}


@router.patch("/empresas/{empresa_id}")
def editar_empresa_admin(empresa_id: int, dados: AdminEmpresaUpdate, db: Session = Depends(get_db)):
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    if dados.nome is not None:
        empresa.nome = dados.nome
    if dados.email is not None:
        empresa.email = dados.email.strip().lower()
    if dados.telefone is not None:
        empresa.telefone = dados.telefone
    if dados.endereco is not None:
        empresa.endereco = dados.endereco
    if dados.cep is not None:
        empresa.cep = dados.cep
    if dados.latitude is not None:
        empresa.latitude = dados.latitude
    if dados.longitude is not None:
        empresa.longitude = dados.longitude
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="E-mail já em uso por outra empresa.")
    db.refresh(empresa)
    return {
        "id": empresa.id,
        "nome": empresa.nome,
        "email": empresa.email,
        "telefone": empresa.telefone,
        "endereco": empresa.endereco,
        "cep": empresa.cep,
        "latitude": empresa.latitude,
        "longitude": empresa.longitude,
    }


@router.patch("/usuarios/{usuario_id}/ativo")
def atualizar_ativo_usuario(usuario_id: int, dados: AtivoUpdate, db: Session = Depends(get_db)):
    usuario = db.query(UsuarioFinal).filter(UsuarioFinal.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    usuario.ativo = dados.ativo
    db.commit()
    return {"id": usuario.id, "ativo": usuario.ativo}


@router.patch("/usuarios/{usuario_id}")
def editar_usuario_admin(usuario_id: int, dados: AdminUsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(UsuarioFinal).filter(UsuarioFinal.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if dados.nome is not None:
        usuario.nome = dados.nome
    if dados.email is not None:
        usuario.email = dados.email.strip().lower()
    if dados.telefone is not None:
        usuario.telefone = dados.telefone
    if dados.cep is not None:
        usuario.cep = dados.cep
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="E-mail ou telefone já em uso por outra conta.")
    db.refresh(usuario)
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "telefone": usuario.telefone,
        "cep": usuario.cep,
    }
