import { useNavigate } from 'react-router-dom'
import { WelcomeScreen } from '@/components/ui/onboarding-welcome-screen'

export default function OnboardingScreen() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto h-screen w-full max-w-md overflow-hidden bg-background">
      <WelcomeScreen
        imageUrl="https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80"
        title={
          <>
            Welcome To <span className="text-primary">YojanaSetu</span>
          </>
        }
        description="Discover government schemes, education, healthcare & jobs — just by speaking in your language."
        buttonText="Let's Get Started"
        onButtonClick={() => navigate('/welcome')}
        secondaryActionText={
          <>
            Want to explore? <span className="font-semibold text-primary">Browse Schemes</span>
          </>
        }
        onSecondaryActionClick={() => navigate('/schemes')}
      />
    </div>
  )
}
