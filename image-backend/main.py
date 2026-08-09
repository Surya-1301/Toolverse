import os
import uuid

import requests
from fastapi import FastAPI, File, HTTPException, UploadFile
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
        "provider": "remove.bg",
        "routes": [
            "/ping",
            "/healthz",
            "/health",
            "/api/image/remove-background",
        ],
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
        "provider": "remove.bg",
        "hasApiKey": bool(os.getenv("REMOVEBG_API_KEY")),
        "routes": [
            "/ping",
            "/healthz",
            "/health",
            "/api/image/remove-background",
        ],
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
