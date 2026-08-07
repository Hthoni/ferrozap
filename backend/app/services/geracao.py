from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Geracao


def resolver_geracao(db: Session, modelo_id: int, ano: int) -> int | None:
    """
    Encontra a geração cujo intervalo de anos cobre o ano informado,
    para o modelo dado. Retorna None se o modelo ainda não tem nenhuma
    geração mapeada nesse intervalo — nesse caso, o chamador deve usar
    o fallback por tolerância de ano (ver app/routers/busca.py).
    """
    geracao = (
        db.query(Geracao)
        .filter(
            Geracao.modelo_id == modelo_id,
            Geracao.ano_inicio <= ano,
            Geracao.ano_fim >= ano,
        )
        .first()
    )
    return geracao.id if geracao else None


def anos_disponiveis(db: Session, modelo_id: int) -> tuple[list[int], bool]:
    """
    Anos que devem aparecer no dropdown de ano de fabricação, pro
    modelo dado. Quando existem gerações mapeadas, é a união exata dos
    intervalos (dropdown "inteligente"). Quando não existe nenhuma
    geração ainda, cai num intervalo amplo — não trava a busca, só
    ainda não filtra tão bem.

    Retorna (lista_de_anos, tem_geracao_real) — o segundo valor diz
    pro chamador se o resultado é confiável (geração real) ou só o
    fallback genérico, pra decidir entre mostrar dropdown ou texto
    livre (ex: BYD Dolphin, carro novo, não devia mostrar 1970).
    """
    geracoes = db.query(Geracao).filter(Geracao.modelo_id == modelo_id).all()
    if not geracoes:
        ano_atual = datetime.now().year
        return list(range(ano_atual, 1969, -1)), False

    anos = set()
    for g in geracoes:
        anos.update(range(g.ano_inicio, g.ano_fim + 1))
    return sorted(anos, reverse=True), True


def backfill_geracao(db: Session, geracao: Geracao) -> int:
    """
    Ao cadastrar uma nova geração, promove retroativamente os veículos
    em desmonte já cadastrados daquele modelo cujo ano cai no intervalo
    e que ainda não tinham geração resolvida. Retorna quantos foram
    atualizados.
    """
    from app.models import VeiculoDesmonte

    veiculos = (
        db.query(VeiculoDesmonte)
        .filter(
            VeiculoDesmonte.modelo_id == geracao.modelo_id,
            VeiculoDesmonte.geracao_id.is_(None),
            VeiculoDesmonte.ano_fabricacao >= geracao.ano_inicio,
            VeiculoDesmonte.ano_fabricacao <= geracao.ano_fim,
        )
        .all()
    )
    for v in veiculos:
        v.geracao_id = geracao.id
    db.commit()
    return len(veiculos)
