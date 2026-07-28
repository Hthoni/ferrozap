from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_sujeito_atual, get_usuario_atual
from app.models import Conversa, Consulta, Mensagem, VeiculoDesmonte, UsuarioFinal
from app.schemas import ConversaCreate, ConversaOut, MensagemCreate, MensagemOut

router = APIRouter(prefix="/conversas", tags=["mensageria"])


def _carregar_conversa_autorizada(conversa_id: int, sujeito: dict, db: Session) -> Conversa:
    """
    Busca a conversa e garante que o sujeito autenticado (empresa ou
    usuário final) é uma das duas partes envolvidas — nunca um terceiro.
    """
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


@router.post("/", response_model=ConversaOut, status_code=201)
def iniciar_conversa(
    dados: ConversaCreate,
    usuario: UsuarioFinal = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    """
    Cria a consulta (registro histórico da busca), a conversa (vínculo
    com a empresa dona do veículo em desmonte selecionado) e a primeira
    mensagem, tudo em uma única chamada — espelha o fluxo desenhado:
    o cliente seleciona um card de resultado e escreve o texto livre.
    """
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
    db.flush()  # garante consulta.id sem precisar commitar ainda

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
    return conversa


@router.get("/minhas", response_model=list[ConversaOut])
def listar_minhas_conversas(
    usuario: UsuarioFinal = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    return (
        db.query(Conversa)
        .join(Consulta, Consulta.id == Conversa.consulta_id)
        .filter(Consulta.usuario_final_id == usuario.id)
        .order_by(Conversa.ultima_atividade_em.desc())
        .all()
    )


@router.get("/recebidas", response_model=list[ConversaOut])
def listar_conversas_recebidas(
    sujeito: dict = Depends(get_sujeito_atual),
    db: Session = Depends(get_db),
):
    if sujeito["tipo"] != "empresa":
        raise HTTPException(status_code=403, detail="Acesso restrito a empresas.")
    return (
        db.query(Conversa)
        .filter(Conversa.empresa_id == sujeito["id"])
        .order_by(Conversa.ultima_atividade_em.desc())
        .all()
    )


@router.get("/{conversa_id}/mensagens", response_model=list[MensagemOut])
def listar_mensagens(
    conversa_id: int,
    sujeito: dict = Depends(get_sujeito_atual),
    db: Session = Depends(get_db),
):
    _carregar_conversa_autorizada(conversa_id, sujeito, db)
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
    # Só a resposta da empresa tira a conversa do estado "aguardando" —
    # mensagens adicionais do cliente não mudam o status.
    if remetente_tipo == "empresa" and conversa.status == "aguardando":
        conversa.status = "respondida"
        if conversa.primeira_resposta_em is None:
            conversa.primeira_resposta_em = agora

    db.commit()
    db.refresh(mensagem)
    return mensagem
