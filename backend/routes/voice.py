"""
Voice API routes — TTS and STT.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from services.voice_service import text_to_speech, speech_to_text

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    language: str = "en"


class STTRequest(BaseModel):
    audio_base64: Optional[str] = None
    language: str = "en"


@router.post("/tts")
async def tts(req: TTSRequest):
    """Convert text to speech."""
    result = await text_to_speech(req.text, req.language)
    return result


@router.post("/stt")
async def stt(req: STTRequest):
    """Speech to text configuration."""
    result = await speech_to_text(b"", req.language)
    return result
