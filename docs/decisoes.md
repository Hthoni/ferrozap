# Decisões de produto e arquitetura

Registro vivo das decisões tomadas durante o design do projeto, antes da
solidificação em um documento de especificação formal.

## Nome e marca

- Nome escolhido: **Ferrozap**
- Domínio `ferrozap.com.br` registrado (livre no momento da checagem)
- Pendente: checagem de marca no INPI, redes sociais, variações de domínio

## Modelo de negócio

- Marketplace que conecta consumidor final a empresas de desmonte
  (ferro-velhos) para busca de peças usadas
- Monetização: mensalidade paga pelas empresas + publicidade
- Concorrentes identificados: Garimparts (pré-operacional, domínio
  registrado em 13/10/2025), Central Desmanche / VAAPT, Canal da Peça, Base

## Canal de acesso

- **Decisão: site/web próprio, não WhatsApp.**
- Motivo: dependência de plataforma de terceiro é risco estrutural.
  A Meta mudou o modelo de cobrança da API do WhatsApp Business três vezes
  em três anos (2023, jul/2025, out/2026), incluindo cobrança de mensagens
  de serviço a partir de 1º de outubro de 2026. Diferente de trocar de
  provedor de LLM, não existe alternativa de canal quando a Meta muda regra.
- Página própria com chat + upload de imagem (câmera via
  `<input type="file" accept="image/*" capture="environment">`, sem
  necessidade de app nativo)
- Mobile-first, com potencial de evoluir para PWA. App nativo só é
  considerado depois de tração validada.

## Identificação de veículo (camada "burra" antes do LLM)

- Formulário estruturado obrigatório: fabricante → modelo → submodelo
  (condicional, só quando `tem_submodelo_relevante = true`) → ano → CEP
- Zero custo de LLM nessa etapa — resolução determinística via banco
- O LLM só entra para refinar a **descrição da peça** (texto livre),
  não para identificar o veículo

## Matching de compatibilidade

- Tabela de `geracoes` por modelo (ano_inicio, ano_fim), alimentada aos
  poucos — convivendo com fallback por tolerância de ano (±2 anos) para
  modelos ainda não mapeados
- Cada veículo em desmonte carrega um `geracao_id` nullable; job de
  backfill promove registros antigos quando uma nova geração é cadastrada
- Dois níveis de confiança exibidos ao usuário: "Encontrado" (match exato
  de geração) vs "Encaixe provável" (fallback por tolerância) — sempre com
  aviso para confirmar diretamente com a empresa

## Geolocalização

- CEP do usuário traduzido via ViaCEP + base de coordenadas por
  CEP/município (fallback: centróide do município via IBGE)
- Distância linear (fórmula de Haversine), sem roteirização — não é papel
  do produto calcular rota de entrega
- Empresas cadastram coordenadas no próprio cadastro
- Resultados ordenáveis por compatibilidade ou por distância (toggle do
  usuário), com aba de mapa (pinos coloridos por nível de confiança)

## IA / LLM

- Padrão: LLM como orquestrador com function calling sobre o banco
  estruturado — nunca como fonte de verdade de compatibilidade
- Uso de foto: extração de categoria da peça, leitura de código OEM
  gravado na peça, leitura de VIN/plaqueta — tratado como recurso
  opcional de alta precisão quando disponível, não como caminho principal
- Recomendação de arquitetura: camada de abstração entre provedores de
  LLM (não travar em um único fornecedor), para reduzir custo de troca
  caso um provedor mude preço
- "Genius" (acesso ampliado ao LLM) cogitado como possível tier premium
  — decisão de monetização ainda em aberto

## Mensageria

- **Decisão: mensageria própria no site, não e-mail nem WhatsApp direto
  para o contato inicial.**
- Motivo: rastreabilidade de métricas (leads gerados, taxa de resposta,
  tempo de resposta) para justificar a mensalidade cobrada da empresa
- Cliente final precisa de conta com login/senha para acessar respostas
  (busca em si pode continuar sem login, login só exigido para contatar)
- Fluxo: cliente seleciona card(s) de resultado → mensagem pré-preenchida
  com fabricante/modelo/ano do veículo em desmonte → caixa de texto livre
  para descrever a necessidade
