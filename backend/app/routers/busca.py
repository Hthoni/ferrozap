from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.rate_limit import limiter
from app.services.geocodificacao import obter_coordenadas_por_cep

router = APIRouter(prefix="/busca", tags=["busca"])

# TODO: mover para tabela de configuração
TOLERANCIA_ANOS_FALLBACK = 2


@router.get("/")
@limiter.limit("20/minute")
def buscar(
    request: Request,
    modelo_id: int,
    ano: int,
    cep: str,
    ordenar_por: str = "compatibilidade",  # ou "distancia"
    db: Session = Depends(get_db),
):
    """
    Retorna os desmontes compatíveis, agrupados por empresa — cada
    empresa aparece uma vez, com a lista de veículos dela que casam
    com a busca. Nível de confiança por veículo:
      - compativel_exato: o ano do veículo bate exatamente com o
        ano buscado (não é só "tem geração mapeada" — esse era o bug
        que fazia o resultado errado aparecer primeiro)
      - provavel: ano diferente, mas dentro da geração real mapeada
        para o modelo, ou dentro da tolerância de fallback (±2 anos)
        quando não há geração mapeada ainda
      - baixa_confianca: fora da tolerância e sem geração mapeada
    """
    coordenadas = obter_coordenadas_por_cep(cep)
    if coordenadas is None:
        raise HTTPException(
            status_code=422,
            detail="Não foi possível localizar esse CEP. Confira e tente novamente.",
        )
    lat, lon = coordenadas

    query = text(
        """
        SELECT
            v.id AS veiculo_id,
            e.id AS empresa_id,
            e.nome AS empresa_nome,
            e.telefone,
            v.ano_fabricacao,
            CASE
                WHEN v.ano_fabricacao = :ano THEN 'compativel_exato'
                WHEN v.geracao_id IS NOT NULL THEN 'provavel'
                WHEN v.ano_fabricacao BETWEEN (:ano - :tolerancia)
                    AND (:ano + :tolerancia) THEN 'provavel'
                ELSE 'baixa_confianca'
            END AS nivel_confianca,
            distancia_km(:lat, :lon, e.latitude, e.longitude) AS distancia_km
        FROM veiculos_desmonte v
        JOIN empresas e ON e.id = v.empresa_id
        WHERE v.modelo_id = :modelo_id
          AND e.ativo = TRUE
          AND e.status_verificacao = 'verificado'
          AND e.latitude IS NOT NULL
          AND e.longitude IS NOT NULL
          AND v.status = 'disponivel'
        """
    )
    linhas = db.execute(
        query,
        {
            "modelo_id": modelo_id,
            "ano": ano,
            "tolerancia": TOLERANCIA_ANOS_FALLBACK,
            "lat": lat,
            "lon": lon,
        },
    ).fetchall()

    # Agrupa por empresa em Python — SQL puro pra "lista aninhada por
    # grupo" fica ilegível; isso aqui é bem mais simples de acompanhar.
    grupos = {}
    for linha in linhas:
        m = linha._mapping
        empresa_id = m["empresa_id"]
        if empresa_id not in grupos:
            grupos[empresa_id] = {
                "empresa_id": empresa_id,
                "empresa_nome": m["empresa_nome"],
                "telefone": m["telefone"],
                "distancia_km": float(m["distancia_km"]),
                "tem_match_exato": False,
                "veiculos": [],
            }
        grupo = grupos[empresa_id]
        if m["nivel_confianca"] == "compativel_exato":
            grupo["tem_match_exato"] = True
        grupo["veiculos"].append(
            {
                "veiculo_id": m["veiculo_id"],
                "ano_fabricacao": m["ano_fabricacao"],
                "nivel_confianca": m["nivel_confianca"],
            }
        )

    resultado = list(grupos.values())

    # Ordena os veiculos dentro de cada card: match exato primeiro,
    # depois por proximidade do ano buscado.
    ordem_confianca = {"compativel_exato": 0, "provavel": 1, "baixa_confianca": 2}
    for grupo in resultado:
        grupo["veiculos"].sort(
            key=lambda v: (ordem_confianca[v["nivel_confianca"]], abs(v["ano_fabricacao"] - ano))
        )

    # Ordena os cards (empresas): na aba compatibilidade, quem tem
    # match exato vem primeiro, desempate por distância; na aba
    # distância, é só distância, sem considerar match.
    if ordenar_por == "distancia":
        resultado.sort(key=lambda g: g["distancia_km"])
    else:
        resultado.sort(key=lambda g: (not g["tem_match_exato"], g["distancia_km"]))

    return resultado
