import { useState } from 'react';
import { ArrowRight, Shield, Zap, Users, TrendingUp, MapPin, Home, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function HomePage() {
  const { isDark } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f0f0f] text-white' : 'bg-white text-black'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition ${isDark ? 'bg-[#0f0f0f]/40 border-white/5' : 'bg-white/40 border-gray-300/20'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition group">
            <img src="/logo.jpeg" alt="Rentra Logo" className="w-10 h-10 rounded-lg object-cover shadow-lg group-hover:shadow-green-500/50 transition" />
            <div>
              <div className="text-xl font-bold text-green-500">Rentra</div>
              <div className="text-[10px] text-green-400/70 font-semibold tracking-wider">AI RENTAL</div>
            </div>
          </Link>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className={`text-sm font-medium hover:text-green-400 transition ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Features</a>
            <a href="#how-it-works" className={`text-sm font-medium hover:text-green-400 transition ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>How It Works</a>
            <a href="#pricing" className={`text-sm font-medium hover:text-green-400 transition ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Pricing</a>
            <a href="#faq" className={`text-sm font-medium hover:text-green-400 transition ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>FAQ</a>
            <Link to="/contact" className={`text-sm font-medium hover:text-green-400 transition ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Contact</Link>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className={`px-4 py-2 text-sm font-medium rounded-lg transition backdrop-blur ${isDark ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10' : 'bg-black/10 hover:bg-black/20 text-black border border-black/10'}`}>Login</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-green-500 text-black rounded-lg hover:bg-green-400 transition shadow-lg hover:shadow-green-500/50">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4 text-center max-w-3xl mx-auto relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 -z-10">
          <div className={`absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30 ${isDark ? 'bg-green-500' : 'bg-green-400'} animate-pulse`}></div>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight bg-gradient-to-r from-green-400 via-green-500 to-green-400 bg-clip-text text-transparent">
          Pakistan's First <br /> AI-Powered Rental Platform
        </h1>
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-5 max-w-2xl mx-auto leading-relaxed`}>
          Fake listing detection, AI trust scores, and digital agreements for secure, transparent renting. Protecting tenants and landlords across Pakistan's rental market.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/register" className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-black rounded-lg hover:shadow-xl hover:shadow-green-500/50 font-semibold flex items-center gap-2 text-sm transition duration-300 transform hover:scale-105">
            Find a Home <ArrowRight size={16} />
          </Link>
          <button className={`px-6 py-2 backdrop-blur-xl rounded-lg font-semibold text-sm transition duration-300 transform hover:scale-105 ${isDark ? 'bg-white/10 border border-white/20 hover:bg-white/20 text-white' : 'bg-black/10 border border-black/20 hover:bg-black/20 text-black'}`}>
            📌 List Your Property
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-10 px-4 backdrop-blur-xl relative overflow-hidden ${isDark ? 'bg-gradient-to-b from-green-500/5 to-transparent' : 'bg-gradient-to-b from-green-400/5 to-transparent'}`}>
        <div className="absolute inset-0 -z-10">
          <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDark ? 'bg-green-500' : 'bg-green-400'}`}></div>
          <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDark ? 'bg-green-500' : 'bg-green-400'}`}></div>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-6 text-center relative">
          {[
            { num: '1,284+', label: 'Active Listings' },
            { num: '47', label: 'Fake Listings Blocked' },
            { num: '328', label: 'Agreements Signed' },
            { num: '4,821', label: 'Verified Users' },
          ].map((stat, i) => (
            <div key={i} className={`p-4 rounded-2xl backdrop-blur-md transition transform hover:scale-110 hover:shadow-2xl ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-black/5 border border-black/10 hover:bg-black/10'}`}>
              <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent mb-1">{stat.num}</div>
              <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problems Section */}
      <section id="problems" className="py-12 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-3">Why Rentra?</h2>
        <p className={`text-center mb-10 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
          Pakistan's rental market faces critical challenges. We're here to solve them.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: '🖼️', title: 'Fake Listings', desc: 'Unverified properties and photoshopped images waste time and money' },
            { icon: '📄', title: 'No Written Agreements', desc: 'Most rentals lack formal documentation, leading to disputes' },
            { icon: '🔍', title: 'No Tenant Verification', desc: 'Landlords have no way to verify tenant reliability' },
            { icon: '💰', title: 'No Payment Proof', desc: 'Cash payments with no records create conflicts' },
            { icon: '⚖️', title: 'No Dispute Resolution', desc: 'Disagreements escalate to costly legal battles' },
            { icon: '🚫', title: 'Market Opacity', desc: 'No standardized pricing or transparent market data' },
          ].map((item, i) => (
            <div key={i} className={`p-4 border-l-4 border-red-500 rounded ${isDark ? 'bg-[#1a2332]' : 'bg-gray-50'}`}>
              <div className="text-2xl mb-1">{item.icon}</div>
              <h3 className="font-bold mb-1 text-sm">{item.title}</h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 px-4 max-w-5xl mx-auto relative">
        <h2 className="text-2xl font-bold text-center mb-3 bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">Powerful Features</h2>
        <p className={`text-center mb-10 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
          Everything you need for safe, transparent renting.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: '🤖', title: 'AI Fake Listing Detector', desc: 'Our AI analyzes images and details to instantly flag suspicious listings' },
            { icon: '⭐', title: 'Bidirectional Trust Scores', desc: 'Transparent trust ratings for both tenants and landlords' },
            { icon: '📋', title: 'Digital Rent Agreements', desc: 'Generate legally compliant, digitally signed agreements in seconds' },
            { icon: '💵', title: 'AI Fair Rent Estimator', desc: 'Machine learning-powered rent suggestions based on market trends' },
            { icon: '📱', title: 'JazzCash & EasyPaisa Payments', desc: 'Secure, instant rent payments via Pakistan\'s leading mobile wallets' },
            { icon: '🛡️', title: 'In-App Dispute Resolution', desc: 'AI-mediated disputes resolved in days, not months' },
          ].map((item, i) => (
            <div key={i} className={`p-5 rounded-2xl backdrop-blur-xl border transition duration-300 transform hover:scale-105 hover:shadow-2xl group ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-green-500/50' : 'bg-black/5 border-black/10 hover:bg-black/10 hover:border-green-500/50'}`}>
              <div className="text-3xl mb-2 group-hover:scale-110 transition duration-300">{item.icon}</div>
              <h3 className="font-bold mb-1 text-green-400 group-hover:text-green-300 text-sm">{item.title}</h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={`py-12 px-4 ${isDark ? 'bg-[#1a2332]' : 'bg-gray-50'}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">How It Works</h2>
          <p className={`text-center mb-10 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Simple, transparent steps for tenants and landlords.
          </p>
          
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-lg font-bold mb-6 text-green-500">For Tenants</h3>
              {[
                { num: '1', title: 'Search & Apply', desc: 'Browse AI-verified listings and apply' },
                { num: '2', title: 'Sign Agreement', desc: 'Review and digitally sign rent agreement' },
                { num: '3', title: 'Pay Safely', desc: 'Pay rent via JazzCash/EasyPaisa' },
              ].map((step, i) => (
                <div key={i} className="mb-5 flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-black rounded-full flex items-center justify-center font-bold text-sm">{step.num}</div>
                  <div>
                    <h4 className="font-bold mb-0.5 text-sm">{step.title}</h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-6 text-green-500">For Landlords</h3>
              {[
                { num: '1', title: 'Post Property', desc: 'List your property with AI pricing' },
                { num: '2', title: 'Verify Tenant', desc: 'Screen applicants with trust scores' },
                { num: '3', title: 'Collect Rent', desc: 'Receive instant digital payments' },
              ].map((step, i) => (
                <div key={i} className="mb-5 flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-black rounded-full flex items-center justify-center font-bold text-sm">{step.num}</div>
                  <div>
                    <h4 className="font-bold mb-0.5 text-sm">{step.title}</h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-3">Simple, Transparent Pricing</h2>
        <p className={`text-center mb-10 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
          Choose the plan that fits your needs.
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: 'Free', period: 'For Tenants', price: 'Free', features: ['Browse all listings', 'View trust scores', 'Apply to properties', 'View AI recommendations'] },
            { name: 'Basic', period: 'For Landlords', price: 'Rs. 500', subprice: '/month', featured: true, features: ['Post up to 3 listings', 'AI pricing suggestions', 'Tenant screening', 'Digital agreements'] },
            { name: 'Pro', period: 'For Landlords', price: 'Rs. 1,200', subprice: '/month', features: ['Unlimited listings', 'Priority support 24/7', 'Advanced analytics', 'Dispute resolution access'] },
          ].map((plan, i) => (
            <div key={i} className={`p-5 border rounded-lg relative ${plan.featured ? `border-green-500 ring-2 ring-green-500/20 ${isDark ? 'bg-[#1a2332]' : 'bg-green-50'}` : `${isDark ? 'border-[#2d3e52]' : 'border-gray-300'}`}`}>
              {plan.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black px-2 py-0.5 rounded-full text-xs font-bold">POPULAR</div>}
              <h3 className="text-lg font-bold mb-0.5">{plan.name}</h3>
              <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{plan.period}</p>
              <div className="mb-4">
                <span className="text-2xl font-bold text-green-500">{plan.price}</span>
                {plan.subprice && <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{plan.subprice}</span>}
              </div>
              <ul className="space-y-2 mb-4">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 size={14} className="text-green-500" />
                    {feat}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-2 rounded-lg font-semibold transition ${plan.featured ? 'bg-green-500 text-black hover:bg-green-600' : `${isDark ? 'border border-[#2d3e52] hover:bg-[#1a2332]' : 'border border-gray-300 hover:bg-gray-100'}`}`}>
                {plan.featured ? 'Start Free Trial' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className={`py-20 px-4 backdrop-blur-xl relative overflow-hidden ${isDark ? 'bg-gradient-to-b from-green-500/5 to-transparent' : 'bg-gradient-to-b from-green-400/5 to-transparent'}`}>
        <div className="absolute inset-0 -z-10">
          <div className={`absolute -top-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDark ? 'bg-green-500' : 'bg-green-400'}`}></div>
        </div>

        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">What Our Users Say</h2>
          <p className={`text-center mb-16 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Real stories from satisfied users</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Ayesha Khan', role: 'Tenant, Lahore', text: 'Found my dream apartment in 2 days. The trust score system gave me confidence in my landlord!' },
              { name: 'Muhammad Rashid', role: 'Landlord, Karachi', text: 'Verified tenants and automated rent collection. No more chasing payments!' },
              { name: 'Fatima Hassan', role: 'Tenant, Islamabad', text: 'Had a dispute with landlord. Rentra resolved it in 3 days instead of months in court!' },
            ].map((testimonial, i) => (
              <div key={i} className={`p-6 rounded-2xl backdrop-blur-md border transition duration-300 transform hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-black/5 border-black/10 hover:bg-black/10'}`}>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <span key={j} className="text-yellow-400 text-lg">★</span>)}
                </div>
                <p className={`mb-4 text-sm italic ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>"{testimonial.text}"</p>
                <div className="border-t border-white/5 pt-3">
                  <h4 className="font-bold text-sm text-green-400">{testimonial.name}</h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 px-4 max-w-2xl mx-auto relative">
        <h2 className="text-2xl font-bold text-center mb-3 bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">FAQ</h2>
        <p className={`text-center mb-8 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Answers to common questions about Rentra.
        </p>
        <div className="space-y-2">
          {[
            { q: 'Is Rentra free?', a: 'Rentra is free for tenants. Landlords pay Rs. 500/month (Basic) or Rs. 1,200/month (Pro).' },
            { q: 'How does AI detect fake listings?', a: 'Our AI analyzes images for manipulation, cross-references property details, and checks location accuracy in real-time.' },
            { q: 'Are digital agreements legally valid in Pakistan?', a: 'Yes. Our agreements comply with Pakistan\'s Information Technology Act (2007) and are legally binding.' },
            { q: 'Which payment methods are supported?', a: 'We support JazzCash and EasyPaisa for instant, secure payments without needing a bank account.' },
            { q: 'How is my trust score calculated?', a: 'Your trust score is based on payment history, property care, communication, and dispute resolution record.' },
            { q: 'What happens in a dispute?', a: 'Disputes are mediated by our AI system with expert arbitrators. Resolution typically takes 3-5 days.' },
          ].map((item, i) => (
            <div key={i} className={`border rounded-lg overflow-hidden backdrop-blur-xl transition duration-300 ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}`}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className={`w-full p-3 text-left flex justify-between items-center font-semibold text-sm hover:text-green-400 transition`}
              >
                {item.q}
                <ChevronDown size={16} className={`transition duration-300 ${openFaq === i ? 'rotate-180 text-green-500' : 'text-green-400'}`} />
              </button>
              {openFaq === i && (
                <div className={`p-3 border-t text-xs ${isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-black/10 bg-black/5'}`}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className={`py-12 px-4 rounded-2xl max-w-3xl mx-auto mb-12 backdrop-blur-xl relative overflow-hidden ${isDark ? 'bg-gradient-to-r from-green-500/10 to-transparent border border-white/10' : 'bg-gradient-to-r from-green-400/10 to-transparent border border-black/10'}`}>
        <div className="absolute inset-0 -z-10">
          <div className={`absolute -bottom-20 -left-20 w-96 h-96 rounded-full blur-3xl opacity-30 ${isDark ? 'bg-green-500' : 'bg-green-400'}`}></div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-3 bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">Ready to Rent Safely?</h2>
        <p className={`text-center mb-8 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Join thousands of Pakistani renters and landlords using Rentra for transparent rentals.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Quick Contact */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm mb-4">Quick Contact Info</h3>
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">📧</span>
              <div>
                <p className={`text-xs ${isDark ? 'text-[#666]' : 'text-gray-500'}`}>Email</p>
                <a href="mailto:subssems336@gmail.com" className="font-semibold text-sm hover:text-green-500 transition">subssems336@gmail.com</a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">📱</span>
              <div>
                <p className={`text-xs ${isDark ? 'text-[#666]' : 'text-gray-500'}`}>Phone</p>
                <a href="tel:+923064141188" className="font-semibold text-sm hover:text-green-500 transition">+92-306-4141188</a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">📍</span>
              <div>
                <p className={`text-xs ${isDark ? 'text-[#666]' : 'text-gray-500'}`}>Address</p>
                <p className="font-semibold text-sm">p/o khot mehtab khan khot rada kishan</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">⏰</span>
              <div>
                <p className={`text-xs ${isDark ? 'text-[#666]' : 'text-gray-500'}`}>Hours</p>
                <p className="font-semibold text-sm">24/7 Available</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 justify-center">
            <Link to="/register" className="px-6 py-2 bg-green-500 text-black rounded-lg hover:bg-green-600 font-bold text-sm transition text-center">
              Get Started Free
            </Link>
            <Link to="/contact" className={`px-6 py-2 rounded-lg font-semibold text-sm transition border text-center ${isDark ? 'border-white/20 hover:bg-white/5' : 'border-gray-300 hover:bg-gray-100'}`}>
              📧 Send a Message
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className={`text-xs ${isDark ? 'text-[#666]' : 'text-gray-500'}`}>
            Or follow us on social media for updates and support
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-8 px-4 ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-300 bg-gray-50'}`}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-6 mb-6 text-xs">
          <div>
            <h4 className="font-bold mb-2 text-sm">Rentra</h4>
            <p className={`${isDark ? 'text-[#666]' : 'text-gray-600'}`}>Transparent Renting, Powered by AI</p>
          </div>
          <div>
            <h4 className="font-bold mb-2 text-sm">Platform</h4>
            <ul className={`space-y-1 ${isDark ? 'text-[#666]' : 'text-gray-600'}`}>
              <li><a href="#features" className="hover:text-green-500">Features</a></li>
              <li><a href="#pricing" className="hover:text-green-500">Pricing</a></li>
              <li><a href="#how-it-works" className="hover:text-green-500">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2 text-sm">Support</h4>
            <ul className={`space-y-1 ${isDark ? 'text-[#666]' : 'text-gray-600'}`}>
              <li><a href="#contact" className="hover:text-green-500">Contact</a></li>
              <li><a href="#faq" className="hover:text-green-500">FAQ</a></li>
              <li><a href="#" className="hover:text-green-500">Help Center</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2 text-sm">Legal</h4>
            <ul className={`space-y-1 ${isDark ? 'text-[#666]' : 'text-gray-600'}`}>
              <li><a href="#" className="hover:text-green-500">Privacy</a></li>
              <li><a href="#" className="hover:text-green-500">Terms</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2 text-sm">Follow Us</h4>
            <div className="flex gap-3 text-sm">
              <a href="#" className="hover:text-green-500">f</a>
              <a href="#" className="hover:text-green-500">📷</a>
              <a href="#" className="hover:text-green-500">𝕏</a>
            </div>
          </div>
        </div>
        <div className={`border-t pt-6 text-center text-xs ${isDark ? 'border-white/10 text-[#666]' : 'border-gray-300 text-gray-600'}`}>
          <p>© 2026 Rentra. All rights reserved. Made with ❤️ in Pakistan.</p>
        </div>
      </footer>
    </div>
  );
}
