from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_empresa_atual
from app.models import Empresa, VeiculoDesmonte, Modelo, Fabricante
from app.schemas import (
    EmpresaCreate,
    EmpresaOut,
    EmpresaUpdate,
    SenhaUpdate,
    VeiculoDesmonteCreate,
    VeiculoDesmonteOut,
    VeiculoDesmonteComModeloOut,
)
from app.security import hash_senha, verificar_senha
from app.services.geracao import resolver_geracao

router = APIRouter(prefix="/empresas", tags=["cadastro"])


@router.post("/", response_model=EmpresaOut, status_code=201)
def cadastrar_empresa(dados: EmpresaCreate, db: Session = Depends(get_db)):
    """Cadastro público — sem autenticação, é aqui que a empresa nasce."""
    empresa = Empresa(
        nome=dados.nome,
        cnpj=dados.cnpj,
        credenciamento_detran=dados.credenciamento_detran,
        uf=dados.uf.upper(),
        email=dados.email.strip().lower(),
        senha_hash=hash_senha(dados.senha),
        telefone=dados.telefone,
        whatsapp=dados.telefone if dados.telefone_e_whatsapp else None,
        endereco=dados.endereco,
        cep=dados.cep,
    )
    db.add(empresa)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="CNPJ, telefone ou e-mail já cadastrado.")
    db.refresh(empresa)
    return empresa


@router.get("/me", response_model=EmpresaOut)
def minha_empresa(empresa: Empresa = Depends(get_empresa_atual)):
    return empresa


@router.patch("/me", response_model=EmpresaOut)
def atualizar_minha_empresa(
    dados: EmpresaUpdate,
    empresa: Empresa = Depends(get_empresa_atual),
    db: Session = Depends(get_db),
):
    """
    CNPJ, credenciamento e UF não entram aqui de propósito — são dados
    ligados à verificação já aprovada; deixar a empresa trocar isso
    livremente abriria brecha pra trocar de identidade sem passar pela
    aprovação de novo. Só dados de contato são editáveis.
    """
    if dados.nome is not None:
        empresa.nome = dados.nome
    if dados.email is not None:
        empresa.email = dados.email.strip().lower()
    if dados.telefone is not None:
        empresa.telefone = dados.telefone
        # Se o telefone mudou e a empresa não disse explicitamente
        # "não é WhatsApp" nesse mesmo pedido, mantém acompanhando o
        # telefone novo (comportamento mais previsível que deixar o
        # WhatsApp desatualizado silenciosamente).
        if dados.telefone_e_whatsapp is not False:
            empresa.whatsapp = dados.telefone
    if dados.telefone_e_whatsapp is not None:
        empresa.whatsapp = empresa.telefone if dados.telefone_e_whatsapp else None
    if dados.endereco is not None:
        empresa.endereco = dados.endereco
    if dados.cep is not None:
        empresa.cep = dados.cep
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="E-mail já em uso por outra conta.")
    db.refresh(empresa)
    return empresa


@router.patch("/me/senha")
def alterar_senha_empresa(
    dados: SenhaUpdate,
    empresa: Empresa = Depends(get_empresa_atual),
    db: Session = Depends(get_db),
):
    if not verificar_senha(dados.senha_atual, empresa.senha_hash):
        raise HTTPException(status_code=401, detail="Senha atual incorreta.")
    empresa.senha_hash = hash_senha(dados.senha_nova)
    db.commit()
    return {"ok": True}


@router.post("/veiculos", response_model=VeiculoDesmonteOut, status_code=201)
def cadastrar_veiculo_desmonte(
    dados: VeiculoDesmonteCreate,
    empresa: Empresa = Depends(get_empresa_atual),
    db: Session = Depends(get_db),
):
    modelo = db.query(Modelo).filter(Modelo.id == dados.modelo_id).first()
    if not modelo:
        raise HTTPException(status_code=404, detail="Modelo não encontrado.")

    geracao_id = resolver_geracao(db, dados.modelo_id, dados.ano_fabricacao)

    veiculo = VeiculoDesmonte(
        empresa_id=empresa.id,
        modelo_id=dados.modelo_id,
        submodelo_id=dados.submodelo_id,
        ano_fabricacao=dados.ano_fabricacao,
        geracao_id=geracao_id,
    )
    db.add(veiculo)
    db.commit()
    db.refresh(veiculo)
    return veiculo


@router.get("/veiculos", response_model=list[VeiculoDesmonteComModeloOut])
def listar_meus_veiculos_desmonte(
    empresa: Empresa = Depends(get_empresa_atual),
    db: Session = Depends(get_db),
):
    linhas = (
        db.query(VeiculoDesmonte, Modelo.nome, Fabricante.nome)
        .join(Modelo, Modelo.id == VeiculoDesmonte.modelo_id)
        .join(Fabricante, Fabricante.id == Modelo.fabricante_id)
        .filter(VeiculoDesmonte.empresa_id == empresa.id)
        .order_by(VeiculoDesmonte.criado_em.desc())
        .all()
    )
    return [
        {
            "id": v.id,
            "empresa_id": v.empresa_id,
            "modelo_id": v.modelo_id,
            "submodelo_id": v.submodelo_id,
            "ano_fabricacao": v.ano_fabricacao,
            "geracao_id": v.geracao_id,
            "status": v.status,
            "criado_em": v.criado_em,
            "modelo_nome": nome_modelo,
            "fabricante_nome": nome_fabricante,
        }
        for v, nome_modelo, nome_fabricante in linhas
    ]


@router.patch("/veiculos/{veiculo_id}", response_model=VeiculoDesmonteOut)
def editar_veiculo_desmonte(
    veiculo_id: int,
    dados: VeiculoDesmonteCreate,
    empresa: Empresa = Depends(get_empresa_atual),
    db: Session = Depends(get_db),
):
    veiculo = (
        db.query(VeiculoDesmonte)
        .filter(VeiculoDesmonte.id == veiculo_id, VeiculoDesmonte.empresa_id == empresa.id)
        .first()
    )
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")

    modelo = db.query(Modelo).filter(Modelo.id == dados.modelo_id).first()
    if not modelo:
        raise HTTPException(status_code=404, detail="Modelo não encontrado.")

    veiculo.modelo_id = dados.modelo_id
    veiculo.submodelo_id = dados.submodelo_id
    veiculo.ano_fabricacao = dados.ano_fabricacao
    veiculo.geracao_id = resolver_geracao(db, dados.modelo_id, dados.ano_fabricacao)
    db.commit()
    db.refresh(veiculo)
    return veiculo


@router.delete("/veiculos/{veiculo_id}", status_code=204)
def apagar_veiculo_desmonte(
    veiculo_id: int,
    empresa: Empresa = Depends(get_empresa_atual),
    db: Session = Depends(get_db),
):
    veiculo = (
        db.query(VeiculoDesmonte)
        .filter(VeiculoDesmonte.id == veiculo_id, VeiculoDesmonte.empresa_id == empresa.id)
        .first()
    )
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")
    db.delete(veiculo)
    db.commit()
    return None
