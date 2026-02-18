import Link from 'next/link'
import { Home, Shield, Heart, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <Home className="text-brand-500" size={32} />
            <span className="text-2xl font-bold text-gray-900">Dwella</span>
          </div>
          <div className="flex gap-4">
            <Link 
              href="/auth/login" 
              className="px-4 py-2 text-brand-600 hover:text-brand-700"
            >
              Log in
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Sign up
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Dwell Better, Pay Smarter
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Nigeria's verified roommate-matching platform. Find compatible room shares 
            in better neighborhoods at affordable prices.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/signup?role=seeker"
              className="px-8 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-semibold"
            >
              Find a Room
            </Link>
            <Link 
              href="/signup?role=host"
              className="px-8 py-3 border-2 border-brand-500 text-brand-600 rounded-lg hover:bg-brand-50 font-semibold"
            >
              List Your Room
            </Link>
          </div>
        </div>
      </header>

      {/* Trust Badges */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-brand-600" size={32} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Verified Profiles</h3>
              <p className="text-gray-600">
                Mandatory ID verification for all users. No contact sharing until both parties are verified.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-brand-600" size={32} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Smart Matching</h3>
              <p className="text-gray-600">
                Compatibility-first algorithm matches you based on lifestyle, schedule, and house rules.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-brand-600" size={32} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Safe Communication</h3>
              <p className="text-gray-600">
                Chat in-app before revealing contacts. Payment-protected contact unlock with refund policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Dwella Works</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              {/* For Seekers */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-brand-600">For Room Seekers</h3>
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
                    <span>Sign up and complete mandatory verification</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
                    <span>Set your preferences and get personalized matches</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
                    <span>Chat with hosts in-app to assess compatibility</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
                    <span>Unlock contact safely to schedule viewings</span>
                  </li>
                </ol>
              </div>

              {/* For Hosts */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-brand-600">For Hosts</h3>
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
                    <span>Verify your identity and create your listing</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
                    <span>Set your house rules and preferences clearly</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
                    <span>Review verified seekers who match your criteria</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
                    <span>Approve contact unlock and schedule viewings</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to find your perfect match?</h2>
          <p className="text-xl mb-8 text-brand-50">Join Dwella today and access verified roommates in your area</p>
          <Link 
            href="/auth/signup"
            className="inline-block px-8 py-3 bg-white text-brand-600 rounded-lg hover:bg-gray-100 font-semibold"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 Dwella. All rights reserved.</p>
          <div className="flex gap-6 justify-center mt-4">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/safety" className="hover:text-white">Safety</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