- O texto livre é o ponto de entrada natural para o LLM no futuro
- Handoff simples no MVP (não conversa mediada) — decisão consciente de
  não rastrear conversão até venda nessa fase, só geração de lead

## Painel de admin

- Lista de conversas com status: aguardando / respondida / sem resposta
- Cor por tempo decorrido (SLA configurável, não hardcoded): dentro do
  prazo, atenção, sem resposta
- Métrica de tempo de resposta serve tanto para gestão de qualidade da
  rede quanto para argumento comercial na venda para novos ferro-velhos

## Cadastro do ferro-velho

- Cadastro simplificado de veículo em desmonte: fabricante, modelo, ano,
  fotos, status (o sistema resolve a geração automaticamente)
- Upload de planilha Excel para cadastro em lote (formato de colunas a
  definir; precisa de etapa de validação/matching contra o vocabulário
  controlado de fabricantes/modelos)
- Área de conta com plano de pagamento

## Verificação de credenciamento (Detran)

- Credenciamento junto ao Detran é regulado por estado, sem base
  nacional única — cada UF tem seu próprio sistema (SP e MG usam
  sistemas próprios com certificado digital; outros estados terceirizam)
- São Paulo oferece consulta pública gratuita da lista de desmontadoras
  credenciadas, sem exigir documentos — bom candidato a ser o primeiro
  estado com verificação semi-automatizada
- **Decisão**: `credenciamento_detran` e `uf` são obrigatórios no
  cadastro. Empresa nasce com `status_verificacao = 'pendente'` e **não
  aparece nos resultados de busca do consumidor** até ser aprovada
- Verificação manual pelo time no início (conferindo no portal público
  do Detran do estado); automação futura começando pelos estados com
  consulta pública mais acessível
- Endpoint de admin (`/admin/empresas/pendentes`,
  `PATCH /admin/empresas/{id}/verificacao`) ainda sem autenticação de
  admin — ver pendências abaixo

## Mensageria — implementação

- `POST /conversas` cria consulta + conversa + primeira mensagem numa
  única chamada, protegida por autenticação de usuário final
- Isolamento de dados garantido por `_carregar_conversa_autorizada`:
  cliente só acessa suas próprias conversas, empresa só as endereçadas
  a ela — testado com dois usuários distintos tentando se bisbilhotar
- Status `aguardando → respondida` é automático (primeira resposta da
  empresa); o terceiro estado `sem_resposta` ainda não é calculado —
  depende de uma tarefa agendada (cron/worker) que varre conversas
  paradas há mais que o SLA configurado. Não implementado ainda.

## Frontend — implementação

- **Decisão**: React + Vite (sem framework de UI pesado por ora — CSS
  simples próprio). Mobile-first, mas ainda sem configuração de PWA.
- Telas implementadas: busca passo-a-passo (fabricante → modelo →
  submodelo condicional → ano → CEP), resultados com toggle de
  ordenação e início de conversa, login/cadastro de cliente final,
  login/cadastro de empresa, minhas conversas, thread de mensagens
  (componente compartilhado entre cliente e empresa), estoque da
  empresa, conversas recebidas da empresa, painel de admin (aprovação
  de empresas pendentes com preenchimento de coordenadas)
- Sessão de cliente e de empresa guardadas separadamente no
  `localStorage` (`AuthContext`) — permite, tecnicamente, estar logado
  como cliente e como empresa ao mesmo tempo em abas diferentes
- **Geocodificação de CEP implementada de forma simplificada**: ViaCEP
  resolve CEP → UF, depois UF → coordenada aproximada da capital (tabela
  fixa no backend, `services/geocodificacao.py`). Não é o centróide de
  município nem endereço exato — é uma simplificação deliberada para o
  MVP, suficiente para diferenciar "13 km" de "120 km" como combinado,
  mas listada como pendência para refinar com base municipal do IBGE.
- Painel de admin **sem autenticação** — mesmo aviso já registrado
  para os endpoints de backend correspondentes.

## Identidade visual

- Sistema de design "Industry" + camada de marca Ferrozap, recebidos
  prontos do Claude Design (`design-reference/` guarda o material
  original: manual de marca navegável, README com as regras, página de
  exemplo). `frontend/src/styles/industry.css` e `ferrozap.css` são a
  fonte de verdade — carregados nessa ordem em `main.jsx`, sem edição.
