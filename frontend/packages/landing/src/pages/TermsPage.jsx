import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@zolid/shared/components';
import { getArtisanUrl, getClientUrl } from '../utils/pwaUrls';
import { getCurrentYear } from '../utils/dateUtils';
import logo from '../assets/images/logos/logo.png';
import { EMAILS } from '../constants/emails';

const TermsPage = () => {
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="font-condensed font-bold text-4xl md:text-5xl mb-4">
            Terms of Service
          </h1>
          <p className="text-grey-300">
            Last Updated: December 2025
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                1. Introduction & Nature of Service
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                Welcome to ZOLID Systems ("the Platform"). By accessing or using our services, you agree to these Terms. If you do not agree, you must not use the Platform.
              </p>
              <div className="bg-grey-50 border-l-4 border-indigo-600 p-4 mb-4">
                <p className="font-condensed font-bold text-lg text-navy-900 mb-2">
                  Important Disclaimer: ZOLID is a digital infrastructure provider. We are NOT:
                </p>
                <ul className="list-disc list-inside text-navy-700 space-y-1">
                  <li>An Employment Agency or Staffing Firm.</li>
                  <li>A Financial Institution or Bank.</li>
                  <li>A Construction Contractor.</li>
                </ul>
              </div>
              <p className="text-navy-700 leading-relaxed">
                We provide the technological environment that enables independent Clients and Artisans to connect, verify identity, and transact securely.
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                2. Platform Services
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-2">
                    For Clients:
                  </h3>
                  <p className="text-navy-700 leading-relaxed">
                    We offer identity verification, payment security protocols, and a warranty framework for connecting with independent service providers.
                  </p>
                </div>
                <div>
                  <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-2">
                    For Artisans:
                  </h3>
                  <p className="text-navy-700 leading-relaxed">
                    We offer a digital profile, verified work history, and access to third-party benefits like RiviaCo health insurance.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                3. Payment & Funds Handling
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                ZOLID utilizes a Secured Payment Protocol. Funds paid by the Client are held safely by our licensed payment partners until the work is verified. This is not a deposit account; funds are held strictly for the purpose of settling specific service transactions.
              </p>
              <p className="text-navy-700 leading-relaxed">
                Clients agree to lock the full job amount plus the Warranty Premium before work begins. Once the Client releases funds via their secure PIN, the transaction is final and irreversible.
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                4. Limitation of Liability (Theft & Damages)
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                While ZOLID performs rigorous identity checks (Ghana Card & Background Verification), we cannot physically supervise Artisans in your home.
              </p>
              <div className="bg-grey-50 border-l-4 border-coral-500 p-4 mb-4">
                <h3 className="font-condensed font-bold text-lg text-navy-900 mb-2">
                  Client Responsibility:
                </h3>
                <p className="text-navy-700 mb-2">
                  You solely are responsible for monitoring the Artisan while they are on your premises. ZOLID expressly disclaims all liability for:
                </p>
                <ul className="list-disc list-inside text-navy-700 space-y-1">
                  <li>Theft of property.</li>
                  <li>Damage to property not directly related to the agreed repair scope.</li>
                  <li>Personal disputes between Client and Artisan.</li>
                </ul>
              </div>
              <p className="text-navy-700 leading-relaxed">
                In the event of a criminal incident, ZOLID will provide law enforcement with the Artisan's full verified identity details (Ghana Card, GPS Location, Guarantor Data) to assist in prosecution.
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                5. Employment Status
              </h2>
              <p className="text-navy-700 leading-relaxed">
                Artisans on ZOLID are Independent Contractors. There is no employment relationship between ZOLID and any Artisan. ZOLID does not direct their work, set their schedules, or provide tools. Clients engage Artisans directly.
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                6. The Warranty Premium & Material Costs
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                The "Warranty Premium" (10-15%) is a service fee paid to ZOLID for the use of the platform, the verification engine, and the 30-Day Satisfaction Guarantee.
              </p>
              <div className="bg-grey-50 border-l-4 border-mint-500 p-4 mb-4">
                <h3 className="font-condensed font-bold text-lg text-navy-900 mb-2">
                  Exclusion of Materials:
                </h3>
                <p className="text-navy-700 mb-2">
                  Platform fees and job estimates cover labor only unless explicitly stated otherwise. The cost of raw materials (cement, pipes, wires, spare parts, etc.) is NOT included in the standard service fee. Clients must either:
                </p>
                <ul className="list-disc list-inside text-navy-700 space-y-1">
                  <li>Provide the necessary materials for the Artisan to use.</li>
                  <li>Negotiate a separate materials budget with the Artisan, which may be processed through the platform for security but does not incur the full warranty premium on the material cost component.</li>
                </ul>
              </div>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                7. Governing Law
              </h2>
              <p className="text-navy-700 leading-relaxed">
                These Terms are governed by the laws of the Republic of Ghana. Any disputes shall be resolved in the courts of Ghana.
              </p>
            </Card>

            <Card>
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                8. Contact
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                For legal inquiries:
              </p>
              <p className="text-navy-700 leading-relaxed">
                <a href={`mailto:${EMAILS.INFO}`} className="text-indigo-600 hover:text-indigo-700">
                  {EMAILS.INFO}
                </a>
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

export default TermsPage;
