from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
from api.services.services import Services


app = FastAPI(
    title="Sheets Converter API",
    description="API para conversão de planilhas",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)


ALLOWED_ORIGINS = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8001",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8001",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CatchCollumns(BaseModel):
    id_cliente: str = None
    codigo_cliente: str = None
    nome_cliente: str = None
    descricao_cliente: str = None
    preco_cliente: str = None
    grupo_cliente: str = None
    subgrupo_cliente: str = None
    impressao_cliente: str = None
    ncm_cliente: str = None
    cest_cliente: str = None
    uncompra_cliente: str = None
    unvendas_cliente: str = None
    pesavel_cliente: str = None
    fracionado_cliente: str = None
    exportarbalanca_cliente: str = None
    classificacao_cliente: str = None
    nome_planilha: Optional[str] = None


class DataMigrationRequest(BaseModel):

    nome_planilha: Optional[str] = None
    mapeamentos: CatchCollumns = None


services = Services()


@app.get("/health", tags=["Status"])
async def health_check():
    return {"status": "ok", "message": "API está funcionando"}


@app.post("/create-base", tags=["Planilhas"])
async def criar_planilha_base():

    resultado = services.createnewxlsx()
    return resultado


@app.post("/catchcollumns", tags=["Mapeamento"])
async def catch_collumns(payload: dict = Body(None)):
    payload = payload or {}
    try:
        services.id_cliente = payload.get("id_cliente")
        services.codigo_cliente = payload.get("codigo_cliente")
        services.nome_cliente = payload.get("nome_cliente")
        services.descricao_cliente = payload.get("descricao_cliente")
        services.preco_cliente = payload.get("preco_cliente")
        services.grupo_cliente = payload.get("grupo_cliente")
        services.subgrupo_cliente = payload.get("subgrupo_cliente")
        services.impressao_cliente = payload.get("impressao_cliente")
        services.ncm_cliente = payload.get("ncm_cliente")
        services.cest_cliente = payload.get("cest_cliente")
        services.uncompra_cliente = payload.get("uncompra_cliente")
        services.unvendas_cliente = payload.get("unvendas_cliente")
        services.pesavel_cliente = payload.get("pesavel_cliente")
        services.fracionado_cliente = payload.get("fracionado_cliente")
        services.exportarbalanca_cliente = payload.get("exportarbalanca_cliente")
        services.classificacao_cliente = payload.get("classificacao_cliente")
        services.planilha_cliente = payload.get("nome_planilha")

        return {
            "status": "success",
            "message": "Mapeamentos de colunas definidos com sucesso",
            "mapeamentos": payload
        }
    except Exception as e:
        return {
            "status": False,
            "message": str(e)
        }


@app.post("/datamigration", tags=["Migração"])
async def data_migration(payload: dict = Body(None)):
    payload = payload or {}
    print("[datamigration] payload:", payload)
    nome_planilha = (payload.get("nome_planilha") or "").strip()
    if not nome_planilha:
        return {
            "status": "error",
            "message": "Nome da planilha é obrigatório"
        }
    
    resultado = services.datamigration(nome_planilha)
    return resultado


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8001,
        reload=True,
        log_level="info"
    )


















