from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Empresa

# TODO: proteger com autenticação de admin antes de ir para produção.
# Ainda não existe conceito de usuário admin no sistema — só empresa e
# usuário final. Ver docs/decisoes.md, seção "Pendências em aberto".
router = APIRouter(prefix="/admin/empresas", tags=["admin"])


class VerificacaoUpdate(BaseModel):
    status_verificacao: str  # verificado | rejeitado
    # Preenchidos pelo time interno durante a aprovação, já que a
    # empresa (ferro-velho) não tem como informar isso sozinha.
    latitude: float | None = None
    longitude: float | None = None


@router.get("/pendentes")
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


@router.patch("/{empresa_id}/verificacao")
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
