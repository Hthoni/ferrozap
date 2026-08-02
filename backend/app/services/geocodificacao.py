import unicodedata

import httpx

from app.services.municipios_data import COORDENADAS_MUNICIPIO

# Fallback de último recurso: coordenadas aproximadas da capital de
# cada UF, usado só se o município não for encontrado na base do IBGE
# (nome digitado de forma muito diferente, cidade extinta/renomeada,
# etc.) — na prática deve ser raro agora que temos os 5.571 municípios.
CENTROIDE_UF = {
    "AC": (-9.975, -67.824), "AL": (-9.649, -35.708), "AP": (0.034, -51.070),
    "AM": (-3.119, -60.021), "BA": (-12.971, -38.511), "CE": (-3.717, -38.543),
    "DF": (-15.780, -47.929), "ES": (-20.315, -40.312), "GO": (-16.686, -49.264),
    "MA": (-2.530, -44.302), "MT": (-15.601, -56.097), "MS": (-20.469, -54.620),
    "MG": (-19.917, -43.934), "PA": (-1.456, -48.503), "PB": (-7.115, -34.861),
    "PR": (-25.429, -49.271), "PE": (-8.047, -34.877), "PI": (-5.089, -42.802),
    "RJ": (-22.907, -43.172), "RN": (-5.795, -35.209), "RS": (-30.034, -51.218),
    "RO": (-8.762, -63.904), "RR": (2.820, -60.673), "SC": (-27.596, -48.549),
    "SP": (-23.550, -46.633), "SE": (-10.947, -37.073), "TO": (-10.184, -48.334),
}


def _normalizar(nome: str) -> str:
    sem_acento = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode()
    return sem_acento.strip().lower()


def obter_coordenadas_por_cep(cep: str) -> tuple[float, float] | None:
    """
    Resolve CEP -> cidade/UF via ViaCEP, depois cidade -> coordenada
    real do município (base do IBGE, ~5.571 municípios). Cai pro
    centro do estado só se o município não for encontrado — bem mais
    raro agora do que quando usávamos só a UF.
    """
    cep_limpo = cep.replace("-", "").strip()
    if len(cep_limpo) != 8 or not cep_limpo.isdigit():
        return None

    try:
        resposta = httpx.get(f"https://viacep.com.br/ws/{cep_limpo}/json/", timeout=5.0)
        dados = resposta.json()
    except httpx.HTTPError:
        return None

    if dados.get("erro"):
        return None

    uf = dados.get("uf")
    localidade = dados.get("localidade")

    if uf and localidade:
        chave = f"{uf}|{_normalizar(localidade)}"
        if chave in COORDENADAS_MUNICIPIO:
            return COORDENADAS_MUNICIPIO[chave]

    return CENTROIDE_UF.get(uf)
