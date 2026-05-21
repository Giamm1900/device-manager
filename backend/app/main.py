from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import assets, telemetry, alerts

app = FastAPI(title="dm-backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"type": "validation_error", "detail": exc.errors()},
    )


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"type": "http_error", "status": exc.status_code, "detail": exc.detail},
    )


app.include_router(assets.router, prefix="/api/v1")
app.include_router(telemetry.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