- Todas as 9 telas foram reconstruídas em cima do sistema: `.btn`,
  `.field`/`.input`, `.card`, `.tag`, `.seg` (segmento de escolha,
  substituiu os botões de toggle improvisados), moldura `.blueprint` +
  `<Corners />` (componente que injeta as 4 marcas de canto), `.fz-*`
  para os padrões específicos da marca (`.fz-card-peca`, `.fz-selo`,
  `.fz-codigo`, `.fz-status`, `.fz-wrap`/`.fz-secao`)
- Ícones via `lucide-react` (não o script UMD do `exemplo.html`, já
  que o app é React) — sempre `strokeWidth={1.5}`, conforme a regra
  "Lucide, traço 1.5, sempre"
- **Extensão deliberada**: o sistema original só definia dois estados
  funcionais (`disponivel`/`vendido`, verde/vermelho). O produto
  precisa de um terceiro (`aguardando`, conversas sem resposta ainda)
  — adicionado como `.fz-status--aguardando` reaproveitando o token
  `--fz-aco` já existente, sem introduzir cor nova
- Pendente: fotografia real de peça/pátio (o próprio pacote de design
  já sinaliza isso como faltante) — hoje as telas de resultado não têm
  imagem de peça, só o card de texto/dados

## Infraestrutura de deploy

- **Banco de dados: mantém-se PostgreSQL relacional**, diferente do
  padrão de Cloud Storage (JSON em bucket, sem banco) usado no Clube
  Backbone e no Pata Negra. Motivo: a busca do Ferrozap depende de
  junção relacional em tempo real (veículo × empresa × geração ×
  distância, com índice, integridade referencial entre conversa e
  mensagem, e isolamento de dados testado) — replicar isso em arquivo
  solto significaria refazer em Python, a cada busca, o que o Postgres
  já resolve nativamente.
- **Backend: Cloud Run**, mesmo padrão dos outros dois projetos —
  `backend/Dockerfile` (gunicorn + worker uvicorn, escuta na variável
  `$PORT`), deploy automático via Cloud Build a cada push
- **Banco hospedado no Supabase** (não Cloud SQL) — evita configurar
  proxy/VPC para o Cloud Run alcançar um banco dentro do mesmo projeto
  GCP; Supabase também tem painel visual, útil para conferir cadastro
  de empresa pendente manualmente (mesmo uso que o Cloud Storage
  console dá nos outros projetos)
- **Frontend: GitHub Pages**, como Backbone e Pata Negra — mas com uma
  diferença técnica importante: o Ferrozap é React com rotas
  client-side (`react-router-dom`), então:
  - Trocado `BrowserRouter` por `HashRouter` (URLs viram `/#/buscar`)
    porque o GitHub Pages não redireciona rota desconhecida para
    `index.html` como Vercel/Railway fazem
  - `vite.config.js` usa `base: "./"` (caminho relativo), porque o
    Pages publica em `usuario.github.io/repo/`, não na raiz
  - Diferente dos outros dois projetos (HTML/JS puro, editável direto
    pelo editor web do GitHub), o Ferrozap **precisa de build**
    (`npm run build`) antes de virar arquivo estático — resolvido com
    `.github/workflows/deploy-frontend.yml`, que builda e publica
    automaticamente a cada push no `main`, preservando o fluxo de
    "commitou, subiu sozinho" que os outros projetos já têm

### Pendente para o primeiro deploy

1. Criar o projeto/serviço no Cloud Run (Console GCP), apontando para
   `backend/` como contexto de build
2. Configurar variáveis de ambiente no Cloud Run: `DATABASE_URL`
   (Supabase), `SECRET_KEY`, `FRONTEND_ORIGIN` (URL do GitHub Pages)
3. Criar o projeto no Supabase, rodar `database/schema.sql` no SQL
   Editor
4. Ativar GitHub Pages no repositório (Settings → Pages → Source:
   GitHub Actions)
5. Configurar a variável `VITE_API_URL` nas Actions variables do
   repositório (Settings → Secrets and variables → Actions → Variables),
   apontando para a URL pública do Cloud Run

