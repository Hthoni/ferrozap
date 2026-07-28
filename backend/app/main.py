from fastapi import FastAPI

from app.routers import admin, auth, busca, cadastro, catalogo, mensageria

app = FastAPI(title="Ferrozap API")

app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(busca.router)
app.include_router(cadastro.router)
app.include_router(catalogo.router)
app.include_router(mensageria.router)


@app.get("/health")
def health():
    return {"status": "ok"}
