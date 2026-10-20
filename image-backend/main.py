import os
import shutil
import subprocess
import tempfile
import uuid

import requests
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response


app = FastAPI(
    title="Toolverse Image API",
    description="Image processing backend for Toolverse.",
    version="1.0.0",
)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://toolversee.pages.dev",
    "https://localhost",
    "capacitor://localhost",
]

extra_origin = os.getenv("FRONTEND_ORIGIN")
if extra_origin:
    ALLOWED_ORIGINS.append(extra_origin.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 25 * 1024 * 1024
MAX_PDF_SIZE = 50 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}


@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {
        "ok": True,
        "service": "Toolverse Image API",
        "version": "1.0.0",
    }


@app.api_route("/ping", methods=["GET", "HEAD"])
def ping():
    return {
        "ok": True,
        "status": "up",
    }


@app.api_route("/healthz", methods=["GET", "HEAD"])
def healthz():
    return {
        "ok": True,
        "status": "healthy",
        "service": "Toolverse Image API",
    }


@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {
        "ok": True,
        "status": "healthy",
        "service": "Toolverse Image API",
        "version": "1.0.0",
        "hasApiKey": bool(os.getenv("REMOVEBG_API_KEY")),
    }


@app.post("/api/image/remove-background")
async def remove_background(file: UploadFile = File(...)):
    api_key = os.getenv("REMOVEBG_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="REMOVEBG_API_KEY is missing on the backend.",
        )

    if not file:
        raise HTTPException(status_code=400, detail="No image file uploaded.")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type. Please upload PNG, JPG, JPEG, or WebP.",
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image is too large. Maximum allowed size is 25 MB.",
        )

    try:
        remove_bg_response = requests.post(
            "https://api.remove.bg/v1.0/removebg",
            files={
                "image_file": (
                    file.filename or "image.png",
                    file_bytes,
                    file.content_type or "application/octet-stream",
                )
            },
            data={
                "size": "auto",
                "format": "png",
            },
            headers={
                "X-Api-Key": api_key,
            },
            timeout=60,
        )
    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=f"Could not reach remove.bg API: {str(error)}",
        )

    if remove_bg_response.status_code != requests.codes.ok:
        try:
            error_message = remove_bg_response.json().get("errors", [{}])[0].get(
                "title",
                remove_bg_response.text,
            )
        except Exception:
            error_message = remove_bg_response.text

        raise HTTPException(
            status_code=remove_bg_response.status_code,
            detail=f"remove.bg failed: {error_message}",
        )

    original_name = file.filename or f"image-{uuid.uuid4()}.png"
    safe_name = os.path.splitext(original_name)[0]
    output_name = f"{safe_name}-no-bg.png"

    return Response(
        content=remove_bg_response.content,
        media_type="image/png",
        headers={
            "Content-Disposition": f'attachment; filename="{output_name}"',
            "Cache-Control": "no-store",
        },
    )


def _pdf_settings(quality: float) -> str:
    if quality >= 0.85:
        return "/printer"
    if quality >= 0.6:
        return "/ebook"
    return "/screen"


def _pdf_resolution(quality: float) -> tuple[str, str, str]:
    if quality >= 0.85:
        return ("220", "220", "300")
    if quality >= 0.6:
        return ("150", "150", "200")
    if quality >= 0.35:
        return ("100", "100", "150")
    if quality >= 0.05:
        return ("72", "72", "100")
    # Ultra tier — smallest possible output for tiny targets.
    return ("50", "50", "72")


def _pdf_jpeg_quality(quality: float) -> str | None:
    if quality >= 0.35:
        return None
    if quality >= 0.05:
        return "50"
    return "25"


@app.post("/api/pdf/compress")
async def compress_pdf(
    file: UploadFile = File(...),
    quality: str = Form("0.6"),
):
    try:
        quality_value = float(quality)
    except (TypeError, ValueError):
        quality_value = 0.6

    if not file:
        raise HTTPException(status_code=400, detail="PDF file is required.")

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")

    if len(file_bytes) > MAX_PDF_SIZE:
        raise HTTPException(
            status_code=413,
            detail="PDF is too large. Maximum allowed size is 50 MB.",
        )

    original_name = file.filename or "document.pdf"
    lower_name = original_name.lower()
    content_type = (file.content_type or "").lower()

    if content_type != "application/pdf" and not lower_name.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a PDF file.",
        )

    if not file_bytes.startswith(b"%PDF"):
        raise HTTPException(
            status_code=400,
            detail="That file is not a valid PDF.",
        )

    if not shutil.which("gs"):
        raise HTTPException(
            status_code=500,
            detail="Ghostscript is not installed on the image backend.",
        )

    pdf_settings = _pdf_settings(quality_value)
    color_res, gray_res, mono_res = _pdf_resolution(quality_value)
    jpeg_quality = _pdf_jpeg_quality(quality_value)

    args = [
        "gs",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS={pdf_settings}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        "-dDetectDuplicateImages=true",
        "-dCompressFonts=true",
        "-dSubsetFonts=true",
        "-dEmbedAllFonts=true",
        "-dAutoRotatePages=/None",
        "-dColorImageDownsampleType=/Bicubic",
        f"-dColorImageResolution={color_res}",
        "-dGrayImageDownsampleType=/Bicubic",
        f"-dGrayImageResolution={gray_res}",
        "-dMonoImageDownsampleType=/Subsample",
        f"-dMonoImageResolution={mono_res}",
        "-dColorImageDownsampleThreshold=1.0",
        "-dGrayImageDownsampleThreshold=1.0",
        "-dMonoImageDownsampleThreshold=1.0",
    ]

    if jpeg_quality is not None:
        args += [
            "-dAutoFilterColorImages=false",
            "-dColorImageFilter=/DCTEncode",
            "-dAutoFilterGrayImages=false",
            "-dGrayImageFilter=/DCTEncode",
            f"-dJPEGQ={jpeg_quality}",
        ]

    with tempfile.TemporaryDirectory(prefix="toolverse-pdf-") as tmpdir:
        input_path = os.path.join(tmpdir, f"input-{uuid.uuid4().hex}.pdf")
        output_path = os.path.join(tmpdir, f"output-{uuid.uuid4().hex}.pdf")

        with open(input_path, "wb") as handle:
            handle.write(file_bytes)

        args += [f"-sOutputFile={output_path}", input_path]

        try:
            completed = subprocess.run(
                args,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=120,
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(
                status_code=500,
                detail="Ghostscript PDF compression timed out.",
            )

        if completed.returncode != 0 or not os.path.exists(output_path):
            detail = (completed.stderr or completed.stdout or b"").decode(
                "utf-8", errors="ignore"
            )
            raise HTTPException(
                status_code=500,
                detail=detail or "Ghostscript PDF compression failed.",
            )

        with open(output_path, "rb") as handle:
            compressed_bytes = handle.read()

    base = os.path.splitext(os.path.basename(original_name))[0] or "document"
    output_name = f"{base}-compressed.pdf"

    # Match pdf-backend behaviour: never return a larger file.
    payload = (
        compressed_bytes
        if compressed_bytes and len(compressed_bytes) < len(file_bytes)
        else file_bytes
    )

    return Response(
        content=payload,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{output_name}"',
            "X-Original-Size": str(len(file_bytes)),
            "X-Compressed-Size": str(len(payload)),
            "X-Compression-Used": (
                "compressed" if len(payload) < len(file_bytes) else "original"
            ),
            "Cache-Control": "no-store",
        },
    )
