from fastapi import FastAPI

from app.routers import busca, cadastro, catalogo

app = FastAPI(title="Ferrozap API")

app.include_router(busca.router)
app.include_router(cadastro.router)
app.include_router(catalogo.router)


@app.get("/health")
def health():
    return {"status": "ok"}
