import re


def normalizar_telefone(valor: str) -> str:
    """
    Deixa o telefone só com dígitos, e remove o "55" de código de país
    quando presente -- padroniza pra DDD + número (10 ou 11 dígitos),
    independente de como a pessoa digitou (com +55, com espaço, com
    hífen, etc). Usada tanto no cadastro/edição quanto no login, pra
    garantir que a mesma pessoa sempre bate a mesma string, não importa
    a formatação que ela usou em cada momento.
    """
    if not valor:
        return valor
    apenas_digitos = re.sub(r"\D", "", valor)
    # "55" + DDD (2) + numero (8 ou 9) = 12 ou 13 digitos totais.
    # DDD + numero sozinho = 10 ou 11. Corta o "55" só quando o
    # tamanho total bate com "tem código de país" -- funciona mesmo
    # pra quem tem DDD 55 de verdade (Rio Grande do Sul existe), porque
    # só removemos os DOIS PRIMEIROS dígitos, não procuramos "55" solto
    # em qualquer posição.
    if apenas_digitos.startswith("55") and len(apenas_digitos) in (12, 13):
        apenas_digitos = apenas_digitos[2:]
    return apenas_digitos
