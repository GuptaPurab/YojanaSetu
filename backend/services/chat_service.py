"""
AI Chat Service — handles LLM interaction.
Mock mode: keyword matching + template responses.
AWS mode: Amazon Bedrock with RAG.
"""

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Optional


# In-memory conversation store for mock mode
_conversations: dict[str, list[dict]] = {}


SYSTEM_PROMPT_EN = """You are YOJANASETU, a helpful and friendly government services assistant for Indian citizens.

Your role:
- Help citizens understand government schemes, benefits, and services.
- Explain eligibility criteria in simple language.
- Provide step-by-step application guidance.
- Be warm, respectful, and patient.

Rules:
1. Respond in English (simple, everyday language).
2. Avoid bureaucratic jargon. Use plain words.
3. Structure your responses with bullet points and numbered steps when helpful.
4. ONLY provide information based on the context documents provided below. Do NOT make up information.
5. If the information is not in the context, honestly say "I don't have specific information about that, but here's what you can do..."
6. When explaining eligibility, use "you may be eligible if..." — never make definitive claims.
7. Keep responses concise — max 200 words.
8. If the user's question is vague, ask a clarifying question.

Context documents (government scheme information):
{context}
"""

SYSTEM_PROMPT_HI = """आप YOJANASETU हैं, भारतीय नागरिकों के लिए एक मददगार और मित्रवत सरकारी सेवा सहायक।

आपकी भूमिका:
- नागरिकों को सरकारी योजनाओं, लाभों और सेवाओं को समझने में मदद करें।
- पात्रता मानदंड को सरल भाषा में समझाएं।
- आवेदन करने के लिए चरण-दर-चरण मार्गदर्शन प्रदान करें।
- गर्मजोशी, सम्मान और धैर्य से बात करें।

नियम:
1. हिंदी में जवाब दें (सरल, रोज़मर्रा की भाषा)।
2. सरकारी शब्दजाल से बचें। सादी भाषा का प्रयोग करें।
3. जब मददगार हो तो बुलेट पॉइंट और क्रमांकित चरणों का उपयोग करें।
4. केवल नीचे दिए गए संदर्भ दस्तावेजों के आधार पर जानकारी दें। जानकारी न बनाएं।
5. यदि जानकारी संदर्भ में नहीं है, तो ईमानदारी से कहें "मेरे पास इसकी विशेष जानकारी नहीं है, लेकिन आप यह कर सकते हैं..."
6. पात्रता समझाते समय "आप पात्र हो सकते हैं यदि..." का उपयोग करें।
7. जवाब संक्षिप्त रखें — अधिकतम 200 शब्द।
8. यदि उपयोगकर्ता का प्रश्न अस्पष्ट है, तो स्पष्ट करने वाला प्रश्न पूछें।

संदर्भ दस्तावेज (सरकारी योजना जानकारी):
{context}
"""


def get_conversation(conversation_id: str) -> list[dict]:
    """Get conversation history."""
    return _conversations.get(conversation_id, [])


def save_message(conversation_id: str, role: str, content: str):
    """Save a message to conversation history."""
    if conversation_id not in _conversations:
        _conversations[conversation_id] = []
    _conversations[conversation_id].append({
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


def build_context(schemes: list[dict]) -> str:
    """Build context string from retrieved schemes for RAG."""
    if not schemes:
        return "No specific scheme information available for this query."
    
    parts = []
    for s in schemes:
        part = f"""
--- SCHEME: {s.get('name', 'Unknown')} ---
Category: {s.get('category', 'N/A')}
Description: {s.get('description', 'N/A')}
Eligibility: {', '.join(s.get('eligibility', []))}
Documents Required: {', '.join(s.get('documents_required', []))}
Application Steps: {' → '.join(s.get('application_steps', []))}
Benefit: {s.get('benefit_amount', 'N/A')}
Ministry: {s.get('ministry', 'N/A')}
Website: {s.get('website', 'N/A')}
"""
        parts.append(part.strip())
    return "\n\n".join(parts)


async def generate_response(
    message: str,
    conversation_id: str,
    language: str,
    retrieved_schemes: list[dict],
) -> dict:
    """Generate AI response — mock or Bedrock."""
    use_aws = os.getenv("USE_AWS", "false").lower() == "true"

    # Save user message
    save_message(conversation_id, "user", message)
    
    # Build context from retrieved schemes
    context = build_context(retrieved_schemes)
    
    if use_aws:
        response_text = await _bedrock_generate(message, conversation_id, language, context)
    else:
        response_text = _mock_generate(message, language, context, retrieved_schemes)
    
    # Save AI response
    save_message(conversation_id, "assistant", response_text)
    
    # Extract source scheme names
    sources = [s.get("name", "") for s in retrieved_schemes[:3]]
    
    return {
        "response": response_text,
        "conversation_id": conversation_id,
        "sources": sources,
        "language": language,
    }


async def _bedrock_generate(
    message: str,
    conversation_id: str,
    language: str,
    context: str,
) -> str:
    """Generate response using Amazon Bedrock."""
    import boto3

    region = os.getenv("AWS_REGION", "ap-south-1")
    model_id = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")
    
    client = boto3.client("bedrock-runtime", region_name=region)
    
    # Select system prompt
    system_prompt = SYSTEM_PROMPT_HI if language == "hi" else SYSTEM_PROMPT_EN
    system_prompt = system_prompt.replace("{context}", context)
    
    # Build messages from conversation history
    history = get_conversation(conversation_id)
    messages = []
    for msg in history[-10:]:  # Last 10 messages for context window
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
        })
    
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "system": system_prompt,
        "messages": messages,
    })
    
    try:
        response = client.invoke_model(
            modelId=model_id,
            body=body,
            contentType="application/json",
            accept="application/json",
        )
        result = json.loads(response["body"].read())
        return result["content"][0]["text"]
    except Exception as e:
        print(f"❌ Bedrock error: {e}")
        return _mock_generate(message, language, context, [])


