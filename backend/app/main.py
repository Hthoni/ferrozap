import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.rate_limit import limiter
from app.routers import admin, auth, busca, cadastro, catalogo, leads, mensageria

app = FastAPI(title="Catasucata API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Em produção, defina FRONTEND_ORIGIN com a URL exata do frontend
# (ex: https://hthoni.github.io). Sem isso, o navegador bloqueia
# as chamadas do frontend para a API por política de CORS.
origens_permitidas = [
    origem.strip()
    for origem in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origens_permitidas,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(busca.router)
app.include_router(cadastro.router)
app.include_router(catalogo.router)
app.include_router(leads.router)
app.include_router(mensageria.router)


@app.get("/health")
def health():
    return {"status": "ok"}
