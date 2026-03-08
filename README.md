# YOJANASETU 🇮🇳

**Voice-first AI assistant for Indian government services**

> "Bol ke poocho, samajh ke jaano" — Ask by speaking, understand clearly

## What is YOJANASETU?

YOJANASETU is an AI-powered conversational assistant that bridges the gap between Indian citizens and government services. It lets users **speak their need** in Hindi or English and receive simple, step-by-step guidance about government schemes, eligibility, documents required, and application processes.

## Demo

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api/health
- **API Docs:** http://localhost:5000/docs

## Quick Start

### Prerequisites
- Python 3.10+ 
- Node.js 18+
- npm

### Run (Mock Mode — No AWS needed)

**Terminal 1 — Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Project Structure

```
YOJANA_SETU/
├── frontend/               # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── screens/        # WelcomeScreen, ChatScreen, SchemesScreen, SchemeDetail
│   │   ├── services/       # API client, Voice (STT/TTS) service
│   │   └── App.jsx         # Router & main app
│   └── package.json
│
├── backend/                # Python FastAPI
│   ├── routes/             # chat.py, schemes.py, voice.py
│   ├── services/           # chat_service.py, voice_service.py, scheme_store.py
│   ├── data/               # schemes.json (20 curated government schemes)
│   ├── main.py             # FastAPI app + Lambda handler
│   └── requirements.txt
│
├── docs/                   # Kiro spec-driven documentation
│   ├── requirements.md     # Product requirements
│   ├── design.md           # System design specification
│   └── aws-setup.md        # AWS configuration guide
│
├── infra/                  # AWS SAM infrastructure template
│   └── template.yaml
│
└── .gitignore
```

## Architecture

```
User (Voice/Text)
  ↓
React Frontend (Amplify)
  ↓ /api/*
FastAPI Backend (Lambda + API Gateway)
  ↓
┌─────────────────────────────┐
│  Amazon Bedrock (LLM + RAG) │ ← S3 Knowledge Base
│  Amazon Polly (TTS)         │
│  Amazon Transcribe (STT)    │
│  Amazon DynamoDB (State)    │
└─────────────────────────────┘
```

## Features

| Feature | Status |
|---|---|
| Voice input (speech-to-text) | ✅ Browser Web Speech API |
| AI chat with scheme info | ✅ Mock mode + Bedrock ready |
| Voice output (text-to-speech) | ✅ Browser TTS + Polly ready |
| 20 government schemes data | ✅ Hindi + English |
| Scheme browsing by category | ✅ 8 categories |
| Follow-up conversation | ✅ Multi-turn context |
| Hindi & English support | ✅ Full bilingual |
| RAG-based responses | ✅ Keyword search (mock) / Bedrock KB (AWS) |
| AWS deployment ready | ✅ SAM template included |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, React Router |
| Backend | Python, FastAPI, boto3 |
| AI | Amazon Bedrock (Claude), RAG pipeline |
| Voice | Amazon Polly + Transcribe (AWS) / Web Speech API (mock) |
| Database | Amazon DynamoDB |
| Knowledge Base | Amazon S3 |
| Infra | AWS SAM, Lambda, API Gateway |
| Hosting | AWS Amplify (frontend) |

## AWS Mode

Set `USE_AWS=true` in `backend/.env` and configure AWS credentials.
See [docs/aws-setup.md](docs/aws-setup.md) for full instructions.

---

Built for hackathon prototype submission. Powered by Amazon Bedrock & AWS.
