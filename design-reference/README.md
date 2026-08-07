# Handoff: identidade visual Ferrozap

Marketplace de pecas automotivas usadas que conecta consumidores e oficinas a desmontadoras verificadas.
Este pacote e a **biblioteca visual completa** da marca: entregue a pasta inteira ao Claude Code e peca
para ele construir as telas em cima dela.

---

## Como usar este pacote (leia primeiro)

> **Prompt sugerido para o Claude Code:**
> "Este e o sistema visual do Ferrozap. Leia `README.md` inteiro e use `css/industry.css` +
> `css/ferrozap.css` como unica fonte de estilo. Nao invente cores, fontes, raios ou espacamentos:
> use as variaveis CSS. Nao crie classes paralelas as que ja existem. Construa a tela X seguindo
> os padroes de markup documentados aqui e o `exemplo.html`."

Regras inegociaveis:

1. **Ordem de carregamento:** `css/industry.css` primeiro, `css/ferrozap.css` depois.
2. **Zero hex solto no codigo.** Toda cor, fonte, espaco e raio vem de `var(--*)`.
3. **Nada arredondado.** Cards, figuras e botoes sao objetos de desenho tecnico: canto reto,
   fio de 1px, marcas de registro `+` nos quatro cantos.
4. **Nao remova as marcas de canto** de um elemento emoldurado.
5. **Icones:** Lucide, traco 1.5, sempre. Nao desenhar icone novo.

### Fidelidade

**Alta fidelidade.** Cores, tipografia, espacamentos e estados sao finais. Os arquivos HTML deste
pacote sao **referencia de design**, nao codigo de producao — recrie as telas no ambiente do projeto
(React, Next, Astro, HTML puro), reaproveitando os dois CSS como estao.

---

## 1. Marca

### Simbolo
Chapa retangular com o canto inferior direito chanfrado, com a letra F vazada. E a peca cortada na
guilhotina — o corte que toda peca de lataria tem. Desenhado numa malha 48x48.

Caminho SVG canonico (nao redesenhar):

```html
<svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
  <polygon points="2,2 46,2 46,36 36,46 2,46" fill="var(--fz-aco-forte)"></polygon>
  <path d="M15 12 H35 V19 H23 V23.5 H33 V30.5 H23 V37 H15 Z" fill="var(--fz-papel)"></path>
</svg>
```

### Assinatura (wordmark)
`FERROZAP` em **Barlow Condensed 600**, caixa alta, `letter-spacing: 0.05em`. Uma palavra so —
nunca FerroZap, Ferro Zap ou FERRO-ZAP.

### Arquivos
| Arquivo | Uso |
| --- | --- |
| `assets/logo-horizontal.svg` | versao principal |
| `assets/logo-empilhada.svg` | onde falta largura |
| `assets/logo-simbolo.svg` | simbolo isolado (app, avatar) |
| `assets/logo-simbolo-reversa.svg` | sobre fundo aco 900 |
| `assets/favicon.svg` | favicon / touch icon |

Os SVGs de assinatura usam `<text>` com Barlow Condensed. Para uso impresso ou fora do navegador,
converta o texto em curvas.

### Area de protecao e tamanho minimo
Margem livre em todos os lados = altura da barra do F (1/6 da altura do simbolo).
Simbolo minimo 16px; lockup horizontal minimo 96px de largura.

### Nao faca
- Arredondar, aplicar sombra, gradiente ou textura de metal escovado.
- Mover o chanfro de canto (sempre inferior direito).
- Colocar a marca sobre foto sem uma chapa solida atras.

---

## 2. Cor

Esquema **mono**: uma unica cor de marca, o aco. O colorido da interface vem das fotos das pecas.

