from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class SugestaoCatalogo(Base):
    """
    Fila de sugestões de fabricante/modelo digitados pelo cliente na
    busca (texto livre), quando não existem no catálogo ainda.

    N-08: antes disso, o texto livre era gravado DIRETO no catálogo
    compartilhado (fabricantes/modelos), sem moderação — qualquer
    visitante podia poluir a lista vista por todos (foi exatamente o
    que aconteceu com "Marca Teste QA" numa rodada de QA). Agora só
    fica registrado aqui, pra revisão manual antes de virar catálogo
    de verdade.

    Isso é só pro fluxo de BUSCA do cliente. O cadastro de estoque da
    empresa (EstoqueEmpresa.jsx) continua criando fabricante/modelo
    real direto -- ali é necessário, porque o veículo em desmonte
    precisa de um modelo_id de verdade pra existir.
    """
    __tablename__ = "sugestoes_catalogo"

    id = Column(Integer, primary_key=True)
    tipo = Column(String(20), nullable=False)  # "fabricante" | "modelo"
    nome = Column(String(150), nullable=False)
    fabricante_nome = Column(String(150), nullable=True)  # só preenchido quando tipo=modelo
    criado_em = Column(DateTime, server_default=func.now())
