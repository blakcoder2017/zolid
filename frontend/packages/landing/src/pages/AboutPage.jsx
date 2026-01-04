import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@zolid/shared/components';
import { getArtisanUrl, getClientUrl } from '../utils/pwaUrls';
import { getCurrentYear } from '../utils/dateUtils';

// SDG Images
import sdg01 from '../assets/images/sdg/E_WEB_INVERTED_01.png';
import sdg03 from '../assets/images/sdg/E_WEB_INVERTED_03.png';
import sdg08 from '../assets/images/sdg/E_WEB_INVERTED_08.png';
import sdg09 from '../assets/images/sdg/E_WEB_INVERTED_09.png';

// Logo
import logo from '../assets/images/logos/logo.png';

const AboutPage = () => {
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
            <Link to="/contact" className="hover:text-indigo-400 transition-colors">Contact</Link>
            <a href={getArtisanUrl('/login')} className="hover:text-indigo-400 transition-colors" target="_self">Login</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-navy-900 text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="font-condensed font-bold text-xl md:text-2xl text-coral-500 mb-4 uppercase tracking-wide">
            Our Purpose
          </h3>
          <h1 className="font-condensed font-bold text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
            FORMALIZING THE<br />INFORMAL ECONOMY.
          </h1>
          <p className="text-lg md:text-xl text-grey-300">
            We are building the bridge between the formal sector's capital and the informal sector's talent.
          </p>
        </div>
      </section>

      {/* The Security Gap */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-condensed font-bold text-3xl md:text-4xl text-navy-900 mb-6">
            The Security Gap
          </h2>
          <div className="space-y-4">
            <p className="text-navy-700 text-lg leading-relaxed">
              In West Africa, over 80% of the workforce operates in the informal sector. These are skilled artisans: masons, electricians, plumbers, who build our cities but are excluded from the financial safety net.
            </p>
            <p className="text-navy-700 text-lg leading-relaxed">
              They face a crisis of vulnerability. Irregular income, lack of insurance, and no verifiable work history mean that a single illness or unpaid job can push a family back into poverty. Unemployment isn't just a lack of work; it's a lack of secure work.
            </p>
          </div>
        </div>
      </section>

      {/* The Trust Deficit */}
      <section className="bg-grey-50 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-condensed font-bold text-3xl md:text-4xl text-navy-900 mb-6">
            The Trust Deficit
          </h2>
          <div className="space-y-4">
            <p className="text-navy-700 text-lg leading-relaxed">
              Conversely, the formal sector holds capital but is afraid to deploy it. The fear of theft, poor quality, and "runaway artisans" freezes millions of Cedis that should be flowing into the local economy.
            </p>
            <p className="text-navy-700 text-lg leading-relaxed italic font-medium">
              "When trust is absent, the economy stalls. ZOLID restores that flow."
            </p>
          </div>
        </div>
      </section>

      {/* Infrastructure for Dignity */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-condensed font-bold text-3xl md:text-4xl text-navy-900 mb-4">
            Infrastructure for Dignity
          </h2>
          <p className="text-navy-700 text-lg mb-10">
            We use technology to turn "gigs" into formal careers.
          </p>
          
          <div className="space-y-8">
            <div className="border-l-4 border-indigo-600 pl-6">
              <h3 className="font-condensed font-bold text-2xl text-navy-900 mb-3 flex items-center gap-3">
                <span className="text-3xl">🛡️</span>
                Financial Security
              </h3>
              <p className="text-navy-600 leading-relaxed">
                We replace cash uncertainty with digital guarantees. Artisans know they will be paid, and clients know their funds are safe until the work is verified.
              </p>
            </div>

            <div className="border-l-4 border-mint-500 pl-6">
              <h3 className="font-condensed font-bold text-2xl text-navy-900 mb-3 flex items-center gap-3">
                <span className="text-3xl">🏥</span>
                Social Protection
              </h3>
              <p className="text-navy-600 leading-relaxed">
                We believe health is a human right. Through our integration with RiviaCo, every job completed on ZOLID contributes to a mandatory health insurance plan for the artisan and their family.
              </p>
            </div>

            <div className="border-l-4 border-coral-500 pl-6">
              <h3 className="font-condensed font-bold text-2xl text-navy-900 mb-3 flex items-center gap-3">
                <span className="text-3xl">📈</span>
                Career Mobility
              </h3>
              <p className="text-navy-600 leading-relaxed">
                We build a verifiable digital track record for every worker. A 5-star rating on ZOLID is a digital CV that unlocks access to credit, banking, and larger contracts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Alignment */}
      <section className="bg-grey-50 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-condensed font-bold text-3xl md:text-4xl text-navy-900 mb-4">
            Global Alignment
          </h2>
          <h3 className="font-condensed font-bold text-xl md:text-2xl text-navy-700 mb-8">
            Sustainable Development Goals
          </h3>
          <p className="text-navy-700 text-lg mb-10 leading-relaxed">
            Our mission is directly aligned with the United Nations SDGs. We are not just building software; we are building the rails for inclusive economic growth in Africa.
          </p>
          
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

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-condensed font-bold text-3xl md:text-4xl text-navy-900 mb-6">
            Join the Movement
          </h2>
          <p className="text-lg md:text-xl text-navy-600 mb-8">
            Be part of the infrastructure that's formalizing Ghana's workforce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={getArtisanUrl('/signup')} target="_self">
              <Button variant="primary" size="lg">
                JOIN AS ARTISAN
              </Button>
            </a>
            <a href={getClientUrl('/register')} target="_self">
              <Button variant="secondary" size="lg">
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

export default AboutPage;
