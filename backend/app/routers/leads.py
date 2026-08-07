from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_empresa_atual, get_usuario_atual
from app.models import LeadWhatsapp, UsuarioFinal, VeiculoDesmonte, Empresa
from app.schemas import LeadWhatsappCreate, LeadWhatsappOut

router = APIRouter(prefix="/leads-whatsapp", tags=["leads"])


@router.post("/", response_model=LeadWhatsappOut, status_code=201)
def registrar_lead(
    dados: LeadWhatsappCreate,
    usuario: UsuarioFinal = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    """
    Chamado no momento em que o cliente clica "Salvar", antes de abrir
    o WhatsApp — não é conversa, é só registro de "isso aconteceu",
    pra dar visibilidade de lead gerado sem precisar da mensageria.
    """
    veiculo = (
        db.query(VeiculoDesmonte).filter(VeiculoDesmonte.id == dados.veiculo_desmonte_id).first()
    )
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo em desmonte não encontrado.")

    lead = LeadWhatsapp(
        usuario_final_id=usuario.id,
        empresa_id=veiculo.empresa_id,
        veiculo_desmonte_id=veiculo.id,
        descricao_peca=dados.descricao_peca,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/minhas", response_model=list[LeadWhatsappOut])
def listar_meus_leads_recebidos(
    empresa: Empresa = Depends(get_empresa_atual),
    db: Session = Depends(get_db),
):
    """Empresa vê os leads que recebeu — só o registro, a conversa em si está no WhatsApp dela."""
    return (
        db.query(LeadWhatsapp)
        .filter(LeadWhatsapp.empresa_id == empresa.id)
        .order_by(LeadWhatsapp.criado_em.desc())
        .all()
    )
