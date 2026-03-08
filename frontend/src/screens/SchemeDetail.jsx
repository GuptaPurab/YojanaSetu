import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, CheckCircle, FileText, ClipboardList, Globe, ExternalLink } from 'lucide-react'
import { getSchemeById } from '../services/api'

export default function SchemeDetail({ language, setLanguage }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scheme, setScheme] = useState(null)
  const [loading, setLoading] = useState(true)

  const t = {
    en: {
      back: 'Back',
      eligibility: 'Eligibility',
      documents: 'Documents Required',
      howToApply: 'How to Apply',
      benefit: 'Benefit',
      ministry: 'Ministry',
      website: 'Official Website',
      askAI: 'Ask AI about this scheme',
      loading: 'Loading...',
      notFound: 'Scheme not found',
      toggleLang: 'हिंदी',
    },
    hi: {
      back: 'वापस',
      eligibility: 'पात्रता',
      documents: 'आवश्यक दस्तावेज़',
      howToApply: 'आवेदन कैसे करें',
      benefit: 'लाभ',
      ministry: 'मंत्रालय',
      website: 'आधिकारिक वेबसाइट',
      askAI: 'इस योजना के बारे में AI से पूछें',
      loading: 'लोड हो रहा है...',
      notFound: 'योजना नहीं मिली',
      toggleLang: 'EN',
    }
  }
  const text = t[language] || t.en

  useEffect(() => {
    loadScheme()
  }, [id, language])

  async function loadScheme() {
    setLoading(true)
    try {
      const data = await getSchemeById(id, language)
      setScheme(data)
    } catch (err) {
      console.error('Failed to load scheme:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">{text.loading}</p>
        </div>
      </div>
    )
  }

  if (!scheme) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-sm">{text.notFound}</p>
          <button onClick={() => navigate('/schemes')} className="text-saffron text-sm mt-2 underline">
            ← Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-saffron to-orange-500 text-white px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/schemes')} className="flex items-center gap-2 text-sm text-orange-100 hover:text-white transition">
            <ArrowLeft size={16} />
            {text.back}
          </button>
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium hover:bg-white/30 transition"
          >
            <Globe size={12} />
            {text.toggleLang}
          </button>
        </div>
        <h1 className="font-bold text-xl leading-tight">{scheme.name}</h1>
        <p className="text-sm text-orange-100 mt-2 leading-relaxed">{scheme.description}</p>
      </header>

      {/* Content */}
      <div className="px-4 py-4 space-y-5">
        {/* Benefit Badge */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
            💰
          </div>
          <div>
            <p className="text-[11px] text-green-600 font-medium uppercase">{text.benefit}</p>
            <p className="text-sm font-semibold text-green-800">{scheme.benefit_amount}</p>
          </div>
        </div>

        {/* Eligibility */}
        <Section
          icon={<CheckCircle size={18} className="text-saffron" />}
          title={text.eligibility}
          items={scheme.eligibility}
        />

        {/* Documents */}
        <Section
          icon={<FileText size={18} className="text-saffron" />}
          title={text.documents}
          items={scheme.documents_required}
        />

        {/* How to Apply */}
        <Section
          icon={<ClipboardList size={18} className="text-saffron" />}
          title={text.howToApply}
          items={scheme.application_steps}
          numbered
        />

        {/* Ministry & Website */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          {scheme.ministry && (
            <div className="flex items-center gap-2 text-sm">
              <Globe size={14} className="text-gray-400 shrink-0" />
              <span className="text-gray-500">{text.ministry}:</span>
              <span className="text-gray-800 font-medium">{scheme.ministry}</span>
            </div>
          )}
          {scheme.website && (
            <a
              href={scheme.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-saffron hover:text-orange-700 transition"
            >
              <ExternalLink size={14} />
              {text.website}
            </a>
          )}
        </div>
      </div>

      {/* Ask AI Button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
        <button
          onClick={() => {
            const query = language === 'hi'
              ? `मुझे ${scheme.name} के बारे में बताइए`
              : `Tell me about ${scheme.name}`
            navigate('/chat', { state: { prefill: query } })
          }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-saffron to-orange-500 text-white rounded-xl font-medium shadow-md shadow-orange-200 hover:shadow-lg transition active:scale-[0.98]"
        >
          <MessageCircle size={18} />
          {text.askAI}
        </button>
      </div>
    </div>
  )
}

function Section({ icon, title, items, numbered = false }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="font-semibold text-sm text-gray-800">{title}</h2>
      </div>
      <div className="space-y-1.5 pl-7">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-saffron shrink-0 mt-0.5 text-xs font-medium">
              {numbered ? `${i + 1}.` : '•'}
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
