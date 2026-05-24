"""
carrega e expoe configuracoes da aplicacao a partir do ambiente.

centralizar a leitura aqui evita que rotas e servicos chamem os.getenv
diretamente, simplificando testes e auditoria de variaveis sensiveis.
o armazenamento de dados e exclusivamente em arquivos json/jsonl;
nao ha conexao com banco relacional neste projeto.
"""

import os
import logging
from dataclasses import dataclass, field
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
PORTFOLIO_DATA_PATH = BASE_DIR / "data" / "portfolio_data.json"
FRONTEND_DATA_DIR = BASE_DIR.parent / "frontend" / "src" / "data"


# UTILITARIO INTERNO: SPLIT DE CSV ROBUSTO A ESPACOS
def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    env: str
    is_production: bool
    jwt_secret: str
    jwt_algorithm: str
    jwt_expiration_minutes: int
    allowed_origins: list[str]
    gemini_api_key: str | None
    ollama_url: str | None
    active_interpreter_default: str
    admin_user: str | None
    admin_password_hash: str | None
    trusted_proxies: list[str] = field(default_factory=list)
    base_dir: Path = field(default=BASE_DIR)
    portfolio_data_path: Path = field(default=PORTFOLIO_DATA_PATH)
    frontend_data_dir: Path = field(default=FRONTEND_DATA_DIR)


# CARREGAMENTO E VALIDACAO DAS VARIAVEIS DE AMBIENTE
def _load_settings() -> Settings:
    env = os.getenv("ENV", "development").lower()
    is_production = env == "production"

    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        if is_production:
            raise RuntimeError("JWT_SECRET deve ser definida em producao")
        jwt_secret = "dev-secret-only-do-not-use-in-prod"
        logging.warning("JWT_SECRET nao definida; usando fallback de desenvolvimento")

    raw_origins = os.getenv("ALLOWED_ORIGINS", "")
    allowed_origins = _split_csv(raw_origins)
    if not allowed_origins:
        if is_production:
            raise RuntimeError("ALLOWED_ORIGINS deve ser definida em producao")
        allowed_origins = ["http://localhost:5173"]
        logging.warning("ALLOWED_ORIGINS nao definida; usando fallback de desenvolvimento")

    return Settings(
        env=env,
        is_production=is_production,
        jwt_secret=jwt_secret,
        jwt_algorithm="HS256",
        jwt_expiration_minutes=int(os.getenv("JWT_EXPIRATION_MINUTES", "60")),
        allowed_origins=allowed_origins,
        gemini_api_key=os.getenv("GEMINI_API_KEY") or None,
        ollama_url=os.getenv("OLLAMA_URL") or None,
        active_interpreter_default=os.getenv("ACTIVE_INTERPRETER", "json_only"),
        admin_user=os.getenv("ADMIN_USER") or None,
        admin_password_hash=os.getenv("ADMIN_PASSWORD_HASH") or None,
        # lista de cidr/ips dos proxies reversos confiaveis;
        # vazio em dev = nao confia em x-forwarded-for e usa o peer direto
        trusted_proxies=_split_csv(os.getenv("TRUSTED_PROXIES", "")),
    )


settings = _load_settings()
