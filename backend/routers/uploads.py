import mimetypes
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

UPLOAD_BASE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "uploads")
)

MIME_TYPES = {
    ".pdf": "application/pdf",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


@router.get("/{category}/{filename}")
async def get_uploaded_file(category: str, filename: str):
    """Serve arquivos enviados pelo console admin (currículos, selos e imagens)
    de forma segura com cabeçalhos apropriados e controle de cache."""
    if category not in ("resumes", "badges", "images"):
        raise HTTPException(status_code=400, detail="Categoria de upload inválida.")

    safe_name = os.path.basename(filename)
    if safe_name != filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido.")

    target_path = os.path.abspath(os.path.join(UPLOAD_BASE, category, safe_name))

    # Proteção estrita contra path traversal
    if os.path.commonpath([UPLOAD_BASE, target_path]) != UPLOAD_BASE or not os.path.isfile(target_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")

    ext = os.path.splitext(safe_name)[1].lower()
    media_type = MIME_TYPES.get(
        ext, mimetypes.guess_type(target_path)[0] or "application/octet-stream"
    )

    headers = {
        "Cache-Control": "public, max-age=86400, must-revalidate",
    }
    # PDFs abrem diretamente com opção de download inline
    if ext == ".pdf":
        headers["Content-Disposition"] = f'inline; filename="{safe_name}"'

    return FileResponse(
        path=target_path,
        media_type=media_type,
        filename=safe_name,
        headers=headers,
    )

