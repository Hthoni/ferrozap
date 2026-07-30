from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


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


class VeiculoDesmonteComModeloOut(VeiculoDesmonteOut):
    modelo_nome: str
    fabricante_nome: str


class EmpresaLogin(BaseModel):
    email: EmailStr
    senha: str


class UsuarioFinalCreate(BaseModel):
    nome: str
    email: EmailStr
    telefone: str
    senha: str = Field(min_length=8)
    aceite_termos: bool
    aceite_promocional: bool = False

    @field_validator("aceite_termos")
    @classmethod
    def termos_precisam_ser_aceitos(cls, v):
        if not v:
            raise ValueError("É necessário aceitar os termos de uso para criar a conta.")
        return v


class UsuarioFinalOut(BaseModel):
    id: int
    nome: str
    email: EmailStr
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


class ConversaCreate(BaseModel):
    veiculo_desmonte_id: int
    modelo_id: int
    submodelo_id: int | None = None
    ano: int
    cep: str | None = None
    texto: str = Field(min_length=1, max_length=2000)


class MensagemOut(BaseModel):
    id: int
    conversa_id: int
    remetente_tipo: str
    texto: str
    criado_em: datetime

    class Config:
        from_attributes = True


class ConversaOut(BaseModel):
    id: int
    consulta_id: int
    empresa_id: int
    veiculo_desmonte_id: int
    status: str
    criado_em: datetime
    primeira_resposta_em: datetime | None
    ultima_atividade_em: datetime

    class Config:
        from_attributes = True


class MensagemCreate(BaseModel):
    texto: str = Field(min_length=1, max_length=2000)
