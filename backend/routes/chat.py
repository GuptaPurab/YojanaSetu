"""
Chat API routes.
"""

import uuid
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional

from services.chat_service import generate_response
from services.scheme_store import SchemeStore

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    sources: list[str] = []
    language: str = "en"


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request):
    """Main chat endpoint — send a message, get AI response."""
    # Generate conversation ID if new conversation
    conversation_id = req.conversation_id or str(uuid.uuid4())
    
    # Get scheme store from app state
    scheme_store: SchemeStore = request.app.state.scheme_store
    
    # RAG: retrieve relevant schemes based on user query
    retrieved_schemes = scheme_store.search_schemes(req.message, top_k=3)
    
    # Generate AI response
    result = await generate_response(
        message=req.message,
        conversation_id=conversation_id,
        language=req.language,
        retrieved_schemes=retrieved_schemes,
    )
    
    return ChatResponse(**result)