def _mock_generate(
    message: str,
    language: str,
    context: str,
    retrieved_schemes: list[dict],
) -> str:
    """Mock AI response using keyword matching and templates."""
    msg_lower = message.lower()
    
    # Detect if asking about a specific scheme
    if retrieved_schemes:
        scheme = retrieved_schemes[0]
        name = scheme.get("name", "this scheme")
        
        if language == "hi":
            return _mock_hindi_response(msg_lower, scheme)
        else:
            return _mock_english_response(msg_lower, scheme)
    
    # Generic responses when no scheme matched
    if language == "hi":
        return _generic_hindi(msg_lower)
    else:
        return _generic_english(msg_lower)


def _mock_english_response(query: str, scheme: dict) -> str:
    name = scheme.get("name", "this scheme")
    desc = scheme.get("description", "")
    eligibility = scheme.get("eligibility", [])
    docs = scheme.get("documents_required", [])
    steps = scheme.get("application_steps", [])
    benefit = scheme.get("benefit_amount", "")
    website = scheme.get("website", "")
    
    # Check what kind of info they want
    if any(w in query for w in ["eligible", "eligibility", "qualify", "who can", "can i"]):
        elig_text = "\n".join([f"  • {e}" for e in eligibility]) if eligibility else "  • Information not available"
        return f"""**{name} — Eligibility**

You may be eligible for {name} if:
{elig_text}

Would you like to know what documents you'll need, or how to apply?"""
    
    if any(w in query for w in ["document", "papers", "proof", "what do i need"]):
        docs_text = "\n".join([f"  • {d}" for d in docs]) if docs else "  • Information not available"
        return f"""**{name} — Documents Required**

You'll need these documents:
{docs_text}

Would you like me to explain how to apply step by step?"""
    
    if any(w in query for w in ["apply", "how to", "steps", "process", "register"]):
        steps_text = "\n".join([f"  {i+1}. {s}" for i, s in enumerate(steps)]) if steps else "  1. Information not available"
        return f"""**{name} — How to Apply**

Follow these steps:
{steps_text}

{f'You can visit: {website}' if website else ''}

Would you like to know anything else about this scheme?"""
    
    # Default: give overview
    return f"""**{name}**

{desc}

💰 **Benefit:** {benefit}

Here's what I can help you with:
• Check if you're eligible
• List of documents needed
• Step-by-step application process

What would you like to know?"""


