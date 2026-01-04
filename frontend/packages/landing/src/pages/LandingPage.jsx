import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@zolid/shared/components';
import AnimatedCounter from '../components/AnimatedCounter';
import TestimonialCard from '../components/TestimonialCard';
import ScrollReveal from '../components/ScrollReveal';
import { getArtisanUrl, getClientUrl } from '../utils/pwaUrls';
import { testimonials } from '../data/testimonials';
import { getCurrentYear } from '../utils/dateUtils';

// SDG Images
import sdg01 from '../assets/images/sdg/E_WEB_INVERTED_01.png';
import sdg03 from '../assets/images/sdg/E_WEB_INVERTED_03.png';
import sdg08 from '../assets/images/sdg/E_WEB_INVERTED_08.png';
import sdg09 from '../assets/images/sdg/E_WEB_INVERTED_09.png';

// Logo
import logo from '../assets/images/logos/logo.png';

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`bg-navy-900 text-white px-6 py-4 sticky top-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'shadow-lg' : ''}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={logo} alt="ZOLID" className="h-10 md:h-12 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#artisan" className="hover:text-indigo-400 transition-colors">
              For Artisan
            </a>
            <a href="#client" className="hover:text-indigo-400 transition-colors">
              For Client
            </a>
            <Link to="/contact" className="hover:text-indigo-400 transition-colors">
              Contact
            </Link>
            <a 
              href={getArtisanUrl('/login')} 
              className="hover:text-indigo-400 transition-colors"
              target="_self"
            >
              Login
            </a>
            <a href={getArtisanUrl('/signup')} target="_self">
              <Button variant="secondary" size="sm" className="!border-white !text-white hover:!bg-white/10">
                Sign Up
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center">
          <h1 className="font-condensed font-bold text-4xl md:text-6xl lg:text-7xl text-navy-900 mb-6 leading-tight">
            The Infrastructure for Honest Work
          </h1>
          <p className="text-lg md:text-xl text-navy-700 mb-10 max-w-3xl mx-auto leading-relaxed">
            We don't just find you a plumber. We verify their skills, insure their health, 
            and lock your money until the job is done.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={getClientUrl('/register')} target="_self">
              <Button variant="primary" size="lg">
                HIRE A ZOLID PRO
              </Button>
            </a>
            <a href={getArtisanUrl('/signup')} target="_self">
              <Button variant="secondary" size="lg">
                I AM AN ARTISAN
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="bg-grey-50 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-condensed font-bold text-3xl md:text-4xl text-center text-navy-900 mb-12">
            Why Choose ZOLID?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white p-6 md:p-8 border border-grey-200">
              <h3 className="font-condensed font-bold text-xl md:text-2xl mb-4 text-navy-900">Double-Entry Ledger</h3>
              <p className="text-navy-600 leading-relaxed">
                We track every penny. Audit-ready financial integrity that investors and regulators trust.
              </p>
            </div>
            <div className="bg-white p-6 md:p-8 border-l-4 border-indigo-600 border-t border-r border-b border-grey-200">
              <h3 className="font-condensed font-bold text-xl md:text-2xl mb-4 text-navy-900">Anti-Bypass Promise</h3>
              <p className="text-navy-600 leading-relaxed">
                Why pay cash and risk it? Zolid gives you a 30-day warranty for just 15%. Cash has no warranty. Secure it with Zolid.
              </p>
            </div>
            <div className="bg-white p-6 md:p-8 border-l-4 border-mint-500 border-t border-r border-b border-grey-200">
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src="/images/rivia_logo.png" 
                  alt="Rivia" 
                  className="h-8 w-auto object-contain opacity-80"
                />
                <h3 className="font-condensed font-bold text-xl md:text-2xl text-navy-900">Partnership</h3>
              </div>
              <p className="text-navy-600 leading-relaxed">
                Hiring through Zolid provides health insurance to Ghana's workforce. Your health is now an asset.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Clients Section */}
      <section className="py-16 md:py-20" id="client">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 md:mb-16 max-w-4xl mx-auto">
            <h3 className="font-condensed font-bold text-xl md:text-2xl text-coral-500 mb-3 uppercase tracking-wide">
              Revenue Protection
            </h3>
            <h2 className="font-condensed font-bold text-3xl md:text-5xl lg:text-6xl text-navy-900 mb-6 leading-tight">
              HIRE WITH<br />ZERO RISK.
            </h2>
            <p className="text-lg md:text-xl text-navy-700 leading-relaxed">
              Don't let a bad job cost you twice. We hold your funds safely and only release them when you are 100% satisfied. Guaranteed.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-10">
            <div className="bg-white p-6 md:p-8 border-l-4 border-indigo-600 border-t border-r border-b border-grey-200">
              <h3 className="font-condensed font-bold text-xl md:text-2xl text-navy-900 mb-2">
                The Zolid Guarantee
              </h3>
              <h4 className="font-condensed font-semibold text-base md:text-lg text-navy-700 mb-3">
                Funds Held Safely
              </h4>
              <p className="text-navy-600 leading-relaxed">
                We don't send money to the artisan until YOU say the job is done. If they disappear, your money is refunded instantly.
              </p>
            </div>

            <div className="bg-white p-6 md:p-8 border-l-4 border-mint-500 border-t border-r border-b border-grey-200">
              <h3 className="font-condensed font-bold text-xl md:text-2xl text-navy-900 mb-4">
                30-Day Warranty
              </h3>
              <p className="text-navy-600 leading-relaxed">
                If the repair fails within 30 days, we send a senior technician to fix it for free. Our 15% service fee covers this insurance.
              </p>
            </div>

            <div className="bg-white p-6 md:p-8 border-l-4 border-coral-500 border-t border-r border-b border-grey-200">
              <h3 className="font-condensed font-bold text-xl md:text-2xl text-navy-900 mb-4">
                Verified Pros Only
              </h3>
              <p className="text-navy-600 leading-relaxed">
                Every Zolid Pro has undergone a background check, skills assessment, and ID verification. No randoms.
              </p>
            </div>
          </div>

          <div className="text-center">
            <a href={getClientUrl('/register')} target="_self">
              <Button variant="primary" size="lg">
                Find a Pro Now
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* For Artisans Section */}
      <section className="bg-grey-50 py-16 md:py-24" id="artisan">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 md:mb-16 max-w-4xl mx-auto">
            <h3 className="font-condensed font-bold text-xl md:text-2xl text-indigo-600 mb-3 uppercase tracking-wide">
              Professional Network
            </h3>
            <h2 className="font-condensed font-bold text-4xl md:text-5xl lg:text-6xl text-navy-900 mb-4 leading-tight">
              STOP CHASING<br />PAYMENTS.
            </h2>
            <p className="text-lg md:text-xl text-navy-700 leading-relaxed mb-6">
              Join the platform that guarantees your money is ready before you start working. Plus, get <span className="font-semibold text-indigo-600">Instant Free Health Cover</span> the moment you verify.
            </p>
            <div className="inline-block bg-indigo-50 border-l-4 border-indigo-600 px-6 py-4 my-6">
              <p className="font-condensed font-semibold text-lg md:text-xl text-indigo-900">
                Get Verified & Covered
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-16">
            <ScrollReveal>
              <div className="bg-white p-6 md:p-8 border-l-4 border-indigo-600 border-t border-r border-b border-grey-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-condensed font-bold text-xl md:text-2xl text-navy-900 mb-3">
                    Instant Payments
                  </h3>
                </div>
                <p className="text-navy-600 leading-relaxed">
                  The client locks the money before you lift a hammer. When you finish, the cash moves to your wallet instantly. No stories.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="bg-white p-6 md:p-8 border-l-4 border-mint-500 border-t border-r border-b border-grey-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-mint-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-mint-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="font-condensed font-bold text-xl md:text-2xl text-navy-900 mb-3">
                    Health Ladder
                  </h3>
                </div>
                <div className="space-y-2 text-navy-600 leading-relaxed">
                  <p className="font-semibold text-mint-600">Start Free:</p>
                  <p>Get discounts & virtual care immediately upon signup.</p>
                  <p className="font-semibold text-mint-600 mt-3">Upgrade Automatically:</p>
                  <p>Work ~25 jobs to unlock the <span className="font-semibold">GHS 2,500</span> full coverage plan.</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="bg-white p-6 md:p-8 border-l-4 border-coral-500 border-t border-r border-b border-grey-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-coral-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-condensed font-bold text-xl md:text-2xl text-navy-900 mb-3">
                    Build a Career
                  </h3>
                </div>
                <p className="text-navy-600 leading-relaxed">
                  Your work history is saved. Good ratings mean you can charge higher rates and get bigger commercial contracts.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* How to Join Section */}
          <div className="bg-white border-t-4 border-indigo-600 p-8 md:p-12 mb-10 shadow-lg">
            <h3 className="font-condensed font-bold text-2xl md:text-3xl text-center text-navy-900 mb-12">
              How to Join
            </h3>
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
              {/* Connecting Line (desktop only) */}
              <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-indigo-200"></div>
              
              <div className="text-center relative z-10">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto font-condensed font-bold text-2xl shadow-md">
                    1
                  </div>
                </div>
                <h4 className="font-condensed font-bold text-xl text-navy-900 mb-3">
                  Register via Web App
                </h4>
                <p className="text-navy-600 leading-relaxed">
                  <a href={getArtisanUrl('/signup')} target="_self" className="text-indigo-600 font-semibold hover:text-indigo-700 underline">Click here</a> to create your basic profile and get started.
                </p>
              </div>

              <div className="text-center relative z-10">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-mint-500 text-white rounded-full flex items-center justify-center mx-auto font-condensed font-bold text-2xl shadow-md">
                    2
                  </div>
                </div>
                <h4 className="font-condensed font-bold text-xl text-navy-900 mb-3">
                  Get Verified & Covered
                </h4>
                <p className="text-navy-600 leading-relaxed">
                  Pass the Ghana Card check. Instantly unlock the <span className="font-semibold text-mint-600">Rivia Free Plan</span> (Virtual Care & Discounts).
                </p>
              </div>

              <div className="text-center relative z-10">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-coral-500 text-white rounded-full flex items-center justify-center mx-auto font-condensed font-bold text-2xl shadow-md">
                    3
                  </div>
                </div>
                <h4 className="font-condensed font-bold text-xl text-navy-900 mb-3">
                  Work & Upgrade
                </h4>
                <p className="text-navy-600 leading-relaxed">
                  Complete jobs. Automatic deductions upgrade you to the <span className="font-semibold text-coral-600">GHS 2,500 Starter Plan</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <a href={getArtisanUrl('/signup')} target="_self">
              <Button variant="primary" size="lg">
                Get Verified & Covered
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20 border-t border-b border-grey-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 md:gap-12 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-condensed font-bold text-navy-900 mb-2 tabular-nums">
                <AnimatedCounter target={60} suffix="+" />
              </p>
              <p className="text-navy-600 text-sm md:text-base">Verified Artisans</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-condensed font-bold text-navy-900 mb-2 tabular-nums">
                <AnimatedCounter target={8000} suffix="K+" />
              </p>
              <p className="text-navy-600 text-sm md:text-base">Jobs Completed</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-condensed font-bold text-navy-900 mb-2 tabular-nums">
                <AnimatedCounter target={98} suffix="%" />
              </p>
              <p className="text-navy-600 text-sm md:text-base">Success Rate</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-condensed font-bold text-navy-900 mb-2 tabular-nums">
                <span className="text-2xl md:text-3xl">GHS </span>
                <AnimatedCounter target={70000} />
              </p>
              <p className="text-navy-600 text-sm md:text-base">Processed</p>
            </div>
          </div>
        </div>
      </section>

      {/* SDG Alignment Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-condensed font-bold text-3xl md:text-4xl text-navy-900 mb-4">
              Global Impact
            </h2>
            <p className="text-navy-600 max-w-3xl mx-auto">
              Our mission aligns with the United Nations Sustainable Development Goals
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="flex justify-center">
              <img 
                src={sdg01} 
                alt="SDG 1: No Poverty" 
                className="w-32 h-32 md:w-40 md:h-40 object-contain"
              />
            </div>
            <div className="flex justify-center">
              <img 
                src={sdg03} 
                alt="SDG 3: Good Health & Well-being" 
                className="w-32 h-32 md:w-40 md:h-40 object-contain"
              />
            </div>
            <div className="flex justify-center">
              <img 
                src={sdg08} 
                alt="SDG 8: Decent Work & Economic Growth" 
                className="w-32 h-32 md:w-40 md:h-40 object-contain"
              />
            </div>
            <div className="flex justify-center">
              <img 
                src={sdg09} 
                alt="SDG 9: Industry, Innovation & Infrastructure" 
                className="w-32 h-32 md:w-40 md:h-40 object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="bg-white py-12 md:py-16 border-t border-b border-grey-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-sm md:text-base text-navy-600 uppercase tracking-wide font-semibold mb-2">
              Trusted Partners
            </p>
            <h3 className="font-condensed font-bold text-2xl md:text-3xl text-navy-900 mb-8">
              Health Coverage Powered By
            </h3>
          </div>
          <div className="flex justify-center items-center">
            <div className="bg-white p-6 md:p-8 rounded-lg border border-grey-200 shadow-sm hover:shadow-md transition-shadow max-w-md">
              <img 
                src="/images/rivia_logo.png" 
                alt="Rivia - Health Insurance Partner" 
                className="h-12 md:h-16 w-auto mx-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
          <p className="text-center text-sm text-navy-600 mt-6 max-w-2xl mx-auto">
            Through our partnership with Rivia, every ZOLID artisan receives automatic health insurance coverage, ensuring Ghana's workforce stays healthy and protected.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 bg-grey-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-condensed font-bold text-3xl md:text-4xl text-navy-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-navy-600 max-w-2xl mx-auto">
              Trusted by thousands of artisans and clients across Ghana
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.slice(0, 6).map((testimonial) => (
              <TestimonialCard key={testimonial.id} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-navy-900 text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-condensed font-bold text-3xl md:text-4xl lg:text-5xl mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg md:text-xl text-grey-300 mb-10 max-w-2xl mx-auto">
            Join thousands of verified artisans and satisfied clients building trust in Ghana's workforce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={getArtisanUrl('/signup')} target="_self">
              <Button variant="primary" size="lg">
                JOIN AS ARTISAN
              </Button>
            </a>
            <a href={getClientUrl('/register')} target="_self">
              <Button variant="secondary" size="lg" className="!border-white !text-white hover:!bg-white/10">
                HIRE A PRO
              </Button>
            </a>
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
              <p className="text-grey-400 text-sm mt-2">
                Built for Ghana. Built for Trust.
              </p>
            </div>
            <div>
              <h4 className="font-condensed font-semibold mb-4">For Artisans</h4>
              <ul className="space-y-2 text-sm text-grey-400">
                <li><a href="#artisan" className="hover:text-indigo-400 transition-colors">How It Works</a></li>
                <li><a href={getArtisanUrl('/signup')} className="hover:text-indigo-400 transition-colors" target="_self">Sign Up</a></li>
                <li><a href={getArtisanUrl('/login')} className="hover:text-indigo-400 transition-colors" target="_self">Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-condensed font-semibold mb-4">For Clients</h4>
              <ul className="space-y-2 text-sm text-grey-400">
                <li><a href="#client" className="hover:text-indigo-400 transition-colors">How It Works</a></li>
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

export default LandingPage;
