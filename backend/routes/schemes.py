"""
Schemes API routes.
"""

from fastapi import APIRouter, Request, HTTPException
from typing import Optional

from services.scheme_store import SchemeStore

router = APIRouter()


@router.get("/schemes")
async def list_schemes(
    request: Request,
    category: Optional[str] = None,
    language: str = "en",
):
    """List all schemes, optionally filtered by category."""
    scheme_store: SchemeStore = request.app.state.scheme_store
    schemes = scheme_store.get_all_schemes(category=category, language=language)
    return {
        "schemes": schemes,
        "total": len(schemes),
        "category": category,
    }


@router.get("/schemes/{scheme_id}")
async def get_scheme(
    scheme_id: str,
    request: Request,
    language: str = "en",
):
    """Get a single scheme by ID."""
    scheme_store: SchemeStore = request.app.state.scheme_store
    scheme = scheme_store.get_scheme_by_id(scheme_id, language=language)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme


@router.get("/categories")
async def list_categories(request: Request):
    """List all available scheme categories."""
    scheme_store: SchemeStore = request.app.state.scheme_store
    categories = list(set(s.get("category", "") for s in scheme_store.schemes))
    category_info = {
        "agriculture": {"name": "Agriculture", "name_hi": "कृषि", "icon": "🌾"},
        "health": {"name": "Healthcare", "name_hi": "स्वास्थ्य", "icon": "🏥"},
        "education": {"name": "Education", "name_hi": "शिक्षा", "icon": "📚"},
        "employment": {"name": "Employment", "name_hi": "रोजगार", "icon": "💼"},
        "housing": {"name": "Housing", "name_hi": "आवास", "icon": "🏠"},
        "women": {"name": "Women & Child", "name_hi": "महिला एवं बाल", "icon": "👩"},
        "social": {"name": "Social Security", "name_hi": "सामाजिक सुरक्षा", "icon": "🛡️"},
        "finance": {"name": "Financial", "name_hi": "वित्तीय", "icon": "💰"},
    }
    return {
        "categories": [
            {"id": c, **category_info.get(c, {"name": c.title(), "name_hi": c, "icon": "📋"})}
            for c in sorted(categories) if c
        ]
    }
