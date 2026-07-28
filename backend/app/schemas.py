from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class EmpresaCreate(BaseModel):
    nome: str
    cnpj: str
    credenciamento_detran: str
    uf: str = Field(min_length=2, max_length=2)
    email: EmailStr
    senha: str = Field(min_length=8)
    telefone: str | None = None
    endereco: str | None = None
    cep: str


class EmpresaOut(BaseModel):
    id: int
    nome: str
    cnpj: str
    email: EmailStr
    plano: str
    status_verificacao: str
    latitude: float | None
    longitude: float | None
    ativo: bool
    criado_em: datetime

    class Config:
        from_attributes = True


class VeiculoDesmonteCreate(BaseModel):
    modelo_id: int
    submodelo_id: int | None = None
    ano_fabricacao: int


class VeiculoDesmonteOut(BaseModel):
    id: int
    empresa_id: int
    modelo_id: int
    submodelo_id: int | None
    ano_fabricacao: int
    geracao_id: int | None
    status: str
    criado_em: datetime

    class Config:
        from_attributes = True


class EmpresaLogin(BaseModel):
    email: EmailStr
    senha: str


class UsuarioFinalCreate(BaseModel):
    nome: str
    telefone: str
    senha: str = Field(min_length=8)


class UsuarioFinalOut(BaseModel):
    id: int
    nome: str
    telefone: str
    criado_em: datetime

    class Config:
        from_attributes = True


class UsuarioFinalLogin(BaseModel):
    telefone: str
    senha: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
