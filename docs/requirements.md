# YOJANASETU — Requirements Specification

## 1. Product Overview

**YOJANASETU** is a voice-first, AI-powered assistant that bridges the gap between citizens and government services (schemes, education, healthcare, jobs).

## 2. Problem Statement

Existing government portals are text-heavy, fragmented, and inaccessible to non-literate or semi-literate users due to:
- Language barriers (English-centric interfaces)
- Complex multi-step navigation
- High cognitive load (forms, jargon, acronyms)
- No conversational guidance

## 3. Target Users

| Segment | Key Need |
|---|---|
| Rural & semi-urban citizens | Voice-based access in local language |
| Elderly users | Simple, guided interaction |
| First-time smartphone users | Minimal UI complexity |
| Students & job seekers | Aggregated scheme/job information |
| Scheme beneficiaries | Step-by-step application guidance |

## 4. Functional Requirements

### FR-1: Voice Input
- User can tap a microphone button and speak a query in Hindi or English.
- System transcribes speech to text using Amazon Transcribe (or Web Speech API fallback).

### FR-2: AI-Powered Query Understanding
- System uses Amazon Bedrock LLM to understand intent from the transcribed query.
- System classifies intent into: scheme_inquiry, eligibility_check, application_steps, general_info.

### FR-3: Retrieval-Augmented Generation (RAG)
- System retrieves relevant scheme documents from the knowledge base.
- Knowledge base is curated scheme data stored in Amazon S3 / DynamoDB.
- Retrieved context is passed to Bedrock LLM for grounded generation.

### FR-4: Simplified Response Generation
- AI generates plain-language, jargon-free responses.
- Responses include: explanation, eligibility criteria, required documents, application steps.
- Responses are structured with clear headings and bullet points.

### FR-5: Voice Output
- System converts text response to speech using Amazon Polly (or Web Speech API fallback).
- Audio is played back to the user automatically.

### FR-6: Follow-Up Conversation
- System maintains conversation context across multiple turns.
- User can ask clarifying questions without repeating context.
- System asks clarifying questions when confidence is low.

### FR-7: Language Support
- Prototype supports: Hindi, English.
- Architecture supports adding more languages post-prototype.

### FR-8: Scheme Browsing
- User can browse a curated list of popular government schemes.
- Each scheme card shows: name, one-line description, category.

## 5. Non-Functional Requirements

### NFR-1: Performance
- Response time: < 5 seconds for AI-generated answers.
- Voice transcription: < 2 seconds.

### NFR-2: Scalability
- Serverless architecture supports auto-scaling.
- No fixed server capacity limits.

### NFR-3: Availability
- Target: 99.9% uptime (AWS managed services).

### NFR-4: Security
- No PII collected in prototype.
- API endpoints secured via API Gateway.
- AWS IAM for service-to-service auth.

## 6. Prototype Scope

### In Scope
- Voice input/output
- AI chat with RAG
- 20-30 curated government schemes
- Hindi + English
- Multi-turn conversation
- AWS serverless architecture

### Out of Scope
- User authentication
- Payments
- Real government API integration
- Full production datasets
- Aadhaar/KYC verification
- Accessibility compliance (WCAG)

## 7. Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + TailwindCSS |
| Backend | Python FastAPI |
| AI/LLM | Amazon Bedrock (Claude) |
| Knowledge Base | Amazon S3 + Bedrock Knowledge Base |
| Database | Amazon DynamoDB |
| Voice Input | Amazon Transcribe / Web Speech API |
| Voice Output | Amazon Polly / Web Speech API |
| Hosting | AWS Amplify (frontend), Lambda + API Gateway (backend) |
| IaC | AWS SAM / CDK |
