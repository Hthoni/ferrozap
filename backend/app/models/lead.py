from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database import Base


class LeadWhatsapp(Base):
    """
    Registro leve de "esse contato aconteceu" — não é conversa com
    thread (isso acontece de verdade no WhatsApp, fora do nosso
    sistema). Existe só pra não perder 100% da métrica de lead gerado
    depois que o contato passou a ser via link direto, em vez da
    mensageria própria.
    """
    __tablename__ = "leads_whatsapp"

    id = Column(Integer, primary_key=True)
    usuario_final_id = Column(Integer, ForeignKey("usuarios_finais.id"), nullable=False)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    veiculo_desmonte_id = Column(Integer, ForeignKey("veiculos_desmonte.id"), nullable=False)
    descricao_peca = Column(Text, nullable=False)
    criado_em = Column(DateTime, server_default=func.now())
