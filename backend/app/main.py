from fastapi import FastAPI

from app.routers import busca

app = FastAPI(title="Ferrozap API")

app.include_router(busca.router)


@app.get("/health")
def health():
    return {"status": "ok"}
