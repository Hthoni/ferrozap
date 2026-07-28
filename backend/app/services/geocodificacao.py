import httpx

# Fallback grosseiro para o MVP: coordenadas aproximadas da capital de
# cada UF. Suficiente para distinguir "13 km" de "120 km" como
# combinado, mas não tem precisão de bairro. Trocar pela tabela de
# centróide por município (IBGE) quando o volume justificar o esforço
# — ver docs/decisoes.md, "Pendências em aberto".
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


def obter_coordenadas_por_cep(cep: str) -> tuple[float, float] | None:
    """
    Resolve CEP -> UF via ViaCEP, depois UF -> coordenada aproximada.
    Retorna None se o CEP for inválido ou o serviço estiver fora do ar
    — o chamador deve tratar isso com uma mensagem clara, não travar
    a busca do usuário.
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

    return CENTROIDE_UF.get(dados.get("uf"))
