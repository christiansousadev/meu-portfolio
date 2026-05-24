"""endpoints publicos de chat e telemetria."""

import logging
import time

from fastapi import APIRouter, HTTPException, Request

from core.proxy import get_client_ip
from core.trace_context import get_trace_id
from schemas.portfolio import AllowedConfigFile, AnalyticsEvent, ChatRequest
from services.config_repo import read_config
from services.jsonl_store import ANALYTICS_PATH, CHAT_LOG_PATH, append_jsonl
from services.llm import (
    build_focused_context,
    build_system_prompt,
    generate_llm_response,
    load_portfolio_context,
    search_json_answers,
)
from services.runtime_state import get_active_interpreter

# limite defensivo de armazenamento para o user agent persistido;
# reduz vetor de inflacao do arquivo analytics.jsonl
BROWSER_FIELD_MAX_LEN = 256

router = APIRouter()


# PORTFOLIO PUBLICO CONSUMIDO PELO FRONT
@router.get("/api/portfolio")
async def get_portfolio():
    try:
        return read_config(AllowedConfigFile.PORTFOLIO)
    except Exception as exc:
        logging.error(f"erro ao ler portfolio: {exc}")
        raise HTTPException(status_code=500, detail="erro interno")


# CHAT COM ASSISTENTE LLM OU JSON LOCAL
@router.post("/api/chat")
async def chat_endpoint(req: ChatRequest, request: Request):
    try:
        start = time.time()
        context = load_portfolio_context()

        # tenta resolver localmente via match por palavras-chave;
        # se houver match, evitamos completamente uma chamada ao llm
        resposta = search_json_answers(req.message, context)
        source = "local_json"

        if not resposta:
            provider = get_active_interpreter()
            if provider == "json_only":
                resposta = (
                    "Olá! Como assistente local, consigo te falar sobre o currículo, "
                    "projetos e contatos do Christian. O que você gostaria de saber?"
                )
                source = "local_fallback"
            else:
                # recorte focado: envia ao llm somente as secoes pertinentes
                # a query, reduzindo tokens e melhorando coerencia da resposta
                focused = build_focused_context(req.message, context)
                system_prompt = build_system_prompt(context, focused)
                resposta = generate_llm_response(provider, req.message, system_prompt)
                source = f"ai_{provider}"

        duration_ms = int((time.time() - start) * 1000)

        # persistencia append-only para auditoria/governanca;
        # falha de escrita nao deve quebrar a resposta ao usuario
        try:
            append_jsonl(
                CHAT_LOG_PATH,
                {
                    "trace_id": get_trace_id(),
                    "client_ip": get_client_ip(request),
                    "source": source,
                    "user_prompt": req.message,
                    "ai_response": resposta,
                    "response_time_ms": duration_ms,
                },
            )
        except OSError as persist_exc:
            logging.error(f"falha ao gravar chat_logs.jsonl: {persist_exc}")

        return {"reply": resposta, "source": source}
    except HTTPException:
        raise
    except Exception as exc:
        logging.error(f"erro critico no fluxo de chat: {exc}")
        raise HTTPException(status_code=500, detail="falha interna ao processar a mensagem")


# TRACK DE TELEMETRIA PUBLICA
@router.post("/api/analytics/track")
async def track_event(payload: AnalyticsEvent, request: Request):
    # trunca o user agent antes da persistencia para mitigar inflacao
    # maliciosa do arquivo analytics.jsonl; o rate-limit por ip atua
    # como primeira barreira (ver core/rate_limit.RATE_LIMITS)
    browser_trimmed = payload.browser[:BROWSER_FIELD_MAX_LEN]

    try:
        append_jsonl(
            ANALYTICS_PATH,
            {
                "trace_id": get_trace_id(),
                "client_ip": get_client_ip(request),
                "event_type": payload.event,
                "page_path": payload.path,
                "browser_info": browser_trimmed,
            },
        )
    except OSError as exc:
        logging.error(f"falha ao registrar evento de telemetria: {exc}")
        raise HTTPException(status_code=500, detail="falha ao registrar evento")

    return {"status": "tracked"}
