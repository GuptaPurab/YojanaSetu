"""
YOJANASETU Backend — FastAPI Application
Voice-first AI assistant for government services
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.chat import router as chat_router
from routes.schemes import router as schemes_router
from routes.voice import router as voice_router
from services.scheme_store import SchemeStore


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load scheme data on startup."""
    scheme_store = SchemeStore()
    scheme_store.load_schemes()
    app.state.scheme_store = scheme_store
    print(f"✅ Loaded {len(scheme_store.schemes)} schemes")
    print(f"🔧 AWS Mode: {'ENABLED' if os.getenv('USE_AWS', 'false').lower() == 'true' else 'MOCK'}")
    yield


app = FastAPI(
    title="YOJANASETU API",
    description="Voice-first AI assistant for Indian government services",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(chat_router, prefix="/api")
app.include_router(schemes_router, prefix="/api")
app.include_router(voice_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    use_aws = os.getenv("USE_AWS", "false").lower() == "true"
    return {
        "status": "healthy",
        "service": "YOJANASETU API",
        "mode": "aws" if use_aws else "mock",
    }


# Lambda handler for AWS deployment (used by SAM/API Gateway)
try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    pass
