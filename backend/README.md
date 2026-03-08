# Backend — YOJANASETU API

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env       # Edit with your config
uvicorn main:app --reload --port 5000
```

## Mock Mode (Default)
Works out of the box — no AWS credentials needed.
Uses keyword-matching and pre-written responses.

## Real AWS Mode
Set `USE_AWS=true` in `.env` and configure AWS credentials.
