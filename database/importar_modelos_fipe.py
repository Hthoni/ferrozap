#!/usr/bin/env python3
"""
Importa a lista de modelos de veículo da API pública Parallelum/FIPE
para todas as marcas já cadastradas no Ferrozap, e gera um arquivo SQL
pronto para colar no SQL Editor do Supabase.

Como rodar (via Google Cloud Shell, ou qualquer ambiente com internet
livre — não roda no sandbox do Claude, que tem rede restrita):

    python3 importar_modelos_fipe.py > modelos_importados.sql

Depois é só abrir o arquivo modelos_importados.sql gerado e colar no
SQL Editor do Supabase.

Requer só a biblioteca padrão do Python (urllib) — nada para instalar.
"""

import json
import re
import time
import urllib.request
import urllib.error
import collections

BASE_URL = "https://fipe.parallelum.com.br/api/v2/cars"

# Mapa: nome como a FIPE usa -> nome normalizado que já está na tabela
# fabricantes do Ferrozap (database/seed_fabricantes_modelos.sql).
# Marcas da FIPE que não aparecem aqui são normalizadas automaticamente
# (title case), o que cobre a maioria dos casos.
NORMALIZACAO = {
    "VW - VolksWagen": "Volkswagen",
    "GM - Chevrolet": "Chevrolet",
    "Kia Motors": "Kia",
    "GREAT WALL": "Great Wall",
    "ASTON MARTIN": "Aston Martin",
    "CHANA": "Chana",
    "CHANGAN": "Changan",
    "HITECH ELECTRIC": "Hitech Electric",
    "IVECO": "Iveco",
    "JINBEI": "Jinbei",
    "LAMBORGHINI": "Lamborghini",
    "LIFAN": "Lifan",
    "LOBINI": "Lobini",
    "MINI": "Mini",
    "NETA": "Neta",
    "RELY": "Rely",
    "SERES": "Seres",
    "SHINERAY": "Shineray",
    "SSANGYONG": "SsangYong",
    "TAC": "TAC",
    "ZEEKR": "Zeekr",
    "FEVER": "Fever",
    "FOTON": "Foton",
    "GEELY": "Geely",
    "HAFEI": "Hafei",
    "Caoa Chery/Chery": "Caoa Chery",
}

# Nameplates compostos de 2 palavras (senão o script assume 1 palavra
# como nome do modelo). Adicione aqui se notar algum errado no resultado.
COMPOSTOS = {
    "new beetle", "grand saveiro", "space fox", "space cross",
    "c3 aircross", "c3 picasso", "c4 cactus", "c4 lounge", "c4 picasso",
    "range rover", "land cruiser", "hilux sw4", "corolla cross",
    "grand siena", "grand cherokee", "l 200", "pajero sport",
    "pajero full", "tucson ix35", "creta cross",
}

PADRAO_ESPEC = re.compile(
    r'^\(|\d|TSI|TDI|MSI|MPI|Turbo|Flex|^Mi$|Aut\.?$|Mec\.?$|Tiptronic|'
    r'Diesel|^CD$|^CE$|^CS$|Dies|Hatch|Sedan|Wagon',
    re.IGNORECASE,
)


def buscar_json(url, tentativas=3):
    for tentativa in range(tentativas):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, urllib.error.HTTPError) as e:
            if tentativa == tentativas - 1:
                print(f"-- AVISO: falha ao buscar {url}: {e}", flush=True)
                return None
            time.sleep(2)


def normalizar_marca(nome_fipe):
    if nome_fipe in NORMALIZACAO:
        return NORMALIZACAO[nome_fipe]
    # Title case simples para o resto ("BMW", "JAC", "GWM" ficam
    # preservados porque já são maiúsculas puras / siglas curtas)
    if nome_fipe.isupper() and len(nome_fipe) <= 4:
        return nome_fipe
    return nome_fipe.title() if nome_fipe.isupper() else nome_fipe


def extrair_modelo(nome_completo):
    limpo = nome_completo.replace("(novo)", "").strip()
    tokens = limpo.split()
    if not tokens:
        return nome_completo.strip()
    primeiro_dois = " ".join(tokens[:2]).lower()
    if primeiro_dois in COMPOSTOS:
        modelo = " ".join(tokens[:2])
    else:
        modelo = tokens[0]
    return modelo.strip(" /-").title()


def escapar_sql(texto):
    return texto.replace("'", "''")


def main():
    print("-- Gerado automaticamente por importar_modelos_fipe.py")
    print("-- Fonte: API pública Parallelum/FIPE (fipe.parallelum.com.br)")
    print("-- Extração: nome do modelo = primeira palavra (ou nameplate")
    print("-- composto conhecido) do nome completo retornado pela FIPE.")
    print()

    marcas = buscar_json(f"{BASE_URL}/brands")
    if not marcas:
        print("-- ERRO: não foi possível buscar a lista de marcas. Abortando.")
        return

    print("INSERT INTO modelos (fabricante_id, nome, tem_submodelo_relevante) VALUES")
    linhas = []

    for marca in marcas:
        nome_normalizado = normalizar_marca(marca["name"])
        print(f"-- Buscando modelos de: {marca['name']} -> {nome_normalizado}", flush=True)

        modelos_raw = buscar_json(f"{BASE_URL}/brands/{marca['code']}/models")
        time.sleep(0.3)  # gentileza com a API gratuita

        if not modelos_raw:
            continue

        contagem = collections.Counter()
        for item in modelos_raw:
            nome_modelo = extrair_modelo(item["name"])
            if nome_modelo:
                contagem[nome_modelo] += 1

        for nome_modelo, qtd_variantes in contagem.items():
            tem_sub = "true" if qtd_variantes >= 3 else "false"
            linhas.append(
                f"  ((SELECT id FROM fabricantes WHERE nome = '{escapar_sql(nome_normalizado)}'), "
                f"'{escapar_sql(nome_modelo)}', {tem_sub})"
            )

    print(",\n".join(linhas))
    print("ON CONFLICT (fabricante_id, nome) DO NOTHING;")
    print()
    print(f"-- Total de modelos extraídos: {len(linhas)}", flush=True)


if __name__ == "__main__":
    main()
