from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_sujeito_atual, get_usuario_atual
from app.models import (
    Conversa,
    Consulta,
    Mensagem,
    VeiculoDesmonte,
    Modelo,
    Submodelo,
    Fabricante,
    UsuarioFinal,
    Empresa,
)
from app.schemas import ConversaCreate, ConversaComVeiculoOut, MensagemCreate, MensagemOut

router = APIRouter(prefix="/conversas", tags=["mensageria"])


def _carregar_conversa_autorizada(conversa_id: int, sujeito: dict, db: Session) -> Conversa:
    conversa = db.query(Conversa).filter(Conversa.id == conversa_id).first()
    if not conversa:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    if sujeito["tipo"] == "empresa":
        if conversa.empresa_id != sujeito["id"]:
            raise HTTPException(status_code=403, detail="Conversa não pertence a esta empresa.")
    elif sujeito["tipo"] == "usuario_final":
        consulta = db.query(Consulta).filter(Consulta.id == conversa.consulta_id).first()
        if not consulta or consulta.usuario_final_id != sujeito["id"]:
            raise HTTPException(status_code=403, detail="Conversa não pertence a este usuário.")
    else:
        raise HTTPException(status_code=403, detail="Tipo de sujeito desconhecido.")

    return conversa


def _query_conversas_com_veiculo(db: Session):
    return (
        db.query(
            Conversa,
            Fabricante.nome.label("fabricante_nome"),
            Modelo.nome.label("modelo_nome"),
            VeiculoDesmonte.ano_fabricacao,
            Submodelo.nome.label("submodelo_nome"),
            Empresa.nome.label("empresa_nome"),
            Empresa.whatsapp.label("empresa_whatsapp"),
        )
        .join(VeiculoDesmonte, VeiculoDesmonte.id == Conversa.veiculo_desmonte_id)
        .join(Modelo, Modelo.id == VeiculoDesmonte.modelo_id)
        .join(Fabricante, Fabricante.id == Modelo.fabricante_id)
        .join(Consulta, Consulta.id == Conversa.consulta_id)
        .join(Empresa, Empresa.id == Conversa.empresa_id)
        .outerjoin(Submodelo, Submodelo.id == Consulta.submodelo_id)
    )


def _linha_para_saida(
    conversa,
    fabricante_nome,
    modelo_nome,
    ano_fabricacao,
    submodelo_nome=None,
    empresa_nome=None,
    empresa_whatsapp=None,
    tem_nao_lida=False,
):
    return {
        "id": conversa.id,
        "consulta_id": conversa.consulta_id,
        "empresa_id": conversa.empresa_id,
        "veiculo_desmonte_id": conversa.veiculo_desmonte_id,
        "status": conversa.status,
        "criado_em": conversa.criado_em,
        "primeira_resposta_em": conversa.primeira_resposta_em,
        "ultima_atividade_em": conversa.ultima_atividade_em,
        "fabricante_nome": fabricante_nome,
        "modelo_nome": modelo_nome,
        "ano_fabricacao": ano_fabricacao,
        "submodelo_nome": submodelo_nome,
        "tem_nao_lida": tem_nao_lida,
        "empresa_nome": empresa_nome,
        "empresa_whatsapp": empresa_whatsapp,
    }


def _conversas_com_nao_lida(db: Session, conversa_ids: list[int], remetente_oposto: str) -> set[int]:
    """IDs de conversa que têm pelo menos uma mensagem não lida vinda do outro lado."""
    if not conversa_ids:
        return set()
    linhas = (
        db.query(Mensagem.conversa_id)
        .filter(
            Mensagem.conversa_id.in_(conversa_ids),
            Mensagem.remetente_tipo == remetente_oposto,
            Mensagem.lida.is_(False),
        )
        .distinct()
        .all()
    )
    return {l.conversa_id for l in linhas}


