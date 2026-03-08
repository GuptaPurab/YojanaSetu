const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export async function sendMessage(message, language = 'en', conversationId = null) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      language,
      conversation_id: conversationId,
    }),
  })
  if (!response.ok) throw new Error('Chat request failed')
  return response.json()
}

export async function getSchemes(category = null, language = 'en') {
  const params = new URLSearchParams({ language })
  if (category) params.append('category', category)
  const response = await fetch(`${API_BASE}/schemes?${params}`)
  if (!response.ok) throw new Error('Failed to fetch schemes')
  return response.json()
}

export async function getSchemeById(id, language = 'en') {
  const response = await fetch(`${API_BASE}/schemes/${id}?language=${language}`)
  if (!response.ok) throw new Error('Failed to fetch scheme')
  return response.json()
}

export async function getCategories() {
  const response = await fetch(`${API_BASE}/categories`)
  if (!response.ok) throw new Error('Failed to fetch categories')
  return response.json()
}

export async function textToSpeech(text, language = 'en') {
  const response = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  })
  if (!response.ok) throw new Error('TTS request failed')
  return response.json()
}
