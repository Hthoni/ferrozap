from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Consulta(Base):
    __tablename__ = "consultas"

    id = Column(Integer, primary_key=True)
    usuario_final_id = Column(Integer, ForeignKey("usuarios_finais.id"), nullable=False)
    modelo_id = Column(Integer, ForeignKey("modelos.id"), nullable=False)
    submodelo_id = Column(Integer, ForeignKey("submodelos.id"), nullable=True)
    ano = Column(Integer, nullable=False)
    cep = Column(String(9), nullable=True)
    criado_em = Column(DateTime, server_default=func.now())


class Conversa(Base):
    __tablename__ = "conversas"

    id = Column(Integer, primary_key=True)
    consulta_id = Column(Integer, ForeignKey("consultas.id"), nullable=False)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    veiculo_desmonte_id = Column(Integer, ForeignKey("veiculos_desmonte.id"), nullable=False)
    status = Column(String(20), default="aguardando")  # aguardando | respondida | sem_resposta
    criado_em = Column(DateTime, server_default=func.now())
    primeira_resposta_em = Column(DateTime, nullable=True)
    ultima_atividade_em = Column(DateTime, server_default=func.now())


class Mensagem(Base):
    __tablename__ = "mensagens"

    id = Column(Integer, primary_key=True)
    conversa_id = Column(Integer, ForeignKey("conversas.id"), nullable=False)
    remetente_tipo = Column(String(10), nullable=False)  # cliente | empresa
    texto = Column(Text, nullable=False)
    criado_em = Column(DateTime, server_default=func.now())