@router.post("/", response_model=ConversaComVeiculoOut, status_code=201)
def iniciar_conversa(
    dados: ConversaCreate,
    usuario: UsuarioFinal = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    veiculo = (
        db.query(VeiculoDesmonte).filter(VeiculoDesmonte.id == dados.veiculo_desmonte_id).first()
    )
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo em desmonte não encontrado.")

    consulta = Consulta(
        usuario_final_id=usuario.id,
        modelo_id=dados.modelo_id,
        submodelo_id=dados.submodelo_id,
        ano=dados.ano,
        cep=dados.cep,
    )
    db.add(consulta)
    db.flush()

    conversa = Conversa(
        consulta_id=consulta.id,
        empresa_id=veiculo.empresa_id,
        veiculo_desmonte_id=veiculo.id,
    )
    db.add(conversa)
    db.flush()

    mensagem = Mensagem(conversa_id=conversa.id, remetente_tipo="cliente", texto=dados.texto)
    db.add(mensagem)

    db.commit()
    db.refresh(conversa)

    modelo = db.query(Modelo).filter(Modelo.id == veiculo.modelo_id).first()
    fabricante = db.query(Fabricante).filter(Fabricante.id == modelo.fabricante_id).first()
    empresa = db.query(Empresa).filter(Empresa.id == veiculo.empresa_id).first()
    submodelo_nome = None
    if consulta.submodelo_id:
        submodelo = db.query(Submodelo).filter(Submodelo.id == consulta.submodelo_id).first()
        submodelo_nome = submodelo.nome if submodelo else None
    return _linha_para_saida(
        conversa, fabricante.nome, modelo.nome, veiculo.ano_fabricacao, submodelo_nome,
        empresa_nome=empresa.nome, empresa_whatsapp=empresa.whatsapp,
    )


@router.get("/minhas", response_model=list[ConversaComVeiculoOut])
def listar_minhas_conversas(
    usuario: UsuarioFinal = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    linhas = (
        _query_conversas_com_veiculo(db)
        .filter(Consulta.usuario_final_id == usuario.id)
        .order_by(Conversa.ultima_atividade_em.desc())
        .all()
    )
    ids_nao_lidas = _conversas_com_nao_lida(db, [linha[0].id for linha in linhas], "empresa")
    return [
        _linha_para_saida(*linha, tem_nao_lida=linha[0].id in ids_nao_lidas) for linha in linhas
    ]


@router.get("/recebidas", response_model=list[ConversaComVeiculoOut])
def listar_conversas_recebidas(
    sujeito: dict = Depends(get_sujeito_atual),
    db: Session = Depends(get_db),
):
    if sujeito["tipo"] != "empresa":
        raise HTTPException(status_code=403, detail="Acesso restrito a empresas.")
    linhas = (
        _query_conversas_com_veiculo(db)
        .filter(Conversa.empresa_id == sujeito["id"])
        .order_by(Conversa.ultima_atividade_em.desc())
        .all()
    )
    ids_nao_lidas = _conversas_com_nao_lida(db, [linha[0].id for linha in linhas], "cliente")
    return [
        _linha_para_saida(*linha, tem_nao_lida=linha[0].id in ids_nao_lidas) for linha in linhas
    ]


@router.get("/contagem-nao-lidas")
def contar_nao_lidas(
    sujeito: dict = Depends(get_sujeito_atual),
    db: Session = Depends(get_db),
):
    """Usado pelo selo vermelho de mensagem não lida na barra de navegação."""
    if sujeito["tipo"] == "empresa":
        conversas_ids = [
            c.id for c in db.query(Conversa.id).filter(Conversa.empresa_id == sujeito["id"]).all()
        ]
        remetente_oposto = "cliente"
    elif sujeito["tipo"] == "usuario_final":
        conversas_ids = [
            c.id
            for c in db.query(Conversa.id)
            .join(Consulta, Consulta.id == Conversa.consulta_id)
            .filter(Consulta.usuario_final_id == sujeito["id"])
            .all()
        ]
        remetente_oposto = "empresa"
    else:
        return {"nao_lidas": 0}

    if not conversas_ids:
        return {"nao_lidas": 0}

    total = (
        db.query(Mensagem)
        .filter(
            Mensagem.conversa_id.in_(conversas_ids),
            Mensagem.remetente_tipo == remetente_oposto,
            Mensagem.lida.is_(False),
        )
        .count()
    )
    return {"nao_lidas": total}


@router.get("/{conversa_id}/mensagens", response_model=list[MensagemOut])
def listar_mensagens(
    conversa_id: int,
    sujeito: dict = Depends(get_sujeito_atual),
    db: Session = Depends(get_db),
):
    _carregar_conversa_autorizada(conversa_id, sujeito, db)

    meu_tipo = "empresa" if sujeito["tipo"] == "empresa" else "cliente"
    # Abrir a conversa marca como lida tudo que veio do outro lado.
    db.query(Mensagem).filter(
        Mensagem.conversa_id == conversa_id,
        Mensagem.remetente_tipo != meu_tipo,
        Mensagem.lida.is_(False),
    ).update({"lida": True})
    db.commit()

    return (
        db.query(Mensagem)
        .filter(Mensagem.conversa_id == conversa_id)
        .order_by(Mensagem.criado_em.asc())
        .all()
    )


@router.post("/{conversa_id}/mensagens", response_model=MensagemOut, status_code=201)
def enviar_mensagem(
    conversa_id: int,
    dados: MensagemCreate,
    sujeito: dict = Depends(get_sujeito_atual),
    db: Session = Depends(get_db),
):
    conversa = _carregar_conversa_autorizada(conversa_id, sujeito, db)

    remetente_tipo = "empresa" if sujeito["tipo"] == "empresa" else "cliente"
    mensagem = Mensagem(conversa_id=conversa.id, remetente_tipo=remetente_tipo, texto=dados.texto)
    db.add(mensagem)

    agora = datetime.now(timezone.utc)
    conversa.ultima_atividade_em = agora
    if remetente_tipo == "empresa" and conversa.status == "aguardando":
        conversa.status = "respondida"
        if conversa.primeira_resposta_em is None:
            conversa.primeira_resposta_em = agora

    db.commit()
    db.refresh(mensagem)
    return mensagem