def _mock_hindi_response(query: str, scheme: dict) -> str:
    name = scheme.get("name_hi", scheme.get("name", "इस योजना"))
    desc = scheme.get("description_hi", scheme.get("description", ""))
    eligibility = scheme.get("eligibility_hi", scheme.get("eligibility", []))
    docs = scheme.get("documents_required_hi", scheme.get("documents_required", []))
    steps = scheme.get("application_steps_hi", scheme.get("application_steps", []))
    benefit = scheme.get("benefit_amount", "")
    
    if any(w in query for w in ["पात्र", "eligible", "eligibility", "योग्य", "कौन", "who"]):
        elig_text = "\n".join([f"  • {e}" for e in eligibility]) if eligibility else "  • जानकारी उपलब्ध नहीं"
        return f"""**{name} — पात्रता**

आप {name} के लिए पात्र हो सकते हैं यदि:
{elig_text}

क्या आप जानना चाहेंगे कि कौन से दस्तावेज़ चाहिए या आवेदन कैसे करें?"""
    
    if any(w in query for w in ["दस्तावेज", "document", "कागज़", "papers"]):
        docs_text = "\n".join([f"  • {d}" for d in docs]) if docs else "  • जानकारी उपलब्ध नहीं"
        return f"""**{name} — आवश्यक दस्तावेज़**

आपको ये दस्तावेज़ चाहिए होंगे:
{docs_text}

क्या आप चरण-दर-चरण आवेदन प्रक्रिया जानना चाहेंगे?"""
    
    if any(w in query for w in ["आवेदन", "apply", "कैसे", "how", "steps", "प्रक्रिया"]):
        steps_text = "\n".join([f"  {i+1}. {s}" for i, s in enumerate(steps)]) if steps else "  1. जानकारी उपलब्ध नहीं"
        return f"""**{name} — आवेदन कैसे करें**

इन चरणों का पालन करें:
{steps_text}

क्या आप इस योजना के बारे में कुछ और जानना चाहेंगे?"""
    
    return f"""**{name}**

{desc}

💰 **लाभ:** {benefit}

मैं इनमें आपकी मदद कर सकता हूँ:
• पात्रता जाँचें
• आवश्यक दस्तावेज़ों की सूची
• चरण-दर-चरण आवेदन प्रक्रिया

आप क्या जानना चाहेंगे?"""


def _generic_english(query: str) -> str:
    if any(w in query for w in ["hello", "hi", "hey", "namaste"]):
        return """🙏 **Namaste! Welcome to YOJANASETU**

I'm your government services assistant. I can help you with:
• **Government schemes** — PM-KISAN, Ayushman Bharat, and more
• **Education** — Scholarships and skill programs
• **Healthcare** — Health insurance and benefits
• **Employment** — Job schemes and training programs
• **Housing** — Pradhan Mantri Awas Yojana and more

Just tell me what you need help with! You can say something like:
*"Tell me about PM-KISAN"* or *"Am I eligible for Ayushman Bharat?"*"""
    
    if any(w in query for w in ["scheme", "yojana", "government", "sarkari"]):
        return """I can help you find the right government scheme! To give you the best information, could you tell me:

1. **What type of help** are you looking for? (farming, health, education, job, housing)
2. **Who is it for?** (yourself, family member, etc.)

For example, you can say: *"I'm a farmer looking for financial help"* or *"I need health insurance for my family"*"""
    
    return """I'd be happy to help you! I can assist with:

• **Government Schemes** — Find schemes you're eligible for
• **Application Help** — Step-by-step guidance to apply
• **Document Info** — What papers you'll need

Could you tell me more about what you're looking for? For example:
*"What schemes are available for farmers?"*
*"How do I apply for Ayushman Bharat?"*
*"What documents do I need for PM-KISAN?"*"""


def _generic_hindi(query: str) -> str:
    if any(w in query for w in ["hello", "hi", "hey", "namaste", "नमस्ते", "हेलो"]):
        return """🙏 **नमस्ते! YOJANASETU में आपका स्वागत है**

मैं आपका सरकारी सेवा सहायक हूँ। मैं इनमें मदद कर सकता हूँ:
• **सरकारी योजनाएं** — पीएम-किसान, आयुष्मान भारत, और बहुत कुछ
• **शिक्षा** — छात्रवृत्ति और कौशल कार्यक्रम
• **स्वास्थ्य** — स्वास्थ्य बीमा और लाभ
• **रोजगार** — नौकरी योजनाएं और प्रशिक्षण
• **आवास** — प्रधानमंत्री आवास योजना और अधिक

बस बताइए आपको किस चीज़ में मदद चाहिए!"""
    
    return """मैं आपकी मदद करने के लिए तैयार हूँ! मैं इनमें सहायता कर सकता हूँ:

• **सरकारी योजनाएं** — आपके लिए उपयुक्त योजनाएं खोजें
• **आवेदन सहायता** — चरण-दर-चरण मार्गदर्शन
• **दस्तावेज़ जानकारी** — कौन से कागज़ात चाहिए

कृपया बताइए आप क्या जानना चाहते हैं? उदाहरण के लिए:
*"किसानों के लिए कौन सी योजनाएं हैं?"*
*"आयुष्मान भारत के लिए कैसे आवेदन करें?"*"""
