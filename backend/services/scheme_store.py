"""
Scheme data store — loads curated government scheme data.
In mock mode: loads from local JSON file.
In AWS mode: loads from DynamoDB.
"""

import json
import os
from pathlib import Path
from typing import List, Optional


class SchemeStore:
    def __init__(self):
        self.schemes: list[dict] = []
        self.use_aws = os.getenv("USE_AWS", "false").lower() == "true"

    def load_schemes(self):
        """Load schemes from local JSON (mock) or DynamoDB (AWS)."""
        if self.use_aws:
            self._load_from_dynamodb()
        else:
            self._load_from_json()

    def _load_from_json(self):
        """Load from local seed data."""
        data_path = Path(__file__).parent.parent / "data" / "schemes.json"
        if data_path.exists():
            with open(data_path, "r", encoding="utf-8") as f:
                self.schemes = json.load(f)
        else:
            self.schemes = []
            print(f"⚠️ No schemes data found at {data_path}")

    def _load_from_dynamodb(self):
        """Load from AWS DynamoDB."""
        try:
            import boto3
            table_name = os.getenv("DYNAMODB_SCHEMES_TABLE", "yojanasetu-schemes")
            region = os.getenv("AWS_REGION", "ap-south-1")
            dynamodb = boto3.resource("dynamodb", region_name=region)
            table = dynamodb.Table(table_name)
            response = table.scan()
            items = response.get("Items", [])
            while "LastEvaluatedKey" in response:
                response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
                items.extend(response.get("Items", []))
            self.schemes = items
            print(f"✅ Loaded {len(self.schemes)} schemes from DynamoDB '{table_name}' in {region}")
        except Exception as e:
            self.schemes = []
            print(f"❌ DynamoDB load failed (continuing with empty schemes): {e}")

    def get_all_schemes(self, category: Optional[str] = None, language: str = "en") -> List[dict]:
        """Get all schemes, optionally filtered by category."""
        results = self.schemes
        if category:
            results = [s for s in results if s.get("category", "").lower() == category.lower()]
        return [self._localize(s, language) for s in results]

    def get_scheme_by_id(self, scheme_id: str, language: str = "en") -> Optional[dict]:
        """Get a single scheme by ID."""
        for s in self.schemes:
            if s.get("scheme_id") == scheme_id:
                return self._localize(s, language)
        return None

    def search_schemes(self, query: str, top_k: int = 5) -> List[dict]:
        """Simple keyword search for RAG retrieval (mock mode)."""
        query_lower = query.lower()
        scored = []
        for s in self.schemes:
            score = 0
            searchable = f"{s.get('name', '')} {s.get('description', '')} {s.get('category', '')} {' '.join(s.get('eligibility', []))} {' '.join(s.get('keywords', []))}".lower()
            for word in query_lower.split():
                if word in searchable:
                    score += 1
            if score > 0:
                scored.append((score, s))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [s for _, s in scored[:top_k]]

    def _localize(self, scheme: dict, language: str) -> dict:
        """Return scheme with localized fields based on language."""
        result = dict(scheme)
        if language == "hi":
            result["name"] = scheme.get("name_hi", scheme.get("name", ""))
            result["description"] = scheme.get("description_hi", scheme.get("description", ""))
            result["eligibility"] = scheme.get("eligibility_hi", scheme.get("eligibility", []))
            result["documents_required"] = scheme.get("documents_required_hi", scheme.get("documents_required", []))
            result["application_steps"] = scheme.get("application_steps_hi", scheme.get("application_steps", []))
        return result
