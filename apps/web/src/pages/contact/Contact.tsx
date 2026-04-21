import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Contact() {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/contact/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
      console.error('Form submission error:', err);
    } finally {
      setLoading(false);
    }
  };

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
            <a href="/#features" className={`text-sm font-medium hover:text-green-400 transition ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Features</a>
            <a href="/#how-it-works" className={`text-sm font-medium hover:text-green-400 transition ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>How It Works</a>
            <a href="/#pricing" className={`text-sm font-medium hover:text-green-400 transition ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Pricing</a>
            <a href="/#faq" className={`text-sm font-medium hover:text-green-400 transition ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>FAQ</a>
            <Link to="/contact" className={`text-sm font-semibold text-green-400`}>Contact</Link>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className={`px-4 py-2 text-sm font-medium rounded-lg transition backdrop-blur ${isDark ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10' : 'bg-black/10 hover:bg-black/20 text-black border border-black/10'}`}>Login</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-green-500 text-black rounded-lg hover:bg-green-400 transition shadow-lg hover:shadow-green-500/50">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold mb-4">Get in Touch</h1>
        <p className={`text-lg ${isDark ? 'text-[#aaa]' : 'text-gray-600'}`}>
          Have questions? We're here to help! Reach out anytime.
        </p>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className={`p-8 rounded-xl border ${isDark ? 'border-white/10 bg-[#1a1a1a]' : 'border-gray-300 bg-gray-50'}`}>
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className={`w-full px-4 py-2 rounded-lg border transition outline-none ${
                    isDark
                      ? 'bg-[#0f0f0f] border-white/10 text-white focus:border-green-500'
                      : 'bg-white border-gray-300 text-black focus:border-green-500'
                  }`}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={`w-full px-4 py-2 rounded-lg border transition outline-none ${
                    isDark
                      ? 'bg-[#0f0f0f] border-white/10 text-white focus:border-green-500'
                      : 'bg-white border-gray-300 text-black focus:border-green-500'
                  }`}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className={`w-full px-4 py-2 rounded-lg border transition outline-none ${
                    isDark
                      ? 'bg-[#0f0f0f] border-white/10 text-white focus:border-green-500'
                      : 'bg-white border-gray-300 text-black focus:border-green-500'
                  }`}
                  placeholder="+92-XXX-XXXXXXX"
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  className={`w-full px-4 py-2 rounded-lg border transition outline-none resize-none ${
                    isDark
                      ? 'bg-[#0f0f0f] border-white/10 text-white focus:border-green-500'
                      : 'bg-white border-gray-300 text-black focus:border-green-500'
                  }`}
                  placeholder="Your message..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-500 text-black rounded-lg hover:bg-green-600 font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'} <ArrowRight size={18} />
              </button>
              {submitted && (
                <div className="p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-500 text-sm text-center font-semibold">
                  ✓ Message sent successfully! We'll get back to you soon.
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-500 text-sm text-center font-semibold">
                  ✗ {error}
                </div>
              )}
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-8">Contact Information</h2>

            {/* Email */}
            <div className={`p-6 rounded-xl border ${isDark ? 'border-white/10 hover:bg-[#1a1a1a]' : 'border-gray-300 hover:bg-gray-50'} transition cursor-pointer`}>
              <div className="flex items-start gap-4">
                <Mail className="text-green-500 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold mb-1">Email</h3>
                  <p className={`${isDark ? 'text-[#aaa]' : 'text-gray-600'}`}>subssems336@gmail.com</p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className={`p-6 rounded-xl border ${isDark ? 'border-white/10 hover:bg-[#1a1a1a]' : 'border-gray-300 hover:bg-gray-50'} transition cursor-pointer`}>
              <div className="flex items-start gap-4">
                <Phone className="text-green-500 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold mb-1">Phone</h3>
                  <p className={`${isDark ? 'text-[#aaa]' : 'text-gray-600'}`}>+92-306-4141188</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={`p-6 rounded-xl border ${isDark ? 'border-white/10 hover:bg-[#1a1a1a]' : 'border-gray-300 hover:bg-gray-50'} transition cursor-pointer`}>
              <div className="flex items-start gap-4">
                <MapPin className="text-green-500 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold mb-1">Address</h3>
                  <p className={`${isDark ? 'text-[#aaa]' : 'text-gray-600'}`}>p/o khot mehtab khan khot rada kishan, Pakistan</p>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className={`p-6 rounded-xl border ${isDark ? 'border-white/10 hover:bg-[#1a1a1a]' : 'border-gray-300 hover:bg-gray-50'} transition cursor-pointer`}>
              <div className="flex items-start gap-4">
                <Clock className="text-green-500 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold mb-1">Business Hours</h3>
                  <p className={`${isDark ? 'text-[#aaa]' : 'text-gray-600'}`}>24/7 Available</p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className={`p-6 rounded-xl border ${isDark ? 'border-white/10 bg-[#1a1a1a]' : 'border-gray-300 bg-gray-50'}`}>
              <h3 className="font-bold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/profile.php?id=100093254713246"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-lg transition font-semibold text-sm flex items-center justify-center w-12 h-12 ${isDark ? 'bg-[#0f0f0f] hover:bg-white/10' : 'bg-white hover:bg-gray-100'}`}
                  title="Facebook"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#1877F2' }}>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/farhan.dev0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-lg transition font-semibold text-sm flex items-center justify-center w-12 h-12 ${isDark ? 'bg-[#0f0f0f] hover:bg-white/10' : 'bg-white hover:bg-gray-100'}`}
                  title="Instagram"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#E4405F' }}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <circle cx="17.5" cy="6.5" r="1.5"></circle>
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/f%E1%B4%80%CA%80%CA%9C%E1%B4%80%C9%B4-%E1%B5%88%E1%B5%89%E1%B5%9B-5224b0277/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-lg transition font-semibold text-sm flex items-center justify-center w-12 h-12 ${isDark ? 'bg-[#0f0f0f] hover:bg-white/10' : 'bg-white hover:bg-gray-100'}`}
                  title="LinkedIn"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#0A66C2' }}>
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-12 px-4 ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-300 bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-8 mb-8 text-sm">
          <div>
            <h4 className="font-bold mb-4">Rentra</h4>
            <p className={`${isDark ? 'text-[#666]' : 'text-gray-600'}`}>Transparent Renting, Powered by AI</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Platform</h4>
            <ul className={`space-y-2 ${isDark ? 'text-[#666]' : 'text-gray-600'}`}>
              <li><a href="/#features" className="hover:text-green-500">Features</a></li>
              <li><a href="/#pricing" className="hover:text-green-500">Pricing</a></li>
              <li><a href="/#how-it-works" className="hover:text-green-500">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className={`space-y-2 ${isDark ? 'text-[#666]' : 'text-gray-600'}`}>
              <li><Link to="/contact" className="hover:text-green-500">Contact</Link></li>
              <li><a href="/#faq" className="hover:text-green-500">FAQ</a></li>
              <li><a href="#" className="hover:text-green-500">Help Center</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className={`space-y-2 ${isDark ? 'text-[#666]' : 'text-gray-600'}`}>
              <li><a href="#" className="hover:text-green-500">Privacy</a></li>
              <li><a href="#" className="hover:text-green-500">Terms</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Follow Us</h4>
            <div className="flex gap-4 text-lg">
              <a href="https://www.facebook.com/profile.php?id=100093254713246" target="_blank" rel="noopener noreferrer" className="hover:text-green-500">f</a>
              <a href="https://www.instagram.com/farhan.dev0/" target="_blank" rel="noopener noreferrer" className="hover:text-green-500">📷</a>
              <a href="https://www.linkedin.com/in/f%E1%B4%80%CA%80%CA%9C%E1%B4%80%C9%B4-%E1%B5%88%E1%B5%89%E1%B5%9B-5224b0277/" target="_blank" rel="noopener noreferrer" className="hover:text-green-500">in</a>
            </div>
          </div>
        </div>
        <div className={`border-t pt-8 text-center text-sm ${isDark ? 'border-white/10 text-[#666]' : 'border-gray-300 text-gray-600'}`}>
          <p>© 2026 Rentra. All rights reserved. Made with ❤️ in Pakistan.</p>
        </div>
      </footer>
    </div>
  );
}
