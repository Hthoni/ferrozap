# Ferrozap

Marketplace que conecta consumidores finais a ferro-velhos/desmontadoras
para busca de peças automotivas usadas, com matching por geração de veículo
e mensageria própria entre as partes.

## Estrutura do repositório

```
ferrozap/
  backend/     API em Python (FastAPI) — busca, matching, mensageria, admin
  frontend/    Aplicação web (framework a definir)
  database/    Schema SQL e migrations
  docs/        Decisões de arquitetura e produto
```

## Status

Projeto em fase de design. Ver `docs/decisoes.md` para o histórico de
decisões já tomadas antes de qualquer linha de código de produto.

## Como rodar o backend localmente

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # preencha as variáveis
uvicorn app.main:app --reload
```

A API sobe em `http://localhost:8000`. Documentação automática em
`http://localhost:8000/docs`.

## Como rodar o frontend localmente

```bash
cd frontend
npm install
npm run dev
```

O app sobe em `http://localhost:5173` e já espera o backend rodando em
`http://localhost:8000` (configurável via `VITE_API_URL`).

## Banco de dados

O schema completo está em `database/schema.sql`. Requer PostgreSQL
(usa funções nativas de cálculo de distância — ver comentários no arquivo).

## Como subir isso no seu GitHub

```bash
cd ferrozap
git init
git add .
git commit -m "Estrutura inicial do projeto"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/ferrozap.git
git push -u origin main
```

## Deploy (Cloud Run + Supabase + GitHub Pages)

Mesmo padrão do Clube Backbone e do Pata Negra: push no `main` builda
e publica sozinho, tanto backend (Cloud Build → Cloud Run) quanto
frontend (GitHub Actions → GitHub Pages).

1. **Banco**: crie um projeto no Supabase, rode `database/schema.sql`
   no SQL Editor, copie a connection string
2. **Backend**: crie um serviço no Cloud Run apontando para
   `backend/` (usa o `Dockerfile` da pasta), configure as variáveis
   `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_ORIGIN`
3. **Frontend**: ative GitHub Pages no repositório (Settings → Pages
   → Source: GitHub Actions) e configure a variável `VITE_API_URL`
   em Settings → Secrets and variables → Actions → Variables, com a
   URL pública do Cloud Run

Detalhes e decisões em `docs/decisoes.md`, seção "Infraestrutura de
deploy".

## Para retomar em novo chat

1. Anexar `docs/decisoes.md` (histórico completo de decisões)
2. Descrever qual pendência quer atacar primeiro — lista completa no
   final de `docs/decisoes.md`
