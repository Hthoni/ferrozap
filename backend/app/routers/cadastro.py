from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_empresa_atual
from app.models import Empresa, VeiculoDesmonte, Modelo
from app.schemas import EmpresaCreate, EmpresaOut, VeiculoDesmonteCreate, VeiculoDesmonteOut
from app.security import hash_senha
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
        email=dados.email,
        senha_hash=hash_senha(dados.senha),
        telefone=dados.telefone,
        endereco=dados.endereco,
        cep=dados.cep,
    )
    db.add(empresa)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="CNPJ ou e-mail já cadastrado.")
    db.refresh(empresa)
    return empresa


@router.post("/veiculos", response_model=VeiculoDesmonteOut, status_code=201)
def cadastrar_veiculo_desmonte(
    dados: VeiculoDesmonteCreate,
    empresa: Empresa = Depends(get_empresa_atual),
    db: Session = Depends(get_db),
):
    """
    Protegida: usa a empresa autenticada pelo token, nunca um id vindo
    da URL — evita que uma empresa cadastre estoque em nome de outra.
    """
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


@router.get("/veiculos", response_model=list[VeiculoDesmonteOut])
def listar_meus_veiculos_desmonte(
    empresa: Empresa = Depends(get_empresa_atual),
    db: Session = Depends(get_db),
):
    return (
        db.query(VeiculoDesmonte)
        .filter(VeiculoDesmonte.empresa_id == empresa.id)
        .all()
    )