| Papel | Token | Hex | Uso |
| --- | --- | --- | --- |
| Aco campo | `--color-accent-900` / `--fz-aco-campo` | `#1d2d3d` | faixa cheia de secao, tipo em papel. Uma por pagina |
| Aco forte | `--color-accent-700` / `--fz-aco-forte` | `#416180` | texto em aco, links, icones, selo |
| Aco base | `--color-accent` / `--fz-aco` | `#5980a6` | preenchimento de botao primario, chrome |
| Aco claro | `--color-accent-200` | `#d6ebff` | fundo de tag, hover |
| Tinta | `--color-text` / `--fz-tinta` | `#1d1f20` | texto |
| Papel | `--color-bg` / `--fz-papel` | `#f2f2f3` | fundo de toda tela |
| Fundo de foto | `--color-neutral-100` | `#f5f5f8` | fundo das fotos de produto |

Rampas completas 100–900 em `--color-neutral-*` e `--color-accent-*`. Prefira degraus da rampa a
`color-mix()` improvisado.

**Contraste:** o aco base nao tem contraste para texto corrido — em paragrafo use `--color-accent-700`.

**Estados funcionais** (nao sao cor de marca, so status de anuncio):
disponivel `#2f7a4d`, vendido `#9a3b32`. Usar so como ponto/etiqueta, nunca como area grande.

---

## 3. Tipografia

| Papel | Fonte | Peso | Detalhe |
| --- | --- | --- | --- |
| Titulos | Barlow Condensed (`--font-heading`) | 600 | `line-height: 1.12`, `letter-spacing: -0.015em` |
| Corpo | Barlow (`--font-body`) | 400 / 500 | 15–18px, `line-height: 1.55` |
| Codigos e rotulos | Barlow | 400 | caixa alta, `letter-spacing: 0.12–0.16em` |

Escala de titulo: 76 / 56 / 40 / 32 / 24 / 20 px. Corpo: 18 / 16 / 15 / 14 / 13 px.
Nunca italico — nem em codigo OEM, placa ou lote.

Carregue as fontes com o `@import` que ja esta no topo de `ferrozap.css`, ou com `<link>` do
Google Fonts: `Barlow:wght@400;500;600` e `Barlow+Condensed:wght@500;600;700`.

---

## 4. Espacamento, grade e raio

- Escala: `--space-1` 3.4 · `--space-2` 6.8 · `--space-3` 10.2 · `--space-4` 13.6 · `--space-6` 20.4 · `--space-8` 27.2 px.
- Conteudo: largura maxima `1180px`, gutter `40px` (20px no mobile) — `.fz-wrap`.
- Secoes: `padding: 56px 0` com `border-top: 1px solid var(--color-divider)` — `.fz-secao`.
- Grade: celulas de largura igual, ritmo horizontal e vertical visivel. As linhas da grade sao
  parte do desenho — mostre-as.
- Raio: `--radius-sm` 2px, `--radius-md` 4px, `--radius-lg` 7px. Cards e figuras: **0**.

---

## 5. Componentes

Todos vem de `industry.css`. Nao recrie.

| Classe | O que e |
| --- | --- |
| `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-icon` / `.btn-block` | acoes; o primario e o unico objeto solido da tela |
| `.tag` + `.tag-accent` / `.tag-neutral` / `.tag-outline` | etiquetas |
| `.card` + `.card-kicker` / `.card-title` / `.card-body` / `.card-meta` | card transparente de fio |
| `.field`, `.input`, `.radio` + `.dot`, `.seg` + `.seg-opt` | formularios |
| `.nav` + `.nav-brand` | barra de topo |
| `.table` | tabela de dados |
| `.dialog-backdrop` + `.dialog` | modal |
| `.blueprint` + 4x `<i class="corner tl/tr/bl/br">` | a moldura de fio com marcas de registro |
| `.duotone` | tratamento de foto institucional |

**Botao primario** (leva moldura, e a excecao solida do sistema):

```html
<a class="btn btn-primary blueprint" href="#">
  <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
  Falar com a desmontadora
</a>
```

### Componentes de marca (em `ferrozap.css`)

