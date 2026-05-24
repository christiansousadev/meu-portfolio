"""camada de orquestracao de provedores llm e busca local em json."""

import json
import logging

import google.generativeai as genai

from core.config import settings

if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)
else:
    logging.warning("GEMINI_API_KEY nao encontrada; provider gemini ficara indisponivel")


# CARREGA O CONTEXTO BRUTO DO ARQUIVO JSON
def load_portfolio_context() -> dict:
    try:
        return json.loads(settings.portfolio_data_path.read_text(encoding="utf-8"))
    except Exception as exc:
        logging.error(f"falha ao carregar o contexto json: {exc}")
        return {}


# BUSCA LOCAL POR PALAVRA-CHAVE
def search_json_answers(query: str, context: dict) -> str | None:
    if not context:
        return None
    q = query.lower()

    if any(g in q for g in ["oi", "olá", "bom dia", "boa tarde"]):
        return (
            f"Olá! Sou o assistente do {context['dados_pessoais']['nome']}. "
            "Posso te falar sobre o perfil, habilidades, experiências ou projetos dele. "
            "O que deseja saber?"
        )
    if any(p in q for p in ["quem é", "perfil", "sobre", "resumo"]):
        return (
            f"{context['dados_pessoais']['perfil']} "
            f"Ele está localizado em {context['dados_pessoais']['localizacao']}."
        )
    if any(c in q for c in ["contato", "email", "linkedin", "github", "falar"]):
        return (
            f"Você pode encontrar o Christian no LinkedIn ({context['contatos']['linkedin']}), "
            f"GitHub ({context['contatos']['github']}) "
            f"ou enviar um email para {context['contatos']['email']}."
        )
    if any(s in q for s in ["habilidade", "skill", "tecnologia", "conhece", "stack", "ferramenta"]):
        skills = "\n- ".join(context["habilidades_tecnicas"])
        return f"As principais habilidades técnicas do Christian são:\n- {skills}"
    if any(proj in q for proj in ["projeto", "portfólio", "portfolio", "feito", "trabalhos"]):
        items = "\n- ".join(f"**{p['nome']}**: {p['descricao']}" for p in context["projetos_destaque"])
        return (
            f"Aqui estão os projetos de destaque do Christian:\n{items}\n\n"
            f"Você também pode acessar o portfólio web completo em: {context['contatos']['portfolio_web']}"
        )
    if any(e in q for e in ["experiência", "trabalhou", "empresa", "carreira", "vaga"]):
        exp = "\n- ".join(f"**{e['empresa']}**: {e['resumo_tecnico']}" for e in context["experiencias_profissionais"])
        return f"O Christian possui uma trajetória sólida em empresas como:\n{exp}"
    if "governança" in q or "processo" in q or "itil" in q:
        gov = "\n- ".join(context["governanca_e_processos"])
        return f"Na área de Governança, o Christian foca em:\n{gov}"

    return None


# MAPA INTENCAO -> SECAO DO CONTEXTO
# centralizado para evitar drift entre o search local e o seletor focado.
# cada tupla declara: keywords da intencao, chave do contexto a anexar
_INTENT_KEYWORDS: tuple[tuple[tuple[str, ...], str], ...] = (
    (("contato", "email", "linkedin", "github", "falar"), "contatos"),
    (
        ("habilidade", "skill", "tecnologia", "conhece", "stack", "ferramenta"),
        "habilidades_tecnicas",
    ),
    (
        ("experiência", "experiencia", "trabalhou", "empresa", "carreira", "vaga"),
        "experiencias_profissionais",
    ),
    (
        ("projeto", "portfólio", "portfolio", "feito", "trabalhos"),
        "projetos_destaque",
    ),
    (("governança", "governanca", "processo", "itil", "iso", "cobit"), "governanca_e_processos"),
)


# RECORTE FOCADO DO CONTEXTO
def build_focused_context(query: str, context: dict) -> dict:
    """
    seleciona somente as secoes do contexto relevantes para a query.

    evita enviar o json inteiro ao llm: economiza tokens, melhora a
    coerencia da resposta e reduz risco de exposicao de dados acessorios.
    'dados_pessoais' acompanha sempre por ser leve e identificar o sujeito.
    """
    if not context:
        return {}

    q = (query or "").lower()
    slices: dict = {}

    # bloco identitario sempre presente para ancorar respostas em terceira pessoa
    if "dados_pessoais" in context:
        slices["dados_pessoais"] = context["dados_pessoais"]

    matched_any = False
    for keywords, ctx_key in _INTENT_KEYWORDS:
        if any(k in q for k in keywords) and ctx_key in context:
            slices[ctx_key] = context[ctx_key]
            matched_any = True

    # fallback para perguntas genericas: anexa contatos e habilidades
    # mantendo o prompt pequeno mas util ao llm responder com utilidade
    if not matched_any:
        for fallback_key in ("contatos", "habilidades_tecnicas"):
            if fallback_key in context and fallback_key not in slices:
                slices[fallback_key] = context[fallback_key]

    return slices


# MONTAGEM DO SYSTEM PROMPT
def build_system_prompt(context: dict, focused: dict) -> str:
    """
    une as instrucoes estaticas (context['instrucoes_ia']) com o recorte
    focado serializado em json. mantemos o json compacto para o llm
    parsear sem ruido visual desnecessario.
    """
    instrucoes = (context or {}).get(
        "instrucoes_ia",
        "Você é um assistente objetivo. Responda apenas com base nos dados fornecidos.",
    )
    payload = json.dumps(focused, ensure_ascii=False, separators=(",", ":"))
    return (
        f"{instrucoes}\n\n"
        "Use exclusivamente o JSON abaixo como base factual. "
        "Se a resposta exigir dado ausente, peça para o usuário contatar o Christian.\n"
        f"DADOS: {payload}"
    )


# ROTEADOR DE PROVEDORES LLM
def generate_llm_response(provider: str, prompt: str, system_context: str) -> str:
    if provider == "json_only":
        return (
            "Sinto muito, só consigo responder perguntas específicas sobre os projetos, "
            "contatos ou habilidades do Christian no momento."
        )
    if provider == "gemini":
        model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_context)
        return model.generate_content(prompt).text
    if provider == "ollama":
        import requests

        if not settings.ollama_url:
            return "Provedor Ollama nao esta configurado."
        payload = {
            "model": "llama3",
            "prompt": f"{system_context}\n\nUser: {prompt}",
            "stream": False,
        }
        res = requests.post(settings.ollama_url, json=payload, timeout=30)
        return res.json().get("response", "")
    if provider in {"openai", "deepseek"}:
        return f"O provedor {provider} está configurado no .env, mas o SDK ainda não foi importado."
    return "Provedor de IA não reconhecido ou não configurado."
