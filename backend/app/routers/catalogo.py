from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Fabricante, Modelo, Submodelo, SugestaoCatalogo
from app.services.geracao import anos_disponiveis

router = APIRouter(prefix="/catalogo", tags=["catalogo"])

# Ordem de prioridade por volume estimado de mercado no Brasil (julgamento
# próprio, não é dado oficial de vendas) — as 10 primeiras aparecem no
# topo do dropdown, nessa ordem; o resto vem em ordem alfabética depois.
PRIORIDADE_FABRICANTES = {
    "Volkswagen": 1,
    "Chevrolet": 2,
    "Fiat": 3,
    "Hyundai": 4,
    "Toyota": 5,
    "Honda": 6,
    "Jeep": 7,
    "Renault": 8,
    "Nissan": 9,
    "Ford": 10,
}


@router.get("/fabricantes")
def listar_fabricantes(db: Session = Depends(get_db)):
    fabricantes = db.query(Fabricante).all()
    ordenados = sorted(
        fabricantes,
        key=lambda f: (PRIORIDADE_FABRICANTES.get(f.nome, 999), f.nome.casefold()),
    )
    return [{"id": f.id, "nome": f.nome} for f in ordenados]


class FabricanteCreate(BaseModel):
    nome: str


@router.post("/fabricantes")
def criar_ou_obter_fabricante(dados: FabricanteCreate, db: Session = Depends(get_db)):
    """
    Usado pelo campo de texto livre: quando a marca não existe no
    catálogo (comum para veículos raros/antigos), cria na hora em vez
    de bloquear o cadastro/busca. Idempotente pelo nome.
    """
    nome = dados.nome.strip()
    fabricante = db.query(Fabricante).filter(Fabricante.nome.ilike(nome)).first()
    if fabricante:
        return {"id": fabricante.id, "nome": fabricante.nome}

    fabricante = Fabricante(nome=nome)
    db.add(fabricante)
    db.commit()
    db.refresh(fabricante)
    return {"id": fabricante.id, "nome": fabricante.nome}


@router.get("/fabricantes/{fabricante_id}/modelos")
def listar_modelos(fabricante_id: int, db: Session = Depends(get_db)):
    modelos = (
        db.query(Modelo)
        .filter(Modelo.fabricante_id == fabricante_id)
        .order_by(Modelo.nome)
        .all()
    )
    return [
        {
            "id": m.id,
            "nome": m.nome,
            "tem_submodelo_relevante": m.tem_submodelo_relevante,
        }
        for m in modelos
    ]


class ModeloCreate(BaseModel):
    fabricante_id: int
    nome: str


@router.post("/modelos")
def criar_ou_obter_modelo(dados: ModeloCreate, db: Session = Depends(get_db)):
    """
    Mesma lógica do fabricante, para modelo. O modelo criado assim
    nasce sem geração mapeada — a busca cai automaticamente no modo
    fallback por tolerância de ano (ver services/geracao.py), não
    bloqueia nada, só reduz o nível de confiança exibido.
    """
    nome = dados.nome.strip()
    modelo = (
        db.query(Modelo)
        .filter(Modelo.fabricante_id == dados.fabricante_id, Modelo.nome.ilike(nome))
        .first()
    )
    if modelo:
        return {"id": modelo.id, "nome": modelo.nome, "tem_submodelo_relevante": modelo.tem_submodelo_relevante}

    modelo = Modelo(fabricante_id=dados.fabricante_id, nome=nome, tem_submodelo_relevante=False)
    db.add(modelo)
    db.commit()
    db.refresh(modelo)
    return {"id": modelo.id, "nome": modelo.nome, "tem_submodelo_relevante": modelo.tem_submodelo_relevante}


@router.get("/modelos/{modelo_id}/submodelos")
def listar_submodelos(modelo_id: int, db: Session = Depends(get_db)):
    submodelos = (
        db.query(Submodelo)
        .filter(Submodelo.modelo_id == modelo_id)
        .order_by(Submodelo.nome)
        .all()
    )
    return [{"id": s.id, "nome": s.nome} for s in submodelos]


@router.get("/modelos/{modelo_id}/anos")
def listar_anos(modelo_id: int, db: Session = Depends(get_db)):
    anos, tem_geracao_real = anos_disponiveis(db, modelo_id)
    return {"anos": anos, "tem_geracao_real": tem_geracao_real}


class SugestaoFabricanteCreate(BaseModel):
    nome: str


@router.post("/sugestoes/fabricante", status_code=201)
def sugerir_fabricante(dados: SugestaoFabricanteCreate, db: Session = Depends(get_db)):
    """
    Fluxo de BUSCA do cliente (Busca.jsx) -- não cria fabricante real,
    só registra a sugestão pra revisão manual (N-08). A busca segue
    com o texto puro, sem id de catálogo.
    """
    nome = dados.nome.strip()
    existe_no_catalogo = db.query(Fabricante).filter(Fabricante.nome.ilike(nome)).first()
    if existe_no_catalogo:
        return {"id": existe_no_catalogo.id, "nome": existe_no_catalogo.nome, "ja_existe": True}

    db.add(SugestaoCatalogo(tipo="fabricante", nome=nome))
    db.commit()
    return {"id": None, "nome": nome, "ja_existe": False}


class SugestaoModeloCreate(BaseModel):
    fabricante_nome: str
    nome: str


@router.post("/sugestoes/modelo", status_code=201)
def sugerir_modelo(dados: SugestaoModeloCreate, db: Session = Depends(get_db)):
    """Mesma lógica do fabricante, para modelo (ver sugerir_fabricante)."""
    nome = dados.nome.strip()
    fabricante = db.query(Fabricante).filter(Fabricante.nome.ilike(dados.fabricante_nome.strip())).first()
    if fabricante:
        existe_no_catalogo = (
            db.query(Modelo)
            .filter(Modelo.fabricante_id == fabricante.id, Modelo.nome.ilike(nome))
            .first()
        )
        if existe_no_catalogo:
            return {"id": existe_no_catalogo.id, "nome": existe_no_catalogo.nome, "ja_existe": True}

    db.add(SugestaoCatalogo(tipo="modelo", nome=nome, fabricante_nome=dados.fabricante_nome.strip()))
    db.commit()
    return {"id": None, "nome": nome, "ja_existe": False}
