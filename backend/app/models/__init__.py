from app.models.veiculo import Fabricante, Modelo, Submodelo, Geracao
from app.models.empresa import Empresa, VeiculoDesmonte
from app.models.usuario import UsuarioFinal
from app.models.mensageria import Consulta, Conversa, Mensagem
from app.models.lead import LeadWhatsapp

__all__ = [
    "Fabricante",
    "Modelo",
    "Submodelo",
    "Geracao",
    "Empresa",
    "VeiculoDesmonte",
    "UsuarioFinal",
    "Consulta",
    "Conversa",
    "Mensagem",
    "LeadWhatsapp",
]
