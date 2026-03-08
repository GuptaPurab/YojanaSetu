import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mic, Send, Volume2, VolumeX, ArrowLeft, Loader2, BookOpen, Globe } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { sendMessage } from '../services/api'
import { startListening, speakWithFallback, stopSpeaking, isSpeechRecognitionSupported } from '../services/voice'

export default function ChatScreen({ language, setLanguage }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const t = {
    en: {
      placeholder: 'Type your question or tap the mic...',
      listening: 'Listening... speak now',
      thinking: 'Thinking...',
      back: 'Back',
      schemes: 'Schemes',
      welcome: '🙏 Namaste! I\'m **YOJANASETU**, your government services assistant. I can help you with:\n\n• **Government schemes** — PM-KISAN, Ayushman Bharat & more\n• **Eligibility** — Check if you qualify\n• **Application steps** — How to apply\n• **Documents** — What you need\n\nJust **speak** or **type** your question!',
      micError: 'Microphone not supported. Please type your question.',
      listen: 'Listen',
      stop: 'Stop',
    },
    hi: {
      placeholder: 'अपना सवाल टाइप करें या माइक दबाएं...',
      listening: 'सुन रहे हैं... अब बोलें',
      thinking: 'सोच रहे हैं...',
      back: 'वापस',
      schemes: 'योजनाएं',
      welcome: '🙏 नमस्ते! मैं **YOJANASETU** हूँ, आपका सरकारी सेवा सहायक। मैं इनमें मदद कर सकता हूँ:\n\n• **सरकारी योजनाएं** — पीएम-किसान, आयुष्मान भारत और अधिक\n• **पात्रता** — जांचें कि क्या आप योग्य हैं\n• **आवेदन चरण** — कैसे आवेदन करें\n• **दस्तावेज़** — आपको क्या चाहिए\n\nबस **बोलें** या **टाइप** करें!',
      micError: 'माइक्रोफोन समर्थित नहीं है। कृपया टाइप करें।',
      listen: 'सुनें',
      stop: 'रोकें',
    }
  }
  const text = t[language] || t.en

  // Show welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: text.welcome,
        timestamp: new Date().toISOString(),
      }])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle prefilled query from SchemeDetail "Ask AI" button
  useEffect(() => {
    if (location.state?.prefill) {
      handleSend(location.state.prefill)
      window.history.replaceState({}, '')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async (messageText = null) => {
    const msg = messageText || input.trim()
    if (!msg || isLoading) return

    const userMessage = { role: 'user', content: msg, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const result = await sendMessage(msg, language, conversationId)
      setConversationId(result.conversation_id)

      const aiMessage = {
        role: 'assistant',
        content: result.response,
        sources: result.sources,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMessage])

      // Auto-speak the AI response in the selected language
      setIsSpeaking(true)
      try {
        await speakWithFallback(result.response, language)
      } catch (e) {
        console.error('Auto-speak error:', e)
      } finally {
        setIsSpeaking(false)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMsg = {
        role: 'assistant',
        content: language === 'hi'
          ? '❌ क्षमा करें, कुछ गड़बड़ हो गई। कृपया दोबारा प्रयास करें।'
          : '❌ Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceInput = async () => {
    if (!isSpeechRecognitionSupported()) {
      alert(text.micError)
      return
    }

    setIsListening(true)
    try {
      const transcript = await startListening(language)
      if (transcript) {
        setInput(transcript)
        await handleSend(transcript)
      }
    } catch (error) {
      console.error('Voice error:', error)
    } finally {
      setIsListening(false)
    }
  }

  const handleSpeak = async (msgText) => {
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
      return
    }
    setIsSpeaking(true)
    try {
      await speakWithFallback(msgText, language)
    } catch (e) {
      console.error('TTS error:', e)
    } finally {
      setIsSpeaking(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-saffron to-orange-500 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 hover:bg-white/20 rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-base leading-tight">YOJANASETU</h1>
            <p className="text-[10px] text-orange-100">AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium hover:bg-white/30 transition"
          >
            <Globe size={12} />
            {language === 'en' ? 'हिंदी' : 'EN'}
          </button>
          <button
            onClick={() => navigate('/schemes')}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium hover:bg-white/30 transition"
          >
            <BookOpen size={12} />
            {text.schemes}
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-orange-50/50 to-white">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-enter flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] rounded-2xl px-4 py-3 shadow-sm
                ${msg.role === 'user'
                  ? 'bg-saffron text-white rounded-br-md'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                }
              `}
            >
              {msg.role === 'assistant' ? (
                <div className="ai-message text-sm leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400">
                        📋 {msg.sources.join(' • ')}
                      </p>
                    </div>
                  )}
                  {/* Speak button */}
                  <button
                    onClick={() => handleSpeak(msg.content)}
                    className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 hover:text-saffron transition"
                  >
                    {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    {isSpeaking ? text.stop : text.listen}
                  </button>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start message-enter">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="typing-dot w-2 h-2 bg-saffron rounded-full inline-block" />
                  <span className="typing-dot w-2 h-2 bg-saffron rounded-full inline-block" />
                  <span className="typing-dot w-2 h-2 bg-saffron rounded-full inline-block" />
                </div>
                <span className="text-xs text-gray-400">{text.thinking}</span>
              </div>
            </div>
          </div>
        )}

        {/* Listening indicator */}
        {isListening && (
          <div className="flex justify-center message-enter">
            <div className="bg-orange-100 text-saffron rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              {text.listening}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={text.placeholder}
              disabled={isLoading || isListening}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30 disabled:opacity-50 transition"
            />
          </div>

          {/* Send Button */}
          {input.trim() && (
            <button
              onClick={() => handleSend()}
              disabled={isLoading}
              className="p-2.5 bg-saffron text-white rounded-xl hover:bg-orange-600 transition active:scale-95 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          )}

          {/* Mic Button */}
          <button
            onClick={handleVoiceInput}
            disabled={isLoading || isListening}
            className={`
              relative p-3 rounded-xl transition active:scale-95
              ${isListening
                ? 'bg-red-500 text-white mic-pulse'
                : 'bg-gradient-to-r from-saffron to-orange-500 text-white shadow-md shadow-orange-200 hover:shadow-lg'
              }
              disabled:opacity-50
            `}
          >
            {isListening ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Mic size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
