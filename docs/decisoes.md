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
