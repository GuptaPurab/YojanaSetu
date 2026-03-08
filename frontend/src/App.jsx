import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import OnboardingScreen from './screens/OnboardingScreen'
import WelcomeScreen from './screens/WelcomeScreen'
import ChatScreen from './screens/ChatScreen'
import SchemesScreen from './screens/SchemesScreen'
import SchemeDetail from './screens/SchemeDetail'

function App() {
  const [language, setLanguage] = useState('en')

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <Routes>
          <Route path="/" element={<OnboardingScreen />} />
          <Route path="/welcome" element={<WelcomeScreen language={language} setLanguage={setLanguage} />} />
          <Route path="/chat" element={<ChatScreen language={language} setLanguage={setLanguage} />} />
          <Route path="/schemes" element={<SchemesScreen language={language} setLanguage={setLanguage} />} />
          <Route path="/schemes/:id" element={<SchemeDetail language={language} setLanguage={setLanguage} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
