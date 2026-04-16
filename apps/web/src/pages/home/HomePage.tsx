import { ArrowRight, Shield, Zap, Users, TrendingUp, MapPin, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function HomePage() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f0f0f] text-white' : 'bg-white text-black'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-[#0f0f0f]/80 border-white/7' : 'bg-white/80 border-gray-200'} backdrop-blur border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center hover:opacity-80 transition">
            <img src="/rentra_logo.png" alt="Rentra Logo" className="h-8 w-auto" />
          </Link>
          <div className="flex gap-2">
            <Link to="/login" className={`px-4 py-2 text-sm ${isDark ? 'border-white/7 hover:bg-white/5' : 'border-gray-400 hover:bg-gray-100'} border rounded-lg transition`}>Login</Link>
            <Link to="/register" className="px-4 py-2 text-sm bg-green-500 text-black rounded-lg hover:bg-green-400 transition font-semibold">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          Pakistan's <span className="text-green-400">Transparent</span> Rental Platform
        </h1>
        <p className={`text-lg ${isDark ? 'text-[#aaa]' : 'text-gray-600'} mb-8 max-w-2xl mx-auto`}>
          🏠 Secure rental agreements • 🤖 AI-powered verification • ⭐ Trust scores • 💰 Transparent payments
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/register" className="px-8 py-3 bg-green-500 text-black rounded-lg hover:bg-green-400 font-bold flex items-center gap-2 transition">
            Get Started <ArrowRight size={20} />
          </Link>
          <Link to="/login" className={`px-8 py-3 ${isDark ? 'border-white/7 hover:bg-white/5' : 'border-gray-400 hover:bg-gray-100'} border rounded-lg transition`}>
            Already a Member?
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className={`text-4xl font-bold text-center mb-16 ${isDark ? 'text-white' : 'text-black'}`}>Why Choose Rentra?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: <Shield size={32} />, title: 'Secure Agreements', desc: 'Legally binding digital contracts for protected transactions' },
            { icon: <Zap size={32} />, title: 'AI Verification', desc: 'Advanced AI technology to detect fraudulent listings instantly' },
            { icon: <Users size={32} />, title: 'Trust Scores', desc: 'Verified ratings for landlords and tenants based on history' },
            { icon: <TrendingUp size={32} />, title: 'Fair Pricing', desc: 'Data-driven rent estimates for transparent market rates' },
            { icon: <MapPin size={32} />, title: 'Multi-City Coverage', desc: 'Serving properties across all major cities nationwide' },
            { icon: <Home size={32} />, title: 'Easy Posting', desc: 'List your property in just minutes with our simple interface' },
          ].map((item, i) => (
            <div key={i} className={`p-6 border rounded-xl transition ${isDark ? 'border-white/10 hover:bg-[#1f1f1f]' : 'border-gray-300 hover:bg-gray-50'}`}>
              <div className="text-green-500 mb-4">{item.icon}</div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</h3>
              <p className={`${isDark ? 'text-[#555]' : 'text-gray-600'}`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className={`py-20 px-4 rounded-2xl max-w-4xl mx-auto mb-20 ${isDark ? 'bg-[#1f1f1f]' : 'bg-gray-50'}`}>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-green-500 mb-2">5000+</div>
            <p className={`${isDark ? 'text-[#555]' : 'text-gray-600'}`}>Listings</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-500 mb-2">2000+</div>
            <p className={`${isDark ? 'text-[#555]' : 'text-gray-600'}`}>Users</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-500 mb-2">98%</div>
            <p className={`${isDark ? 'text-[#555]' : 'text-gray-600'}`}>Verified</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 text-center max-w-2xl mx-auto">
        <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Ready to Get Started?</h2>
        <p className={`mb-8 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>Create your account today and experience transparent, secure rental transactions</p>
        <Link to="/register" className="inline-block px-8 py-3 bg-green-500 text-black rounded-lg hover:bg-green-400 font-bold transition">
          Create Your Account →
        </Link>
      </section>

      {/* Footer */}
      <footer className={`border-t py-8 text-center text-sm ${isDark ? 'border-white/7 text-[#555]' : 'border-gray-300 text-gray-500'}`}>
        <p>© 2026 Rentra - Pakistan's Transparent Rental Platform</p>
      </footer>
    </div>
  );
}