## Dados de fabricantes e modelos

- FIPE não tem API própria nem exportação em massa (proibido por
  termos de uso deles) — usamos a API pública de terceiros Parallelum
  (`fipe.parallelum.com.br`, gratuita, 500 req/dia sem token) só para
  a lista de marcas, testada e confirmada funcionando
- **Não importamos os modelos da FIPE em massa**: o campo "modelo" da
  FIPE mistura motorização/versão no nome (ex: "COROLLA XEi 1.8 Flex
  16V Aut"), o que não bate com a separação limpa fabricante → modelo
  → submodelo do schema. Modelos são curados manualmente.
- `database/seed_fabricantes_modelos.sql` — seed inicial com ~35
  marcas relevantes (nomes normalizados, ex: "VW - VolksWagen" da FIPE
  vira "Volkswagen") e ~32 modelos mais comuns em desmonte no Brasil,
  com gerações aproximadas só para Gol/Onix/HB20 como ponto de partida
  — anos ainda precisam de validação (fontes de mercado divergem)

## Cobertura de catálogo — marca completa, modelo por texto livre

- **Decisão revertida**: a curadoria inicial de ~35 marcas foi
  descartada. Donos de veículo raro/extinto (Gurgel, Envemo etc.) são
  justamente quem mais depende de desmonte para achar peça — cortar
  essas marcas prejudicava exatamente o público que mais se beneficia
  do produto. Seed agora traz ~106 marcas normalizadas, e ~119 modelos
  curados — cobertura ampliada após identificar que marcas mainstream
  como Audi ficavam sem nenhum modelo; texto livre deve ser exceção
  para casos raros, não a experiência padrão de uma marca comum
- **Modelo continua sem importação em massa** (mesmo motivo de sempre:
  granularidade da FIPE não bate com o schema), mas o problema de
  cobertura é resolvido no produto, não no dado: `POST /catalogo/fabricantes`
  e `POST /catalogo/modelos` são endpoints get-or-create (idempotentes
  por nome, case-insensitive) — cliente ou empresa que não encontra a
  marca/modelo no dropdown pode digitar, e o catálogo cresce sob
  demanda, criado por quem realmente precisa daquele registro
- Modelo criado por texto livre nasce sem geração mapeada — cai
  automaticamente no fallback por tolerância de ano já existente,
  sem exigir nenhum tratamento especial
- Avaliado e descartado: `rafaelgou/fipe-crawler` (scraper PHP/MySQL
  do serviço interno da FIPE, não da API pública) — stack incompatível,
  raspa endpoint não documentado que a FIPE não sanciona, e mesmo
  assim entrega ~6.500 "modelos" por marca com nome+motorização+versão
  misturados, não resolvendo o problema de curadoria

## Ano de fabricação — dropdown em vez de campo livre

- **Decisão**: no formulário de busca do cliente, "ano de fabricação"
  virou dropdown (dependente do modelo escolhido), não mais número
  digitado — mesmo padrão de duas camadas visto no Webmotors
  (marca → modelo → versão), aplicado também ao ano
- `GET /catalogo/modelos/{modelo_id}/anos`: quando o modelo tem
  geração mapeada, retorna só os anos reais (união dos intervalos de
  `geracoes`) — dropdown "inteligente" de verdade. Quando não tem
  nenhuma geração ainda (a maioria dos modelos hoje), cai num fallback
  amplo (ano atual até 1970) — não trava a busca, só ainda não filtra
  bem. Fica mais inteligente à medida que mais gerações são mapeadas.
- **Cadastro da empresa mantém campo numérico livre** (não virou
  dropdown) — decisão deliberada: a empresa está informando o ano
  real de um veículo físico que ela tem na mão, e travar isso a uma
  lista pré-calculada bloquearia cadastro válido de veículo cujo
  modelo ainda não tem geração mapeada (a maioria)

## Importação de modelos via API (Parallelum/FIPE)

- `database/importar_modelos_fipe.py`: script standalone (só
  biblioteca padrão do Python, sem dependência) que busca a lista real
  de modelos de todas as marcas via API Parallelum, extrai o nome
  limpo do modelo (heurística: primeira palavra, ou nameplate composto
  conhecido tipo "New Beetle") e gera SQL pronto pra colar no Supabase
- Não roda no ambiente do Claude (rede restrita) — precisa ser
  executado em ambiente com internet livre, ex: Google Cloud Shell
- Testado com dado real da Volkswagen (~340 variantes brutas da FIPE
  → ~40 nomes de modelo limpos e corretos: Gol, Golf, Fox, Amarok,
  Santana, Kombi, Parati, Voyage, T-Cross, Tiguan, etc.)
- Marca `tem_submodelo_relevante = true` quando o modelo tem 3+
  variantes brutas na FIPE (heurística de "provavelmente tem versão
  relevante") — não popula a tabela `submodelos` ainda, fica como
  próximo passo natural depois que os modelos estiverem importados
- **Importação executada com sucesso via Google Colab** (não Cloud
  Shell — o dono do projeto não usa terminal, nem o baseado em
  navegador do GCP): 1.157 modelos extraídos da API real, catálogo
  final em 1.194 modelos (185 da curadoria manual anterior + ~1.009
  novos únicos; o resto eram nomes que já coincidiam e foram ignorados
  pelo `ON CONFLICT DO NOTHING`)
- Fica registrado como caminho replicável para o futuro: sempre que
  quiser reimportar (ex: depois de melhorar a heurística de extração,
  ou quando a FIPE atualizar o catálogo), o mesmo processo funciona —
  colar `importar_modelos_fipe.py` num notebook novo do Colab, rodar,
  baixar o `.sql` gerado, colar no Supabase
- **Submodelos importados também** (segunda rodada do script,
  estendido para gerar esse bloco): 5.157 submodelos reais em 444
  modelos com variante suficiente para valer a pena mostrar — dropdown
  de "versão" no formulário de busca agora funciona com dado de
  verdade, não fica mais vazio pros modelos mais comuns

## Sessão de correções — gestão de estoque, contas e segurança básica

- **Nome do modelo no estoque**: a listagem de veículos da empresa
  agora retorna `modelo_nome`/`fabricante_nome` (join no backend), em
  vez de só `modelo_id` — o card mostra "Volkswagen Gol · 2019", não
  "Modelo #155"
- **Editar/apagar veículo**: `PATCH /empresas/veiculos/{id}` e
  `DELETE /empresas/veiculos/{id}`, protegidos por dono (empresa só
  edita/apaga o próprio veículo)
- **Identificação da empresa na tela de estoque**: novo endpoint
  `GET /empresas/me`; o nome da empresa aparece no topo da página
- **E-mail + aceite de termos no cadastro do cliente final**:
  `usuarios_finais` ganhou `email` (único, obrigatório),
  `aceite_termos` (obrigatório — bloqueado no schema Pydantic, não só
  na tela), `aceite_promocional` (opcional), `aceite_termos_em`
  (timestamp do aceite, para eventual necessidade de auditoria/prova)
- **Rate limiting básico contra raspagem**: `/busca` limitado a
  20 requisições/minuto por IP (biblioteca `slowapi`). Testado: 20
  primeiras passam, a partir da 21ª recebe `429`. **Isto não é
  proteção contra bot sofisticado** (só limita volume por IP; um
  scraper distribuído ou com rotação de IP não é barrado) — se a
  raspagem persistir, o próximo degrau seria CAPTCHA (Google
  reCAPTCHA/hCaptcha) na busca, que exige registro externo e chave de
  site, não implementado agora por ser fricção maior para o usuário
  legítimo
- **Painel de admin expandido**: além da aba de aprovação pendente,
  agora tem abas "Empresas" (todas, com toggle ativar/desativar) e
  "Clientes" (todos, com toggle ativar/desativar) —
  `GET /admin/empresas`, `GET /admin/usuarios`,
  `PATCH /admin/{empresas,usuarios}/{id}/ativo`
- Campo `ativo` adicionado também em `usuarios_finais` (antes só
  existia em `empresas`) — conta desativada não consegue mais
  autenticar em nenhum endpoint protegido (testado)
- `database/migracao_001_email_termos.sql`: script de migração
  separado do `schema.sql`, porque o banco já estava em produção —
  registra o padrão para futuras mudanças de schema em produção (não
  dá mais pra só editar `schema.sql`, precisa de migração incremental)

## Mensageria — melhorias de contexto e notificação

- **Selo de mensagem não lida na barra de navegação**: `mensagens`
  ganhou campo `lida` (boolean). Abrir uma conversa
  (`GET /conversas/{id}/mensagens`) marca automaticamente como lida
  tudo que veio do outro lado — sem precisar de ação explícita do
  usuário. Novo endpoint `GET /conversas/contagem-nao-lidas` alimenta
  o selo vermelho no menu, que atualiza a cada 30s
- **Dados do veículo nas listagens e na conversa**: `/conversas/minhas`,
  `/conversas/recebidas` e a criação de conversa agora retornam
  `fabricante_nome`, `modelo_nome`, `ano_fabricacao` (join com
  veiculo_desmonte → modelo → fabricante). As listas mostram
  "Volkswagen Gol · 2019" em vez de "Conversa #7"; a tela de conversa
  mostra isso como cabeçalho — o cliente só precisa descrever a peça
  no texto livre, o veículo já vem identificado estruturalmente, sem
  precisar repetir isso na mensagem
- `database/migracao_002_mensagem_lida.sql`: nova migração incremental
  (segunda desde que o banco foi pra produção — reforça o padrão de
  não editar mais só o `schema.sql`)

## Verificação de credenciamento (Detran) — esclarecimentos adicionais

- **Confirmado**: a aprovação (`status_verificacao`) é por **empresa**,
  não por veículo. Uma vez aprovada, todo veículo que a empresa
  cadastrar aparece na busca automaticamente, sem verificação
  individual por carro. A responsabilidade de procedência lícita de
  cada veículo em estoque já é obrigação legal da empresa credenciada
  perante o Detran do estado dela (declaração de procedência lícita
  exigida na legislação) — o Ferrozap não reimplementa essa checagem,
  herda a garantia da credencial aprovada
- Detran não emite/exporta relatório de estoque para a empresa
  reutilizar — é o contrário: a empresa é quem deve **submeter** um
  inventário (em alguns estados, obrigatoriamente em planilha XLS) ao
  Detran. Não há função de exportação encontrada nos sistemas
  estaduais pesquisados (RJ, MG, DF) — são ferramentas de compliance
  de mão única, não pensadas para portabilidade de dado
- **Ideia registrada, não implementada ainda**: verificador de CNPJ
  (validação de dígito verificador, sem rede) + consulta de dados
  reais via API pública gratuita (BrasilAPI, `brasilapi.com.br/api/cnpj/v1/{cnpj}`,
  sem necessidade de chave, dados da Receita Federal) para
  auto-preencher nome/endereço no cadastro da empresa. Viabilidade
  técnica confirmada, mas fica pra agregar com mais demandas
  correlatas antes de implementar (junto com verificador de
  credenciamento — esse sim sem solução automática viável, por causa
  da fragmentação por estado já documentada acima)

## Bug real: "match exato" media a coisa errada

- **Achado**: `nivel_confianca = 'compativel_exato'` estava baseado em
  `v.geracao_id IS NOT NULL` — ou seja, "esse veículo tem geração
  mapeada", não "o ano bate com o que foi buscado". Um Gol 2010 com
  geração mapeada aparecia como "exato" mesmo buscando por 2011,
  fazendo o resultado errado vir primeiro na ordenação.
- **Correção**: `compativel_exato` agora é `v.ano_fabricacao = :ano`
  (comparação direta), com `geracao_id IS NOT NULL` rebaixado pra
  critério de `provavel` (junto com o fallback por tolerância).
  Testado reproduzindo o cenário relatado (Gol 2010/2011/2012,
  buscando 2011) — 2011 vem primeiro agora, como devia.
- **Resultados agrupados por empresa**: `/busca` não retorna mais uma
  linha por veículo — retorna uma entrada por empresa, com a lista de
  veículos dela dentro (ordenados: exato primeiro, depois por
  proximidade de ano). Ordenação dos cards por empresa também mudou:
  aba "Compatibilidade" prioriza quem tem match exato (desempate por
  distância); aba "Distância" ignora match, ordena só por distância.
- Botão "Falar com a desmontadora" manda mensagem sobre o **melhor**
  veículo daquela empresa (o primeiro da lista já ordenada).

## Edição administrativa completa (empresas e clientes)

- `PATCH /admin/empresas/{id}` e `PATCH /admin/usuarios/{id}` — além
  de aprovar/rejeitar e ativar/desativar, admin agora edita qualquer
  campo (nome, e-mail, telefone, endereço, CEP, e **coordenadas** no
  caso da empresa) — importante justamente para corrigir latitude/
  longitude erradas sem precisar desfazer a aprovação
- Painel de admin: botão "Editar" nas abas Empresas e Clientes abre
  formulário inline, testado nos dois casos

## Precisão de distância — limitação conhecida, não bug

- Confirmado com usuário um caso real: CEP de São Paulo e coordenada
  de São Paulo resultando em 77 km de diferença. Isso é esperado dado
  o fallback atual (CEP → UF → centróide da capital do estado, não do
  município/endereço real) — se a empresa não estiver exatamente na
  capital, a distância reflete essa aproximação grosseira. Reforça a
  prioridade da pendência já registrada: trocar por centróide de
  município via IBGE.

## Geocodificação — de estado pra município (melhoria real de precisão)

- Confirmado com usuário: as coordenadas da empresa (digitadas
  manualmente pelo admin) já eram precisas — o problema era só do
  lado do cliente, que caía sempre no centro da capital do estado,
  não da cidade real.
- Trocado por base real do IBGE (`kelvins/municipios-brasileiros`,
  dado público, 5.571 municípios com coordenada), usando o campo
  `localidade` que a ViaCEP já devolvia mas não era aproveitado.
  Fallback pro centro do estado só quando o município não é
  encontrado na base (deve ser raro agora).
- `backend/app/services/municipios_data.py` — dicionário gerado
  automaticamente a partir do CSV, indexado por `UF|nome_normalizado`
  (sem acento, minúsculo, pra bater com a variação de grafia da
  ViaCEP)
- Testado sem depender de rede: São Paulo capital e Santos (mesma UF,
  cidades diferentes) agora retornam coordenadas distintas — antes
  caíam exatamente no mesmo ponto

## Mensagem inline no card, não mais solta no fim da página

- "Falar com a desmontadora" agora abre o formulário de mensagem
  **dentro do próprio card** clicado, mantendo a relação visual com
  qual empresa está recebendo a mensagem
- Textarea reduzida pra 2 linhas com rolagem interna (`overflow-y:
  auto`, `maxHeight: 80px`) — texto mais longo rola dentro da caixa
  em vez de esticar o card e empurrar o resto da tela
- Espaçamento vertical reduzido de forma geral (`--fz-secao` de 56px
  para 40px desktop / 28px mobile; gap interno do card de peça
  reduzido)

## Localização atual (GPS) como alternativa ao CEP

- `/busca` aceita `lat`/`lon` diretos, opcionais — quando vêm
  preenchidos (via `navigator.geolocation` no navegador), pulam a
  geocodificação de CEP inteira e usam a posição real do dispositivo,
  mais precisa que até o centróide de município
- Testado: busca com GPS simulado ficou a 0,15 km de distância real
  (contra o que seria o centro da cidade inteira)
- Frontend: botão "Usar minha localização atual" no campo de CEP,
  opcional — pede permissão do navegador (padrão do browser, não
  something custom); se recusada ou indisponível, cai de volta pro
  fluxo de CEP normal, sem travar a busca

## Contato via link do WhatsApp — mensageria própria fica "dormindo"

- **Decisão**: em vez de usar a mensageria própria (conversas/mensagens
  dentro do site), o clique em "Falar com a desmontadora" agora gera
  um link `wa.me` com mensagem pré-preenchida, direcionando pro
  WhatsApp real da empresa. O código da mensageria (`/conversas`,
  tabela `mensagens`, selo de não lida) **não foi apagado** — fica
  parado, de propósito, caso a decisão seja revertida no futuro
- Fluxo: cliente clica "Falar com a desmontadora" → escreve a peça
  que precisa → clica "Salvar" (isso só monta o link, não chama
  nenhum endpoint) → aparece o botão "Enviar WhatsApp" → abre o
  WhatsApp de verdade, com a mensagem já escrita, endereçada ao
  número da empresa
- Modelo de mensagem: nome do cliente, veículo (fabricante/modelo/ano
  do melhor match), e a descrição da peça que o cliente escreveu
- Novo campo `whatsapp` em `empresas` (separado de `telefone`) —
  obrigatório no cadastro novo, editável na conta própria e pelo
  admin. `database/migracao_004_whatsapp_empresa.sql`
- **Trade-off que a decisão reintroduz, registrado por transparência**:
  perdemos a rastreabilidade de métrica que a mensageria própria
  existia justamente pra resolver (lead gerado, taxa de resposta,
  tempo de resposta — ver seção "Mensageria" mais acima neste
  documento). Hoje não fica nenhum registro no nosso banco de que o
  contato aconteceu, só o clique abre o WhatsApp do usuário. Se
  precisar dessa métrica de volta, dá pra registrar um "lead" simples
  no banco no momento do clique em "Salvar", sem reativar a
  mensageria inteira — não implementado agora, só documentado.

## Contato: mensageria própria E link do WhatsApp, as duas juntas

- **Revertido**: a decisão anterior era WhatsApp *substituindo* a
  mensageria própria. Voltamos atrás — agora as duas acontecem juntas
  no mesmo clique de "Salvar": cria a conversa de verdade no nosso
  sistema (`POST /conversas`, com histórico, selo de lida/não lida)
  **e** monta o link `wa.me` com a mesma mensagem, que abre no
  WhatsApp real da empresa
- A tabela `leads_whatsapp` e o endpoint `/leads-whatsapp` (criados na
  rodada anterior, quando a mensageria estava desligada) ficaram sem
  uso agora — a mensageria de volta já cobre a mesma necessidade de
  registro. Não apagados, só dormentes, seguindo o mesmo princípio de
  não destruir código por precaução com arrependimento futuro
- **Novo**: selo visível "Não lida" (fundo vermelho) nas listas de
  conversa — tanto para o cliente quanto para a empresa — além do
  contador agregado que já existia no menu. Testado nos três cenários
  (mensagem chega sem ler → aparece; abre a conversa → some; outro
  lado responde → aparece de novo do lado de quem recebeu)

## Consistência de UX — "Nova busca" e botão de WhatsApp

- "Nova busca" padronizado com a mesma cor (`btn-primary`) em todo
  lugar que aparece: Mensagens, Resultados, Minha Conta (cliente),
  dentro de cada conversa (só para cliente — empresa não tem esse
  botão, o equivalente dela é "Estoque")
- Botão "Enviar WhatsApp": verde oficial da marca WhatsApp
  (`--fz-whatsapp: #25d366`, único caso deliberado de cor fora da
  paleta do Industry, por ser reconhecimento de marca de terceiro).
  Depois de clicado, vira um aviso de fundo azul (`--fz-aco`, cor já
  existente do sistema) com texto preto: "Mensagem criada para envio,
  você precisa enviá-la pelo seu próprio WhatsApp."

## Legibilidade — fonte maior e mais contraste

- Vários textos secundários (`.card-meta`, `.fz-selo`, `.fz-status`)
  eram pequenos (11-12px) e de baixo contraste de propósito no
  sistema original (`color-mix` a 50% de opacidade) — bom pra
  decoração discreta, ruim pra leitura confortável. Aumentados pra
  13px e contraste mais alto (`--color-neutral-800` em vez do mix a
  50%), mantendo ainda menor que o texto principal (hierarquia
  preservada, só não mais ilegível)

## Pendências em aberto

- Geocodificação de CEP por centróide de município (IBGE), hoje
  aproximada por capital do estado
- Autenticação de admin (bloqueia tanto `/admin/empresas` no backend
  quanto a tela `/admin` no frontend)
- Tarefa agendada (cron/worker) para marcar conversas como
  `sem_resposta` após o SLA configurado
- Modelo de LLM específico a usar em produção (ver comparativo de custo)
- Definição de thresholds de SLA
- Decisão de monetização do "genius" (premium do consumidor final?)
- Estratégia de aquisição inicial (uso das bases de contato dos
  ferro-velhos parceiros, mencionado no início do projeto)
- Configuração de PWA no frontend
