/**
 * Voice service — handles browser-based speech recognition and synthesis.
 * TTS: calls backend /api/tts first (Amazon Polly in AWS mode), falls back to browser.
 * STT: uses browser Web Speech API with correct hi-IN / en-IN language codes.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function isSpeechSynthesisSupported() {
  return !!window.speechSynthesis
}

/**
 * Start listening for voice input.
 * Returns a promise that resolves with the transcript.
 */
export function startListening(language = 'en') {
  return new Promise((resolve, reject) => {
    if (!isSpeechRecognitionSupported()) {
      reject(new Error('Speech recognition not supported in this browser'))
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      resolve(transcript)
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        reject(new Error('No speech detected. Please try again.'))
      } else if (event.error === 'not-allowed') {
        reject(new Error('Microphone access denied. Please enable microphone.'))
      } else {
        reject(new Error(`Speech recognition error: ${event.error}`))
      }
    }

    recognition.onend = () => {}

    recognition.start()
    resolve.__recognition = recognition
  })
}

/**
 * Speak text via the backend TTS endpoint (Amazon Polly in AWS mode).
 * Falls back to browser speech synthesis if Polly is unavailable.
 */
export async function speakWithFallback(text, language = 'en') {
  // Stop any ongoing speech first
  stopSpeaking()

  try {
    const res = await fetch(`${API_BASE}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    })

    if (res.ok) {
      const data = await res.json()

      // AWS Polly path — play the base64 MP3
      if (!data.use_browser_tts && data.audio_base64) {
        const byteChars = atob(data.audio_base64)
        const byteNums = new Uint8Array(byteChars.length)
        for (let i = 0; i < byteChars.length; i++) {
          byteNums[i] = byteChars.charCodeAt(i)
        }
        const blob = new Blob([byteNums], { type: data.content_type || 'audio/mpeg' })
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        return new Promise((resolve, reject) => {
          audio.onended = () => { URL.revokeObjectURL(url); resolve() }
          audio.onerror = reject
          audio.play()
        })
      }

      // Mock/fallback path — backend says to use browser TTS
      return _browserSpeak(data.text || text, data.language || (language === 'hi' ? 'hi-IN' : 'en-IN'))
    }
  } catch (_) {
    // Network error or backend down — fall back to browser TTS silently
  }

  return _browserSpeak(text, language === 'hi' ? 'hi-IN' : 'en-IN')
}

/**
 * Internal: speak via browser Web Speech Synthesis API.
 */
function _browserSpeak(text, langCode = 'en-IN') {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisSupported()) {
      resolve() // fail silently
      return
    }

    window.speechSynthesis.cancel()

    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/[•\-]\s/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\n+/g, '. ')
      .trim()

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = langCode
    utterance.rate = 0.9
    utterance.pitch = 1.0

    const voices = window.speechSynthesis.getVoices()
    const targetPrefix = langCode.startsWith('hi') ? 'hi' : 'en'
    const voice = voices.find(v => v.lang.startsWith(targetPrefix)) || voices.find(v => v.lang.startsWith('en'))
    if (voice) utterance.voice = voice

    utterance.onend = resolve
    utterance.onerror = () => resolve() // fail silently so UI doesn't break

    window.speechSynthesis.speak(utterance)
  })
}

/**
 * Stop any ongoing speech (both browser and audio element).
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel()
  }
}

// Keep legacy export for any direct callers
export const speak = _browserSpeak
