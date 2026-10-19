import { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { contactsAPI } from '../../api/contacts';
import { getApiErrorMessage } from '../../api/api-error';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await contactsAPI.create(formData);

      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send message. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition bg-bg/90 border-border border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition group">
            <img src="/logo.jpg" alt="Rentra logo" className="w-10 h-10 rounded-lg object-cover shadow-lg transition group-hover:shadow-primary/50" style={{filter: 'drop-shadow(0 4px 6px rgb(var(--rentra-shadow) / 10%)) drop-shadow(0 0 8px rgb(var(--rentra-shadow) / 5%))'}} />
            <div>
              <div className="text-xl font-bold text-green-500">Rentra</div>
              <div className="text-[10px] text-green-400/70 font-semibold tracking-wider">RENT WITH CLARITY</div>
            </div>
          </Link>
          <div className="hidden md:flex gap-8 items-center">
            <a href="/#trust" className="text-sm font-medium text-text-muted transition hover:text-primary">Why Rentra</a>
            <a href="/#how-it-works" className="text-sm font-medium text-text-muted transition hover:text-primary">How It Works</a>
            <a href="/#homes" className="text-sm font-medium text-text-muted transition hover:text-primary">Browse homes</a>
            <Link to="/contact" className="text-sm font-semibold text-primary">Contact</Link>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium rounded-lg transition backdrop-blur bg-surface-2 hover:bg-surface-3 text-text border border-border">Login</Link>
            <Link to="/register" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast shadow-lg transition hover:bg-primary-hover hover:shadow-primary/50">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold mb-4">Get in Touch</h1>
        <p className="text-lg text-text-muted">
          Have questions? We're here to help! Reach out anytime.
        </p>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="p-8 rounded-xl border border-border bg-surface">
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-text">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-bg text-text transition outline-none focus:border-primary"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-text">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-bg text-text transition outline-none focus:border-primary"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-text">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-bg text-text transition outline-none focus:border-primary"
                  placeholder="+92-XXX-XXXXXXX"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-text">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-bg text-text transition outline-none resize-none focus:border-primary"
                  placeholder="Your message..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-primary-contrast transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Message'} <ArrowRight size={18} />
              </button>
              {submitted && (
                <div className="rounded-lg border border-primary/40 bg-primary-soft p-3 text-center text-sm font-semibold text-primary">
                  ✓ Message sent successfully! We'll get back to you soon.
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-danger/40 bg-danger-soft p-3 text-center text-sm font-semibold text-danger">
                  ✗ {error}
                </div>
              )}
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-8">Contact Information</h2>
            <div className="p-6 rounded-xl border border-border bg-surface">
              <Mail className="text-green-500 mb-3" size={24} />
              <p className="text-text-muted">Use the form to send a message to the support inbox. A public support email, phone number, office address, business hours, and official social links are not configured here.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 bg-surface-2">
        <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-8 mb-8 text-sm">
          <div>
            <h4 className="font-bold mb-4">Rentra</h4>
            <p className="text-text-muted">A clearer rental journey for tenants and landlords.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-text-muted">
              <li><a href="/#trust" className="hover:text-green-500">Why Rentra</a></li>
              <li><a href="/#homes" className="hover:text-green-500">Browse homes</a></li>
              <li><a href="/#how-it-works" className="hover:text-green-500">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-text-muted">
              <li><Link to="/contact" className="hover:text-green-500">Contact</Link></li>
              <li><Link to="/help" className="hover:text-green-500">Help Center</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-text-muted">
              <li className="text-xs">Privacy policy and terms are not published yet.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Follow Us</h4>
            <p className="text-text-muted">Official social channels are not configured.</p>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-text-muted">
          <p>© {new Date().getFullYear()} Rentra. Made with care in Pakistan.</p>
        </div>
      </footer>
    </div>
  );
}
