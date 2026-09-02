from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import criar_token
from app.database import get_db
from app.deps import get_usuario_atual
from app.models import Admin, Empresa, TokenRedefinicaoSenha, UsuarioFinal
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
from app.services.email import email_redefinicao_senha

router = APIRouter(prefix="/auth", tags=["autenticacao"])


class AdminLogin(BaseModel):
    usuario: str
    senha: str


@router.post("/admin/login", response_model=TokenOut)
def login_admin(dados: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.usuario == dados.usuario).first()
    if not admin or not verificar_senha(dados.senha, admin.senha_hash):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos.")
    if not admin.ativo:
        raise HTTPException(status_code=403, detail="Administrador inativo.")
    return TokenOut(access_token=criar_token(admin.id, "admin"))


class EsqueciSenhaRequest(BaseModel):
    tipo: str  # "usuario_final" | "empresa"
    identificador: str  # e-mail (usuario_final) ou telefone (empresa)


FRONTEND_URL = "https://catasucata.com.br"


@router.post("/esqueci-senha")
def esqueci_senha(dados: EsqueciSenhaRequest, db: Session = Depends(get_db)):
    """
    Resposta sempre genérica, exista ou não a conta -- não revela pra
    quem está pedindo se aquele e-mail/telefone tem cadastro ou não
    (evita descobrir contas de terceiros por tentativa e erro).
    """
    resposta = {"ok": True, "mensagem": "Se existir uma conta com esse dado, enviamos as instruções por e-mail."}

    if dados.tipo == "usuario_final":
        usuario = db.query(UsuarioFinal).filter(UsuarioFinal.email == dados.identificador.strip().lower()).first()
        if not usuario or not usuario.email:
            return resposta
        sujeito_id, email_destino = usuario.id, usuario.email
    elif dados.tipo == "empresa":
        empresa = db.query(Empresa).filter(Empresa.telefone == dados.identificador).first()
        if not empresa or not empresa.email:
            return resposta
        sujeito_id, email_destino = empresa.id, empresa.email
    else:
        raise HTTPException(status_code=400, detail="Tipo inválido.")

    token_registro = TokenRedefinicaoSenha(
        token=TokenRedefinicaoSenha.gerar_token(),
        tipo=dados.tipo,
        sujeito_id=sujeito_id,
        expira_em=TokenRedefinicaoSenha.calcular_expiracao(),
    )
    db.add(token_registro)
    db.commit()

    link = f"{FRONTEND_URL}/#/redefinir-senha?token={token_registro.token}&tipo={dados.tipo}"
    email_redefinicao_senha(email_destino, link)
    return resposta


class RedefinirSenhaRequest(BaseModel):
    token: str
    senha_nova: str


@router.post("/redefinir-senha")
def redefinir_senha(dados: RedefinirSenhaRequest, db: Session = Depends(get_db)):
    registro = db.query(TokenRedefinicaoSenha).filter(TokenRedefinicaoSenha.token == dados.token).first()
    if not registro or registro.usado:
        raise HTTPException(status_code=400, detail="Link inválido ou já utilizado.")
    if registro.expira_em.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Link expirado. Peça um novo.")

    if registro.tipo == "usuario_final":
        sujeito = db.query(UsuarioFinal).filter(UsuarioFinal.id == registro.sujeito_id).first()
    else:
        sujeito = db.query(Empresa).filter(Empresa.id == registro.sujeito_id).first()
    if not sujeito:
        raise HTTPException(status_code=404, detail="Conta não encontrada.")

    sujeito.senha_hash = hash_senha(dados.senha_nova)
    registro.usado = True
    db.commit()
    return {"ok": True}


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
