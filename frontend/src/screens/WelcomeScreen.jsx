import { useNavigate } from 'react-router-dom'
import { Mic, Globe, MessageCircle, ArrowRight } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', label: 'English', labelNative: 'English' },
  { code: 'hi', label: 'Hindi', labelNative: 'हिंदी' },
]

export default function WelcomeScreen({ language, setLanguage }) {
  const navigate = useNavigate()

  const t = {
    en: {
      tagline: 'Your Voice, Your Rights',
      subtitle: 'Ask about government schemes, education, healthcare & jobs — just by speaking',
      selectLang: 'Choose your language',
      start: 'Start Talking',
      browse: 'Browse Schemes',
      features: [
        { icon: '🎙️', title: 'Voice First', desc: 'Just speak your question' },
        { icon: '🌐', title: 'Your Language', desc: 'Hindi & English supported' },
        { icon: '🤖', title: 'AI Powered', desc: 'Smart, simple answers' },
      ],
    },
    hi: {
      tagline: 'आपकी आवाज़, आपके अधिकार',
      subtitle: 'सरकारी योजनाओं, शिक्षा, स्वास्थ्य और नौकरियों के बारे में पूछें — बस बोलकर',
      selectLang: 'अपनी भाषा चुनें',
      start: 'बात शुरू करें',
      browse: 'योजनाएं देखें',
      features: [
        { icon: '🎙️', title: 'आवाज़ पहले', desc: 'बस अपना सवाल बोलें' },
        { icon: '🌐', title: 'आपकी भाषा', desc: 'हिंदी और अंग्रेजी' },
        { icon: '🤖', title: 'AI संचालित', desc: 'स्मार्ट, सरल जवाब' },
      ],
    },
  }

  const text = t[language] || t.en

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Logo & Branding */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-saffron to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
          <span className="text-white text-2xl font-bold">YS</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          YOJANA<span className="text-saffron">SETU</span>
        </h1>
        <p className="text-lg text-orange-700 font-medium mt-1">{text.tagline}</p>
        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">{text.subtitle}</p>
      </div>

      {/* Language Selector */}
      <div className="mb-8">
        <p className="text-xs text-gray-400 text-center mb-2 uppercase tracking-wider">{text.selectLang}</p>
        <div className="flex gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all
                ${language === lang.code
                  ? 'bg-saffron text-white shadow-md shadow-orange-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
                }
              `}
            >
              <Globe size={16} />
              {lang.labelNative}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="flex gap-4 mb-8 max-w-sm w-full">
        {text.features.map((f, i) => (
          <div key={i} className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">{f.icon}</div>
            <div className="text-xs font-semibold text-gray-800">{f.title}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-saffron to-orange-500 text-white rounded-xl font-semibold text-base shadow-lg shadow-orange-200 hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <Mic size={20} />
          {text.start}
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => navigate('/schemes')}
          className="flex items-center justify-center gap-2 w-full py-3 bg-white text-gray-700 rounded-xl font-medium text-sm border border-gray-200 hover:border-orange-300 hover:text-saffron transition-all"
        >
          <MessageCircle size={16} />
          {text.browse}
        </button>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-gray-400 mt-8 text-center">
        Powered by Amazon Bedrock & AWS • Prototype Demo
      </p>
    </div>
  )
}
