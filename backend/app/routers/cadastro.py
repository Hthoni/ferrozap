from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Empresa, VeiculoDesmonte, Fabricante, Modelo
from app.schemas import EmpresaCreate, EmpresaOut, VeiculoDesmonteCreate, VeiculoDesmonteOut
from app.security import hash_senha
from app.services.geracao import resolver_geracao

router = APIRouter(prefix="/empresas", tags=["cadastro"])


@router.post("/", response_model=EmpresaOut, status_code=201)
def cadastrar_empresa(dados: EmpresaCreate, db: Session = Depends(get_db)):
    empresa = Empresa(
        nome=dados.nome,
        cnpj=dados.cnpj,
        credenciamento_detran=dados.credenciamento_detran,
        email=dados.email,
        senha_hash=hash_senha(dados.senha),
        telefone=dados.telefone,
        endereco=dados.endereco,
        cep=dados.cep,
        latitude=dados.latitude,
        longitude=dados.longitude,
    )
    db.add(empresa)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="CNPJ ou e-mail já cadastrado.")
    db.refresh(empresa)
    return empresa


@router.post(
    "/{empresa_id}/veiculos",
    response_model=VeiculoDesmonteOut,
    status_code=201,
)
def cadastrar_veiculo_desmonte(
    empresa_id: int,
    dados: VeiculoDesmonteCreate,
    db: Session = Depends(get_db),
):
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    modelo = db.query(Modelo).filter(Modelo.id == dados.modelo_id).first()
    if not modelo:
        raise HTTPException(status_code=404, detail="Modelo não encontrado.")

    # Resolve a geração automaticamente a partir do ano informado.
    # Fica None quando o modelo ainda não tem geração mapeada nesse
    # intervalo — o veículo continua funcional via fallback na busca.
    geracao_id = resolver_geracao(db, dados.modelo_id, dados.ano_fabricacao)

    veiculo = VeiculoDesmonte(
        empresa_id=empresa_id,
        modelo_id=dados.modelo_id,
        submodelo_id=dados.submodelo_id,
        ano_fabricacao=dados.ano_fabricacao,
        geracao_id=geracao_id,
    )
    db.add(veiculo)
    db.commit()
    db.refresh(veiculo)
    return veiculo


@router.get("/{empresa_id}/veiculos", response_model=list[VeiculoDesmonteOut])
def listar_veiculos_desmonte(empresa_id: int, db: Session = Depends(get_db)):
    return (
        db.query(VeiculoDesmonte)
        .filter(VeiculoDesmonte.empresa_id == empresa_id)
        .all()
    )
