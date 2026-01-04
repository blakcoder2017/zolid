import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@zolid/shared/components';
import { getArtisanUrl, getClientUrl } from '../utils/pwaUrls';
import { getCurrentYear } from '../utils/dateUtils';
import logo from '../assets/images/logos/logo.png';
import { EMAILS } from '../constants/emails';

const PrivacyPage = () => {
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
            Privacy Policy
          </h1>
          <p className="text-grey-300">
            Last Updated: December 2025
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                1. Introduction
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                ZOLID ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
              </p>
              <p className="text-navy-700 leading-relaxed">
                By using ZOLID, you consent to the data practices described in this policy. If you do not agree with this policy, you must not use our services.
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                2. Information We Collect
              </h2>
              <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-3">
                2.1 Information You Provide
              </h3>
              <p className="text-navy-700 leading-relaxed mb-4">
                We collect information that you provide directly to us:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 mb-4">
                <li><strong>Account Information:</strong> Name, phone number, email address, password</li>
                <li><strong>Profile Information:</strong> Location (GPS address), trade skills, language preferences, Ghana Card number</li>
                <li><strong>Job Information:</strong> Job descriptions, locations, budgets, photos, work evidence</li>
                <li><strong>Payment Information:</strong> Mobile Money numbers, payment preferences (processed securely through Paystack)</li>
                <li><strong>Communication:</strong> Messages, reviews, dispute reports, support inquiries</li>
              </ul>
              <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-3">
                2.2 Automatically Collected Information
              </h3>
              <ul className="list-disc list-inside text-navy-700 space-y-2">
                <li>Device information (type, operating system, browser)</li>
                <li>IP address and location data</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Transaction history and payment records</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                3. How We Use Your Information
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                We use collected information to:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 mb-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and facilitate payments</li>
                <li>Verify user identity and prevent fraud</li>
                <li>Match clients with appropriate artisans</li>
                <li>Facilitate communication between users</li>
                <li>Process RiviaCo health insurance enrollments</li>
                <li>Send service-related notifications and updates</li>
                <li>Respond to support requests and disputes</li>
                <li>Maintain financial records and compliance</li>
                <li>Analyze usage patterns to improve the platform</li>
              </ul>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                4. Information Sharing and Disclosure
              </h2>
              <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-3">
                4.1 With Other Users
              </h3>
              <p className="text-navy-700 leading-relaxed mb-4">
                We share limited information to facilitate transactions:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 mb-4">
                <li><strong>Clients see:</strong> Artisan name, verified status, ratings, trade skills, location (general area)</li>
                <li><strong>Artisans see:</strong> Client name, job location, job description, budget</li>
                <li>Contact information is shared only after job acceptance</li>
              </ul>
              <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-3">
                4.2 With Service Providers
              </h3>
              <ul className="list-disc list-inside text-navy-700 space-y-2 mb-4">
                <li><strong>Paystack:</strong> Payment processing and Mobile Money verification</li>
                <li><strong>RiviaCo:</strong> Health insurance enrollment and premium processing</li>
                <li><strong>Cloud Storage:</strong> Photo and document storage (S3/GCS)</li>
                <li><strong>Hosting Providers:</strong> Platform infrastructure and data storage</li>
              </ul>
              <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-3">
                4.3 Legal Requirements
              </h3>
              <p className="text-navy-700 leading-relaxed">
                We may disclose information if required by law, court order, or government regulation, including to:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2">
                <li>Bank of Ghana (BoG) for financial compliance</li>
                <li>Social Security and National Insurance Trust (SSNIT)</li>
                <li>Law enforcement agencies with valid legal requests</li>
                <li>Regulatory bodies for audit purposes</li>
              </ul>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                5. Financial Data and Double-Entry Ledger
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                ZOLID maintains a Double-Entry Ledger system for financial integrity. This means:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 mb-4">
                <li>All financial transactions are permanently recorded</li>
                <li>Transaction data is immutable and auditable</li>
                <li>Financial records are maintained for regulatory compliance</li>
                <li>Data is stored securely with encryption and access controls</li>
              </ul>
              <p className="text-navy-700 leading-relaxed">
                Financial data is retained as required by Ghanaian financial regulations and may be shared with auditors, regulators, or financial institutions as legally required.
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                6. Data Security
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                We implement industry-standard security measures:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 mb-4">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Encryption of sensitive data at rest</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure payment processing through Paystack</li>
              </ul>
              <p className="text-navy-700 leading-relaxed">
                However, no method of transmission or storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                7. Mobile Money Verification
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                For artisans, we verify Mobile Money accounts through Paystack:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 mb-4">
                <li>We verify MoMo number and account name match</li>
                <li>This verification is required for instant payouts</li>
                <li>MoMo data is shared with Paystack for verification only</li>
                <li>We do not store full MoMo account details</li>
              </ul>
              <p className="text-navy-700 leading-relaxed">
                Paystack's privacy policy applies to data shared with them. We recommend reviewing their privacy practices.
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                8. RiviaCo Health Insurance
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                When you work as an artisan through ZOLID:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 mb-4">
                <li>A mandatory premium is deducted from each job payment</li>
                <li>We share your name, phone number, and premium amount with RiviaCo</li>
                <li>RiviaCo enrolls you in their health insurance program</li>
                <li>Your policy information is stored and linked to your ZOLID account</li>
              </ul>
              <p className="text-navy-700 leading-relaxed">
                RiviaCo's privacy policy applies to data shared with them. This sharing is necessary to provide health insurance benefits.
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                9. Your Rights and Choices
              </h2>
              <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-3">
                9.1 Access and Correction
              </h3>
              <p className="text-navy-700 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 mb-4">
                <li>Access your personal information through your account</li>
                <li>Update or correct your profile information</li>
                <li>Request a copy of your data</li>
                <li>Review your transaction history</li>
              </ul>
              <h3 className="font-condensed font-semibold text-xl text-navy-900 mb-3">
                9.2 Account Deletion
              </h3>
              <p className="text-navy-700 leading-relaxed mb-4">
                You may request account deletion, subject to:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2">
                <li>Completion of all active jobs and transactions</li>
                <li>Resolution of any disputes</li>
                <li>Retention of financial records as required by law</li>
                <li>Retention of anonymized data for analytics</li>
              </ul>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                10. Data Retention
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                We retain your information for:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 mb-4">
                <li><strong>Active Accounts:</strong> For the duration of your account</li>
                <li><strong>Financial Records:</strong> As required by Ghanaian financial regulations (minimum 7 years)</li>
                <li><strong>Transaction Data:</strong> Permanently in our Double-Entry Ledger for audit purposes</li>
                <li><strong>Deleted Accounts:</strong> Financial records retained, personal data anonymized</li>
              </ul>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                11. Cookies and Tracking
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 mb-4">
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze platform usage</li>
                <li>Improve security</li>
              </ul>
              <p className="text-navy-700 leading-relaxed">
                You can control cookies through your browser settings, but disabling cookies may limit platform functionality.
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                12. Children's Privacy
              </h2>
              <p className="text-navy-700 leading-relaxed">
                ZOLID is not intended for users under 18 years of age. We do not knowingly collect information from children. If we become aware that we have collected information from a child, we will take steps to delete it immediately.
              </p>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                13. International Data Transfers
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                Your information is primarily stored and processed in Ghana. However, some service providers may process data in other countries:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2">
                <li>Paystack (payment processing) - Nigeria/Ghana</li>
                <li>Cloud storage providers - May use international data centers</li>
                <li>All transfers comply with applicable data protection laws</li>
              </ul>
            </Card>

            <Card className="mb-8">
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                14. Changes to Privacy Policy
              </h2>
              <p className="text-navy-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes via email or platform notification. Your continued use of ZOLID after changes constitutes acceptance of the updated policy.
              </p>
            </Card>

            <Card>
              <h2 className="font-condensed font-bold text-3xl text-navy-900 mb-6">
                15. Contact Us
              </h2>
              <p className="text-navy-700 leading-relaxed mb-4">
                For questions about this Privacy Policy or to exercise your rights, contact us:
              </p>
              <p className="text-navy-700 leading-relaxed">
                Email: <a href={`mailto:${EMAILS.INFO}`} className="text-indigo-600 hover:text-indigo-700">{EMAILS.INFO}</a><br />
                Address: Accra, Ghana<br />
                Data Protection Officer: Available upon request
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

export default PrivacyPage;
