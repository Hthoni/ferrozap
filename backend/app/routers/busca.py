from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(prefix="/busca", tags=["busca"])

# TODO: mover para tabela de configuração
TOLERANCIA_ANOS_FALLBACK = 2


@router.get("/")
def buscar(
    modelo_id: int,
    ano: int,
    lat: float,
    lon: float,
    ordenar_por: str = "compatibilidade",  # ou "distancia"
    db: Session = Depends(get_db),
):
    """
    Resolve a geração do veículo buscado (se mapeada) e retorna os
    desmontes compatíveis, com distância linear até o usuário.

    Ver docs/decisoes.md para a lógica completa de matching e fallback.
    """
    query = text(
        """
        SELECT
            e.id AS empresa_id,
            e.nome,
            e.telefone,
            v.ano_fabricacao,
            CASE
                WHEN v.geracao_id IS NOT NULL THEN 'compativel_exato'
                WHEN v.ano_fabricacao BETWEEN (:ano - :tolerancia)
                    AND (:ano + :tolerancia) THEN 'provavel'
                ELSE 'baixa_confianca'
            END AS nivel_confianca,
            distancia_km(:lat, :lon, e.latitude, e.longitude) AS distancia_km
        FROM veiculos_desmonte v
        JOIN empresas e ON e.id = v.empresa_id
        WHERE v.modelo_id = :modelo_id
          AND e.ativo = TRUE
          AND v.status = 'disponivel'
        ORDER BY
            CASE WHEN :ordenar_por = 'distancia' THEN 0 ELSE
                CASE
                    WHEN v.geracao_id IS NOT NULL THEN 1
                    WHEN v.ano_fabricacao BETWEEN (:ano - :tolerancia)
                        AND (:ano + :tolerancia) THEN 2
                    ELSE 3
                END
            END,
            distancia_km ASC
        """
    )
    resultado = db.execute(
        query,
        {
            "modelo_id": modelo_id,
            "ano": ano,
            "tolerancia": TOLERANCIA_ANOS_FALLBACK,
            "lat": lat,
            "lon": lon,
            "ordenar_por": ordenar_por,
        },
    )
    return [dict(row._mapping) for row in resultado]
