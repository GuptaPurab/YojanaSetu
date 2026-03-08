"""
Voice Service — TTS and STT via AWS Polly/Transcribe or mock.
"""

import os
import base64
import json


async def text_to_speech(text: str, language: str = "en") -> dict:
    """Convert text to speech."""
    use_aws = os.getenv("USE_AWS", "false").lower() == "true"
    
    if use_aws:
        return await _polly_tts(text, language)
    else:
        # In mock mode, frontend uses Web Speech API
        return {
            "use_browser_tts": True,
            "text": text,
            "language": "hi-IN" if language == "hi" else "en-IN",
        }


async def speech_to_text(audio_data: bytes, language: str = "en") -> dict:
    """Convert speech to text."""
    use_aws = os.getenv("USE_AWS", "false").lower() == "true"
    
    if use_aws:
        return await _transcribe_stt(audio_data, language)
    else:
        # In mock mode, frontend uses Web Speech API
        return {
            "use_browser_stt": True,
            "language": "hi-IN" if language == "hi" else "en-IN",
        }


async def _polly_tts(text: str, language: str) -> dict:
    """Amazon Polly text-to-speech."""
    import boto3
    
    region = os.getenv("AWS_REGION", "ap-south-1")
    client = boto3.client("polly", region_name=region)
    
    # Select voice based on language
    voice_id = "Aditi" if language == "hi" else "Aditi"  # Aditi supports both Hindi & English (Indian accent)
    lang_code = "hi-IN" if language == "hi" else "en-IN"
    
    try:
        response = client.synthesize_speech(
            Text=text[:3000],  # Polly limit
            OutputFormat="mp3",
            VoiceId=voice_id,
            LanguageCode=lang_code,
            Engine="neural" if voice_id in ["Kajal"] else "standard",
        )
        
        audio_stream = response["AudioStream"].read()
        audio_base64 = base64.b64encode(audio_stream).decode("utf-8")
        
        return {
            "use_browser_tts": False,
            "audio_base64": audio_base64,
            "content_type": "audio/mpeg",
        }
    except Exception as e:
        print(f"❌ Polly error: {e}")
        return {
            "use_browser_tts": True,
            "text": text,
            "language": lang_code,
        }


async def _transcribe_stt(audio_data: bytes, language: str) -> dict:
    """Amazon Transcribe speech-to-text (streaming not used — simplified)."""
    # For prototype, we use the browser Web Speech API even in AWS mode
    # Full Transcribe integration would require WebSocket streaming
    return {
        "use_browser_stt": True,
        "language": "hi-IN" if language == "hi" else "en-IN",
        "note": "Using browser STT. Full Transcribe integration available for production.",
    }
