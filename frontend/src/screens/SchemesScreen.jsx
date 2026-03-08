import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Search, Globe } from 'lucide-react'
import { getSchemes, getCategories } from '../services/api'

const CATEGORY_ICONS = {
  agriculture: '🌾',
  health: '🏥',
  education: '📚',
  employment: '💼',
  housing: '🏠',
  women: '👩',
  social: '🛡️',
  finance: '💰',
}

export default function SchemesScreen({ language, setLanguage }) {
  const navigate = useNavigate()
  const [schemes, setSchemes] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const t = {
    en: {
      title: 'Government Schemes',
      subtitle: 'Browse schemes by category',
      all: 'All',
      search: 'Search schemes...',
      askAbout: 'Ask AI',
      noResults: 'No schemes found. Try a different category or search.',
      toggleLang: 'हिंदी',
    },
    hi: {
      title: 'सरकारी योजनाएं',
      subtitle: 'श्रेणी के अनुसार योजनाएं देखें',
      all: 'सभी',
      search: 'योजनाएं खोजें...',
      askAbout: 'AI से पूछें',
      noResults: 'कोई योजना नहीं मिली। अलग श्रेणी या खोज आज़माएं।',
      toggleLang: 'EN',
    }
  }
  const text = t[language] || t.en

  useEffect(() => {
    loadData()
  }, [activeCategory, language])

  async function loadData() {
    setLoading(true)
    try {
      const [schemesRes, catsRes] = await Promise.all([
        getSchemes(activeCategory, language),
        getCategories(),
      ])
      setSchemes(schemesRes.schemes || [])
      setCategories(catsRes.categories || [])
    } catch (err) {
      console.error('Failed to load schemes:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSchemes = search
    ? schemes.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
      )
    : schemes

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-saffron to-orange-500 text-white px-4 py-4 shadow-md">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-1 hover:bg-white/20 rounded-lg transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-bold text-lg leading-tight">{text.title}</h1>
              <p className="text-[11px] text-orange-100">{text.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium hover:bg-white/30 transition shrink-0"
          >
            <Globe size={12} />
            {text.toggleLang}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-200" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={text.search}
            className="w-full pl-9 pr-4 py-2 bg-white/20 rounded-lg text-sm placeholder-orange-200 focus:outline-none focus:bg-white/30 transition"
          />
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-[120px] z-10 bg-white border-b border-gray-100 px-4 py-2 overflow-x-auto flex gap-2 no-scrollbar">
        <button
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
            !activeCategory ? 'bg-saffron text-white' : 'bg-gray-100 text-gray-600 hover:bg-orange-50'
          }`}
        >
          {text.all}
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1 ${
              activeCategory === cat.id ? 'bg-saffron text-white' : 'bg-gray-100 text-gray-600 hover:bg-orange-50'
            }`}
          >
            {CATEGORY_ICONS[cat.id] || '📋'}
            {language === 'hi' ? cat.name_hi : cat.name}
          </button>
        ))}
      </div>

      {/* Schemes List */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading...</p>
          </div>
        ) : filteredSchemes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">{text.noResults}</p>
          </div>
        ) : (
          filteredSchemes.map(scheme => (
            <div
              key={scheme.scheme_id}
              onClick={() => navigate(`/schemes/${scheme.scheme_id}`)}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-orange-200 transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 bg-orange-50 rounded-lg flex items-center justify-center text-lg">
                  {CATEGORY_ICONS[scheme.category] || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 leading-tight">{scheme.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{scheme.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">
                      {scheme.benefit_amount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB: Chat */}
      <button
        onClick={() => navigate('/chat')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-saffron to-orange-500 text-white rounded-full shadow-lg shadow-orange-200 flex items-center justify-center hover:shadow-xl transition active:scale-95"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  )
}
