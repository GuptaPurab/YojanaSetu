# YOJANASETU — Design Specification

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│   React + Vite + TailwindCSS (AWS Amplify)                  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│   │ Welcome  │ │  Chat    │ │ Schemes  │ │  Detail  │      │
│   │ Screen   │ │  Screen  │ │  Browse  │ │  View    │      │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST API
┌──────────────────────▼──────────────────────────────────────┐
│                   API GATEWAY / FastAPI                       │
│   /api/chat    /api/schemes    /api/tts    /api/stt         │
└──────┬────────────┬────────────┬───────────┬────────────────┘
       │            │            │           │
┌──────▼──────┐ ┌──▼────────┐ ┌▼─────────┐ ┌▼──────────────┐
│  BEDROCK    │ │ DYNAMODB  │ │ POLLY    │ │  TRANSCRIBE   │
│  (LLM+RAG) │ │ (Schemes  │ │ (TTS)    │ │  (STT)        │
│             │ │  + State) │ │          │ │               │
└──────┬──────┘ └───────────┘ └──────────┘ └───────────────┘
       │
┌──────▼──────┐
│  S3 BUCKET  │
│ (Knowledge  │
│   Base)     │
└─────────────┘
```

## 2. Frontend Design

### 2.1 Screen Flow
```
Welcome Screen → Chat Screen ↔ (Follow-up loop)
                     ↓
              Schemes Browser → Scheme Detail
```

### 2.2 Screens

#### Screen 1: Welcome Screen
- **Purpose**: Introduce the app, set language preference
- **Elements**: App logo, tagline, language selector (Hindi/English), "Start" button
- **User Action**: Select language → tap "Start"

#### Screen 2: Chat Screen (Main)
- **Purpose**: Voice-first conversational interface
- **Elements**:
  - Chat message list (user + AI bubbles)
  - Microphone button (large, prominent)
  - Text input fallback
  - "Listening..." indicator
  - AI typing indicator
  - Speaker icon on AI messages (tap to hear)
- **User Action**: Tap mic → speak → receive AI response → follow up

#### Screen 3: Schemes Browser
- **Purpose**: Browse available schemes by category
- **Elements**: Category tabs (Agriculture, Health, Education, Employment, Housing), scheme cards
- **User Action**: Tap category → tap scheme card → see detail

#### Screen 4: Scheme Detail
- **Purpose**: Show full scheme information
- **Elements**: Scheme name, description, eligibility, documents, application steps, "Ask about this" button
- **User Action**: Read details or tap "Ask about this" to start a chat

### 2.3 UI Principles
- Large touch targets (min 48px)
- High contrast text
- Minimal text, maximum icons
- Voice-first, text-second
- Mobile-first responsive design

## 3. Backend Design

### 3.1 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/chat` | Send user message, get AI response |
| GET | `/api/schemes` | List all schemes (with optional category filter) |
| GET | `/api/schemes/{id}` | Get scheme detail |
| POST | `/api/tts` | Convert text to speech (Polly) |
| POST | `/api/stt` | Convert speech to text (Transcribe) |
| GET | `/api/health` | Health check |

### 3.2 Chat API Flow
```
1. User sends: { message, language, conversation_id }
2. Backend retrieves conversation history from DynamoDB
3. Backend searches knowledge base for relevant schemes
4. Backend constructs RAG prompt:
   - System prompt (role, language, format rules)
   - Retrieved scheme documents (context)
   - Conversation history
   - User's current message
5. Backend calls Bedrock LLM
6. Backend stores AI response in DynamoDB
7. Backend returns: { response, sources, conversation_id }
```

### 3.3 RAG Pipeline
```
User Query
    ↓
Keyword/Semantic Search against scheme data
    ↓
Top-K relevant scheme documents retrieved
    ↓
Documents + Query → Bedrock LLM prompt
    ↓
Grounded, simplified response
```

## 4. Data Design

### 4.1 Schemes Table (DynamoDB / JSON seed)
```json
{
  "scheme_id": "pm-kisan",
  "name": "PM-KISAN Samman Nidhi",
  "name_hi": "पीएम-किसान सम्मान निधि",
  "category": "agriculture",
  "description": "Financial benefit of Rs 6000 per year...",
  "description_hi": "...",
  "eligibility": ["Small and marginal farmers", "..."],
  "documents_required": ["Aadhaar card", "Land records", "..."],
  "application_steps": ["Visit PM-KISAN portal", "..."],
  "benefit_amount": "₹6,000 per year",
  "ministry": "Ministry of Agriculture",
  "website": "https://pmkisan.gov.in"
}
```

### 4.2 Conversations Table (DynamoDB)
```json
{
  "conversation_id": "uuid",
  "language": "hi",
  "messages": [
    { "role": "user", "content": "...", "timestamp": "..." },
    { "role": "assistant", "content": "...", "timestamp": "..." }
  ],
  "created_at": "...",
  "updated_at": "..."
}
```

## 5. AI Prompt Design

### System Prompt
```
You are YOJANASETU, a helpful government services assistant for Indian citizens.

Rules:
1. Always respond in the user's language ({language}).
2. Use simple, everyday language. Avoid jargon.
3. Structure responses with clear steps when explaining processes.
4. Only provide information from the provided context documents.
5. If you're not sure, say so honestly and suggest what the user can do.
6. Be warm, respectful, and patient.
7. When explaining eligibility, use "you may be eligible if..." not definitive statements.

Context documents:
{retrieved_documents}
```

## 6. Mock vs Real Mode

| Component | Mock Mode | Real AWS Mode |
|---|---|---|
| LLM | Pre-written responses + simple keyword matching | Amazon Bedrock API |
| TTS | Browser Web Speech API | Amazon Polly |
| STT | Browser Web Speech API | Amazon Transcribe |
| Database | In-memory JSON | Amazon DynamoDB |
| Knowledge Base | Local JSON files | Amazon S3 + Bedrock KB |

The app starts in **mock mode** by default. Set `USE_AWS=true` in `.env` to enable real AWS services.
