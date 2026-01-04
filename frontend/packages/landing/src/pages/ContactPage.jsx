import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card } from '@zolid/shared/components';
import { getArtisanUrl, getClientUrl } from '../utils/pwaUrls';
import { getCurrentYear } from '../utils/dateUtils';
import logo from '../assets/images/logos/logo.png';
import { EMAILS } from '../constants/emails';
import apiClient from '@zolid/shared/utils/apiClient';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/contact', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      });

      setSubmitted(true);
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-navy-900 text-white px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={logo} alt="ZOLID" className="h-8 md:h-10 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="hover:text-indigo-400 transition-colors">Home</Link>
            <Link to="/about" className="hover:text-indigo-400 transition-colors">About</Link>
            <a href={getArtisanUrl('/login')} className="hover:text-indigo-400 transition-colors" target="_self">Login</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-navy-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="font-condensed font-bold text-5xl md:text-6xl mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-grey-300">
            Have questions? We're here to help. Reach out to our team.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-8">
                Get in Touch
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-2">
                    Office Address
                  </h3>
                  <p className="text-navy-600">
                    Accra, Ghana<br />
                    West Africa
                  </p>
                </div>
                <div>
                  <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-2">
                    Email
                  </h3>
                  <p className="text-navy-600">
                    <a href={`mailto:${EMAILS.INFO}`} className="text-indigo-600 hover:text-indigo-700">
                      {EMAILS.INFO}
                    </a>
                  </p>
                </div>
                <div>
                  <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-2">
                    Support
                  </h3>
                  <p className="text-navy-600">
                    For technical support or account issues, email us at{' '}
                    <a href={`mailto:${EMAILS.SUPPORT}`} className="text-indigo-600 hover:text-indigo-700">
                      {EMAILS.SUPPORT}
                    </a>
                  </p>
                </div>
                <div>
                  <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-2">
                    Business Inquiries
                  </h3>
                  <p className="text-navy-600">
                    For partnerships, media inquiries, or investor relations, please contact us through the form below.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card>
                <h2 className="font-condensed font-bold text-2xl text-navy-900 mb-6">
                  Send us a Message
                </h2>
                {submitted && (
                  <div className="bg-mint-50 border-l-4 border-mint-500 p-4 rounded-lg mb-6">
                    <p className="text-mint-700 font-medium">
                      Thank you! Your message has been sent to {EMAILS.INFO}. We'll get back to you soon.
                    </p>
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                )}
                {!submitted && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                    />
                    <Input
                      label="Email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+233552537904"
                    />
                    <Input
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="How can we help?"
                    />
                    <div>
                      <label className="block mb-2 text-sm font-medium text-navy-700">
                        Message <span className="text-coral-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="5"
                        className="w-full px-4 py-3 border border-grey-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>
                    <Button type="submit" variant="primary" size="md" fullWidth disabled={loading}>
                      {loading ? 'SENDING...' : 'SEND MESSAGE'}
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-grey-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-condensed font-bold text-4xl text-navy-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card>
              <h3 className="font-condensed font-bold text-xl text-navy-900 mb-2">
                How is my money kept safe?
              </h3>
              <p className="text-navy-600">
                We hold your payment securely until the job is done. The artisan is not paid until you review the work and confirm you are satisfied. This keeps you in control.
              </p>
            </Card>
            <Card>
              <h3 className="font-condensed font-bold text-xl text-navy-900 mb-2">
                What if the work isn't good?
              </h3>
              <p className="text-navy-600">
                Every job includes a 30-day warranty. If something breaks or isn't right within that time, we will help get it fixed or refund your money. The small service fee covers this guarantee.
              </p>
            </Card>
            <Card>
              <h3 className="font-condensed font-bold text-xl text-navy-900 mb-2">
                How do artisans get paid?
              </h3>
              <p className="text-navy-600">
                Once you approve the work, the artisan is paid instantly via Mobile Money. It is fast, simple, and cashless.
              </p>
            </Card>
            <Card>
              <h3 className="font-condensed font-bold text-xl text-navy-900 mb-2">
                How does the health insurance work?
              </h3>
              <p className="text-navy-600">
                We care about the people who work for you. A small part of every job fee goes directly to RiviaCo to provide health insurance for the artisan. This helps keep Ghana's workforce healthy and secure.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link to="/" className="inline-block mb-4">
                <img src={logo} alt="ZOLID" className="h-8 w-auto" />
              </Link>
              <p className="text-grey-400 text-sm">
                The Infrastructure for Honest Work
              </p>
            </div>
            <div>
              <h4 className="font-condensed font-semibold mb-4">For Artisans</h4>
              <ul className="space-y-2 text-sm text-grey-400">
                <li><a href={getArtisanUrl('/signup')} className="hover:text-indigo-400 transition-colors" target="_self">Sign Up</a></li>
                <li><a href={getArtisanUrl('/login')} className="hover:text-indigo-400 transition-colors" target="_self">Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-condensed font-semibold mb-4">For Clients</h4>
              <ul className="space-y-2 text-sm text-grey-400">
                <li><a href={getClientUrl('/register')} className="hover:text-indigo-400 transition-colors" target="_self">Sign Up</a></li>
                <li><a href={getClientUrl('/login')} className="hover:text-indigo-400 transition-colors" target="_self">Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-condensed font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-grey-400">
                <li><Link to="/about" className="hover:text-indigo-400 transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-indigo-400 transition-colors">Contact</Link></li>
                <li><Link to="/terms" className="hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/data-policy" className="hover:text-indigo-400 transition-colors">Data Protection Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-800 pt-8 text-center text-sm text-grey-400">
            <p>© {getCurrentYear()} ZOLID. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
