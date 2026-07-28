from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Fabricante, Modelo, Submodelo

router = APIRouter(prefix="/catalogo", tags=["catalogo"])


@router.get("/fabricantes")
def listar_fabricantes(db: Session = Depends(get_db)):
    fabricantes = db.query(Fabricante).order_by(Fabricante.nome).all()
    return [{"id": f.id, "nome": f.nome} for f in fabricantes]


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


@router.get("/modelos/{modelo_id}/submodelos")
def listar_submodelos(modelo_id: int, db: Session = Depends(get_db)):
    submodelos = (
        db.query(Submodelo)
        .filter(Submodelo.modelo_id == modelo_id)
        .order_by(Submodelo.nome)
        .all()
    )
    return [{"id": s.id, "nome": s.nome} for s in submodelos]