| Classe | O que e |
| --- | --- |
| `.fz-wrap` / `.fz-secao` / `.fz-secao-num` / `.fz-campo` | estrutura de pagina e faixa em aco 900 |
| `.fz-logo` + `.fz-logo-nome` (+ `.fz-logo--reversa`) | lockup da marca |
| `.fz-rotulo` / `.fz-codigo` | rotulos em caixa alta e dados tecnicos (OEM, lote, placa) |
| `.fz-selo` | "Desmontadora verificada" com icone `badge-check` |
| `.fz-foto` | figura emoldurada 4:3 com fundo neutro |
| `.fz-card-peca` + `.fz-card-titulo` / `.fz-tags` / `.fz-preco-linha` / `.fz-preco` / `.fz-preco-novo` | card de anuncio |
| `.fz-categorias` + `.fz-categoria` | grade de familias de peca |
| `.fz-status--disponivel` / `--vendido` | status do anuncio |

---

## 6. Estados de interacao

Ja vem prontos no `industry.css` — **nao restilizar por pagina**.

- Hover: degrau da rampa do aco. Pressionado: um degrau alem da base (`--color-accent-600`).
- Foco de teclado: `outline: 2px solid var(--color-accent); outline-offset: 2px`. Nunca o anel azul padrao.
- Desabilitado: 45% de opacidade.
- `::selection`: tinta de aco.

---

## 7. Iconografia do catalogo

Lucide (https://lucide.dev), traco **1.5**, cor `--fz-aco-forte`, 30px na grade de categorias e
15–16px inline. Um icone por familia de peca — subcategoria e texto, nao icone novo.

| Familia | Icone Lucide |
| --- | --- |
| Motor | `cog` |
| Cambio | `settings-2` |
| Suspensao | `waves` |
| Freios | `disc-3` |
| Lataria | `car-front` |
| Farois | `lightbulb` |
| Eletrica | `battery-charging` |
| Rodas | `circle-dot` |
| Interior | `armchair` |
| Vidros | `panel-top` |
| Arrefecimento | `thermometer` |
| Escapamento | `wind` |
| Desmontadora verificada | `badge-check` |
| Busca | `search` · Localizacao | `map-pin` · Nota fiscal | `receipt` |

---

## 8. Direcao de imagem

**Foto de produto** (a regra da casa):
- Peca isolada em fundo cinza continuo `#f5f5f8`, sem horizonte e sem bancada aparecendo.
- Luz difusa de cima, sombra de contato curta, peca inteira no quadro com 10% de respiro, 4:3.
- **Sem duotone e sem retoque.** Risco, ferrugem e desgaste ficam visiveis — retocar defeito e fraude.
- Toda foto ganha a moldura de fio com as marcas de canto. Nada arredondado ou recortado.

**Foto institucional** (patio, equipe, desmontadora): passa pelo wrapper `.duotone`, que dessatura
e lava a imagem no aco.

---

## 9. Voz

Frase curta, verbo na frente, numero quando existir. A marca nunca promete o que a desmontadora entrega.

Assinatura: **"A peca existe. A gente mostra onde."** — uma linha, sem exclamacao.

| Escreva | Nao escreva |
| --- | --- |
| "Peca em 41 desmontadoras verificadas." | "A revolucao do mercado de autopecas." |
| "Farol de Gol G5, com nota, R$ 240." | "Sua peca e nossa paixao!" |
| "Retire hoje ou receba em 3 dias." | "Preco imbativel, aproveite ja!!!" |

---

## 10. Arquivos deste pacote

```
design_handoff_ferrozap/
  README.md                     este documento — a fonte da verdade
  exemplo.html                  pagina de exemplo pronta (nav, categorias, card de peca)
  css/industry.css              sistema Industry: tokens + componentes. NAO EDITAR
  css/ferrozap.css              camada de marca Ferrozap
  assets/                       logos SVG + favicon
  referencia/                   o manual de marca completo, como foi desenhado
```

`referencia/Ferrozap Marca.dc.html` e o manual visual navegavel (simbolo, variacoes, cor,
tipografia, icones, imagem, aplicacao). Abra no navegador para ver o alvo. Ele depende de
`image-slot.js` (na mesma pasta) e dos CSS em `../css/` — se abrir fora deste pacote, ajuste os
caminhos do `<link>`.

**Faltando:** fotografia real de peca e de patio. Os espacos de imagem estao vazios ate o cliente
enviar o material.
