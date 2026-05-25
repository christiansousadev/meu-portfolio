"""
Schemas Pydantic estritos para validar o conteudo dos arquivos JSON
antes de qualquer escrita em disco.

Os modelos rejeitam campos extras (extra='forbid') e exigem strings
nao vazias com limite de tamanho, prevenindo injecao de payloads
maliciosos ou inflacao maliciosa do JSON.
"""

from enum import Enum
from typing import Annotated

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, HttpUrl


class AllowedConfigFile(str, Enum):
    PORTFOLIO = "portfolio.json"
    PORTFOLIO_DATA = "portfolio_data.json"


# Limites genericos para conter abusos de tamanho
ShortStr = Annotated[str, Field(min_length=1, max_length=200)]
MediumStr = Annotated[str, Field(min_length=1, max_length=1_000)]
LongStr = Annotated[str, Field(min_length=1, max_length=4_000)]


class StrictModel(BaseModel):
    # populate_by_name permite que o input use tanto o nome canonico do campo
    # quanto qualquer alias declarado em validation_alias
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
        populate_by_name=True,
    )


# ----------------------------------------------------------------------
# Schema do portfolio_data.json (consumido pelo backend para RAG)
# ----------------------------------------------------------------------

class DadosPessoais(StrictModel):
    nome: ShortStr
    localizacao: ShortStr
    perfil: MediumStr


class Contatos(StrictModel):
    email: EmailStr
    linkedin: HttpUrl
    github: HttpUrl
    portfolio_web: HttpUrl


class Experiencia(StrictModel):
    empresa: ShortStr
    resumo_tecnico: LongStr


class ProjetoDestaque(StrictModel):
    nome: ShortStr
    descricao: LongStr
    github: HttpUrl


class PortfolioData(StrictModel):
    # aceita chaves em pt (canonico, gravado no disco) ou em en (formularios externos);
    # a serializacao via model_dump sempre devolve a forma pt, garantindo um unico
    # contrato no arquivo persistido
    instrucoes_ia: LongStr
    dados_pessoais: DadosPessoais = Field(
        validation_alias=AliasChoices("dados_pessoais", "profile"),
    )
    contatos: Contatos = Field(
        validation_alias=AliasChoices("contatos", "contacts"),
    )
    habilidades_tecnicas: list[MediumStr] = Field(
        min_length=1,
        max_length=50,
        validation_alias=AliasChoices("habilidades_tecnicas", "skills"),
    )
    governanca_e_processos: list[MediumStr] = Field(
        min_length=1,
        max_length=50,
        validation_alias=AliasChoices("governanca_e_processos", "education"),
    )
    experiencias_profissionais: list[Experiencia] = Field(
        min_length=0,
        max_length=100,
        validation_alias=AliasChoices("experiencias_profissionais", "experience"),
    )
    projetos_destaque: list[ProjetoDestaque] = Field(
        min_length=0,
        max_length=100,
        validation_alias=AliasChoices("projetos_destaque", "projects"),
    )


# ----------------------------------------------------------------------
# Schema do portfolio.json (consumido pelo frontend)
# ----------------------------------------------------------------------

class NavSection(StrictModel):
    skills: ShortStr
    exp: ShortStr
    proj: ShortStr


class HeroSection(StrictModel):
    greeting: ShortStr
    subtitle: LongStr
    contactBtn: ShortStr
    resumeBtn: ShortStr


class SkillsSection(StrictModel):
    title: ShortStr
    subtitle: ShortStr
    items: list[MediumStr] = Field(min_length=1, max_length=30)
    tags: list[ShortStr] = Field(min_length=1, max_length=30)


class ExpItem(StrictModel):
    role: ShortStr
    company: ShortStr
    time: Annotated[str, Field(default="", max_length=100)] = ""
    desc: LongStr


class ExpSection(StrictModel):
    title: ShortStr
    items: list[ExpItem] = Field(max_length=100)


class ProjItem(StrictModel):
    name: ShortStr
    desc: LongStr
    link: HttpUrl


class ProjSection(StrictModel):
    title: ShortStr
    items: list[ProjItem] = Field(max_length=100)


class ChatSection(StrictModel):
    title: ShortStr
    placeholder: ShortStr
    send: ShortStr
    loading: ShortStr


class LocaleContent(StrictModel):
    nav: NavSection
    hero: HeroSection
    skills: SkillsSection
    exp: ExpSection
    proj: ProjSection
    chat: ChatSection


class Portfolio(StrictModel):
    """
    Top-level e um mapa de codigo de idioma para conteudo localizado.
    Aceita pelo menos 'pt' e 'en'.
    """
    pt: LocaleContent
    en: LocaleContent


# ----------------------------------------------------------------------
# Roteamento de validacao por arquivo
# ----------------------------------------------------------------------

SCHEMA_BY_FILE: dict[AllowedConfigFile, type[StrictModel]] = {
    AllowedConfigFile.PORTFOLIO: Portfolio,
    AllowedConfigFile.PORTFOLIO_DATA: PortfolioData,
}


def validate_payload(filename: AllowedConfigFile, content: dict) -> dict:
    """
    Valida o conteudo recebido contra o schema correspondente ao arquivo
    e retorna a forma serializavel (dict) ja normalizada.
    Levanta pydantic.ValidationError em caso de falha.
    """
    schema = SCHEMA_BY_FILE[filename]
    return schema.model_validate(content).model_dump(mode="json")


# ----------------------------------------------------------------------
# Schemas de request HTTP
# ----------------------------------------------------------------------

class ConfigUpdateRequest(BaseModel):
    filename: AllowedConfigFile
    content: dict


class LoginRequest(BaseModel):
    username: Annotated[str, Field(min_length=3, max_length=120)]
    password: Annotated[str, Field(min_length=6, max_length=128)]


class ChatRequest(BaseModel):
    message: Annotated[str, Field(min_length=1, max_length=2_000)]


class InterpreterRequest(BaseModel):
    provider: Annotated[str, Field(pattern=r"^(json_only|gemini|openai|ollama|deepseek)$")]


class AnalyticsEvent(BaseModel):
    event: Annotated[str, Field(min_length=1, max_length=64)]
    path: Annotated[str, Field(min_length=1, max_length=2_000)]
    browser: Annotated[str, Field(min_length=1, max_length=512)]
