import { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/client';

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
      await api.post('/contact/message', formData);

      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setError(requestError.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f0f0f] text-white' : 'bg-white text-black'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition ${isDark ? 'bg-[#0f0f0f]/40 border-white/5' : 'bg-white/40 border-gray-400/30'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition group">
            <img src="/logo.jpg" alt="Renova Logo" className="w-10 h-10 rounded-lg object-cover shadow-lg group-hover:shadow-green-500/50 transition" style={{filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) drop-shadow(0 0 8px rgba(0, 0, 0, 0.05))'}} />
            <div>
              <div className="text-xl font-bold text-green-500">Renova</div>
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
        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Have questions? We're here to help! Reach out anytime.
        </p>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className={`p-8 rounded-xl border ${isDark ? 'border-white/10 bg-[#1a1a1a]' : 'border-gray-400 bg-gray-50'}`}>
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
                      : 'bg-white border-gray-400 text-black focus:border-green-500'
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
                      : 'bg-white border-gray-400 text-black focus:border-green-500'
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
                      : 'bg-white border-gray-400 text-black focus:border-green-500'
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
                      : 'bg-white border-gray-400 text-black focus:border-green-500'
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
            <div className={`p-6 rounded-xl border ${isDark ? 'border-white/10 bg-[#1a1a1a]' : 'border-gray-400 bg-gray-50'}`}>
              <Mail className="text-green-500 mb-3" size={24} />
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Use the form to send a message to the support inbox. A public support email, phone number, office address, business hours, and official social links are not configured here.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-12 px-4 ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-400 bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-8 mb-8 text-sm">
          <div>
            <h4 className="font-bold mb-4">Renova</h4>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Transparent Renting, Powered by AI</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Platform</h4>
            <ul className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li><a href="/#features" className="hover:text-green-500">Features</a></li>
              <li><a href="/#pricing" className="hover:text-green-500">Pricing</a></li>
              <li><a href="/#how-it-works" className="hover:text-green-500">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li><Link to="/contact" className="hover:text-green-500">Contact</Link></li>
              <li><a href="/#faq" className="hover:text-green-500">FAQ</a></li>
              <li><a href="#" className="hover:text-green-500">Help Center</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li><a href="#" className="hover:text-green-500">Privacy</a></li>
              <li><a href="#" className="hover:text-green-500">Terms</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Follow Us</h4>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Official social channels are not configured.</p>
          </div>
        </div>
        <div className={`border-t pt-8 text-center text-sm ${isDark ? 'border-white/10 text-gray-400' : 'border-gray-400 text-gray-600'}`}>
          <p>© 2026 Renova. All rights reserved. Made with ❤️ in Pakistan.</p>
        </div>
      </footer>
    </div>
  );
}


