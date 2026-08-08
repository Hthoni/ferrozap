from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import criar_token
from app.database import get_db
from app.deps import get_usuario_atual
from app.models import Empresa, UsuarioFinal
from app.schemas import (
    EmpresaLogin,
    SenhaUpdate,
    TokenOut,
    UsuarioFinalCepUpdate,
    UsuarioFinalCreate,
    UsuarioFinalLogin,
    UsuarioFinalOut,
    UsuarioFinalUpdate,
)
from app.security import hash_senha, verificar_senha

router = APIRouter(prefix="/auth", tags=["autenticacao"])


@router.post("/empresas/login", response_model=TokenOut)
def login_empresa(dados: EmpresaLogin, db: Session = Depends(get_db)):
    empresa = db.query(Empresa).filter(Empresa.telefone == dados.telefone).first()
    if not empresa or not verificar_senha(dados.senha, empresa.senha_hash):
        raise HTTPException(status_code=401, detail="Telefone ou senha inválidos.")
    if not empresa.ativo:
        raise HTTPException(status_code=403, detail="Empresa inativa.")
    return TokenOut(access_token=criar_token(empresa.id, "empresa"))


# Cadastro do usuário final fica aqui (não em cadastro.py) porque está
# sempre acoplado ao fluxo de autenticação: a pessoa só cria conta no
# momento em que precisa fazer login para contatar uma empresa.
@router.post("/usuarios", response_model=UsuarioFinalOut, status_code=201)
def cadastrar_usuario_final(dados: UsuarioFinalCreate, db: Session = Depends(get_db)):
    usuario = UsuarioFinal(
        nome=dados.nome,
        email=dados.email,
        telefone=dados.telefone,
        senha_hash=hash_senha(dados.senha),
        aceite_termos=dados.aceite_termos,
        aceite_promocional=dados.aceite_promocional,
        aceite_termos_em=datetime.now(timezone.utc),
    )
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Telefone ou e-mail já cadastrado.")
    db.refresh(usuario)
    return usuario


@router.post("/usuarios/login", response_model=TokenOut)
def login_usuario_final(dados: UsuarioFinalLogin, db: Session = Depends(get_db)):
    usuario = (
        db.query(UsuarioFinal)
        .filter(UsuarioFinal.telefone == dados.telefone)
        .first()
    )
    if not usuario or not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Telefone ou senha inválidos.")
    return TokenOut(access_token=criar_token(usuario.id, "usuario_final"))


@router.get("/usuarios/me", response_model=UsuarioFinalOut)
def meu_perfil(usuario: UsuarioFinal = Depends(get_usuario_atual)):
    return usuario


@router.patch("/usuarios/me", response_model=UsuarioFinalOut)
def atualizar_meu_perfil(
    dados: UsuarioFinalUpdate,
    usuario: UsuarioFinal = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
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
    return usuario


@router.patch("/usuarios/me/senha")
def alterar_minha_senha(
    dados: SenhaUpdate,
    usuario: UsuarioFinal = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    if not verificar_senha(dados.senha_atual, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Senha atual incorreta.")
    usuario.senha_hash = hash_senha(dados.senha_nova)
    db.commit()
    return {"ok": True}


@router.patch("/usuarios/me/cep", response_model=UsuarioFinalOut)
def atualizar_meu_cep(
    dados: UsuarioFinalCepUpdate,
    usuario: UsuarioFinal = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    usuario.cep = dados.cep
    db.commit()
    db.refresh(usuario)
    return usuario
