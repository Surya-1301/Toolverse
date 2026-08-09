import os
import uuid
from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError


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

rembg_session = None


def get_rembg_session():
    global rembg_session

    if rembg_session is None:
        from rembg import new_session

        # u2netp is much lighter than the default u2net model and works better
        # on small Render instances. The session is cached after first use.
        rembg_session = new_session("u2netp")

    return rembg_session


@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {
        "ok": True,
        "service": "Toolverse Image API",
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
        "model": "u2netp",
        "routes": [
            "/ping",
            "/healthz",
            "/health",
            "/api/image/remove-background",
        ],
    }


@app.post("/api/image/remove-background")
async def remove_background(file: UploadFile = File(...)):
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
        input_image = Image.open(BytesIO(file_bytes)).convert("RGBA")
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="Could not read this image. Please upload a valid image.",
        )

    try:
        # Lazy import keeps server startup fast for Render port detection.
        from rembg import remove

        session = get_rembg_session()
        output_image = remove(input_image, session=session)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Background removal failed: {str(error)}",
        )

    output_buffer = BytesIO()
    output_image.save(output_buffer, format="PNG")
    output_buffer.seek(0)

    original_name = file.filename or f"image-{uuid.uuid4()}.png"
    safe_name = os.path.splitext(original_name)[0]
    output_name = f"{safe_name}-no-bg.png"

    return Response(
        content=output_buffer.getvalue(),
        media_type="image/png",
        headers={
            "Content-Disposition": f'attachment; filename="{output_name}"',
            "Cache-Control": "no-store",
        },
    )
