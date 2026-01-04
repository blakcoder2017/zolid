import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@zolid/shared/components';
import { getArtisanUrl, getClientUrl } from '../utils/pwaUrls';
import { getCurrentYear } from '../utils/dateUtils';
import logo from '../assets/images/logos/logo.png';
import { EMAILS } from '../constants/emails';

const DataPolicyPage = () => {
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
            Data Protection Policy
          </h1>
          <p className="text-grey-300">
            Compliance: Data Protection Act, 2012 (Act 843)
          </p>
        </div>
      </section>

      {/* Data Policy Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                1. Commitment to Sovereignty
              </h2>
              <p className="text-navy-700 leading-relaxed">
                ZOLID Systems ("We") is registered with the Data Protection Commission (DPC) of Ghana. We treat personal data as a sovereign asset. This policy outlines our compliance with the Data Protection Act, 2012 (Act 843) regarding the collection, use, and protection of personal data.
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                2. Data We Collect
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                To provide secure infrastructure for labor and payments, we collect the following "Personal Data":
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-3 mb-4">
                <li>
                  <strong>Identity Data:</strong> Ghana Card Number (NIA), Full Name, Date of Birth.
                </li>
                <li>
                  <strong>Contact Data:</strong> Phone numbers (linked to Mobile Money), physical residential addresses (GPS).
                </li>
                <li>
                  <strong>Financial Data:</strong> Mobile Money wallet details and transaction history.
                </li>
                <li>
                  <strong>Biometric Data:</strong> Facial verification data (for Artisan identity matching against Ghana Card).
                </li>
              </ul>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                3. Purpose of Processing
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                We process data strictly for the following lawful purposes under Section 20 of Act 843:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-3">
                <li>
                  <strong>Verification:</strong> Authenticating Artisan identities via the National Identification Authority (NIA) database to prevent fraud/theft.
                </li>
                <li>
                  <strong>Contractual Necessity:</strong> Processing secured payments and warranties between Clients and Artisans.
                </li>
                <li>
                  <strong>Social Protection:</strong> Enrolling Artisans in mandatory RiviaCo health insurance schemes.
                </li>
                <li>
                  <strong>Legal Compliance:</strong> Meeting KYC (Know Your Customer) and AML (Anti-Money Laundering) requirements.
                </li>
              </ul>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                4. Data Sovereignty & Storage
              </h2>
              <p className="text-navy-700 leading-relaxed">
                All sensitive personal data is stored on encrypted servers compliant with Ghanaian data sovereignty requirements. We implement "Privacy by Design," ensuring data is minimized and encrypted at rest (AES-256) and in transit (TLS 1.3).
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                5. Third-Party Disclosures
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                We NEVER sell user data. We share data only with licensed Data Processors essential to service delivery:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-3">
                <li>
                  <strong>Payment Processors:</strong> Paystack / MTN Mobile Money (for fund settlement).
                </li>
                <li>
                  <strong>Verification Partners:</strong> Identity verification services (e.g., Margins Group) for Ghana Card validation.
                </li>
                <li>
                  <strong>Insurance Partners:</strong> RiviaCo (strictly for health policy enrollment).
                </li>
                <li>
                  <strong>Law Enforcement:</strong> Upon valid court order or warrant, to assist in criminal investigations (e.g., theft).
                </li>
              </ul>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                6. Rights of the Data Subject
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                Under Act 843, you have the right to:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-3">
                <li>
                  <strong>Access:</strong> Request a copy of all personal data we hold about you.
                </li>
                <li>
                  <strong>Rectification:</strong> Request correction of inaccurate data.
                </li>
                <li>
                  <strong>Erasure ("Right to be Forgotten"):</strong> Request deletion of your data, provided there are no active financial disputes, warranties, or legal obligations requiring retention.
                </li>
                <li>
                  <strong>Objection:</strong> Object to processing for direct marketing purposes.
                </li>
              </ul>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                7. Data Retention
              </h2>
              <p className="text-navy-700 leading-relaxed">
                We retain transaction and identity data for a minimum of six (6) years as required by financial regulations. After this period, data is anonymized or securely deleted.
              </p>
            </Card>

            <Card>
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                8. Contact the Data Protection Officer (DPO)
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                To exercise your rights or report a privacy concern, contact our DPO:
              </p>
              <div className="bg-grey-50 border-l-4 border-indigo-600 p-4">
                <p className="text-navy-700 leading-relaxed mb-2">
                  <strong>Data Protection Officer</strong>
                </p>
                <p className="text-navy-700 leading-relaxed mb-2">
                  ZOLID Systems Ltd.
                </p>
                <p className="text-navy-700 leading-relaxed mb-2">
                  Email: <a href={`mailto:${EMAILS.INFO}`} className="text-indigo-600 hover:text-indigo-700">{EMAILS.INFO}</a>
                </p>
                <p className="text-navy-700 leading-relaxed">
                  Tamale, Ghana.
                </p>
              </div>
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

export default DataPolicyPage;
