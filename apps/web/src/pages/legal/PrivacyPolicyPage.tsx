import { useNavigate } from 'react-router-dom';
import { Button } from '@fanmeet/ui';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-[#050014] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <span className="h-8 w-8 rounded-2xl bg-gradient-to-br from-[#C045FF] via-[#FF6B9D] to-[#8B3FFF]" />
            <span>FanMeet</span>
          </button>
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            ← Back
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm md:p-12">
          <h1 className="mb-2 text-3xl font-bold text-[#212529]">Privacy Policy</h1>
          <p className="mb-8 text-sm text-[#6C757D]">Last updated: December 15, 2024</p>

          <div className="prose prose-sm max-w-none text-[#495057]">
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">1. Introduction</h2>
              <p className="mb-4">
                Welcome to FanMeet ("we," "our," or "us"). FanMeet is a platform that connects fans with their favorite creators through live video calls. We are committed to protecting your privacy and ensuring the security of your personal information.
              </p>
              <p className="mb-4">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services located at fanmeet.live (the "Platform"). Please read this policy carefully. By using our Platform, you consent to the practices described in this Privacy Policy.
              </p>
              <p>
                FanMeet is operated by FanMeet Technologies Private Limited, a company registered in India under the Companies Act, 2013.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">2. Information We Collect</h2>
              
              <h3 className="mb-2 text-lg font-medium text-[#212529]">2.1 Personal Information You Provide</h3>
              <ul className="mb-4 list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, username, and password when you create an account.</li>
                <li><strong>Profile Information:</strong> Profile photo, bio, social media links, and category preferences.</li>
                <li><strong>Payment Information:</strong> Bank account details, UPI ID, and transaction history for processing payouts and refunds. We use Razorpay as our payment processor; your card details are never stored on our servers.</li>
                <li><strong>Identity Verification:</strong> For creators, we may collect government-issued ID proof, PAN card details, and social media verification for KYC compliance.</li>
                <li><strong>Communication Data:</strong> Messages, support tickets, and any correspondence with our team.</li>
              </ul>

              <h3 className="mb-2 text-lg font-medium text-[#212529]">2.2 Information Collected Automatically</h3>
              <ul className="mb-4 list-disc pl-6 space-y-2">
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers.</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent on pages, click patterns, search queries.</li>
                <li><strong>Video Call Metadata:</strong> Call duration, connection quality metrics (video content is NOT recorded or stored).</li>
                <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies for authentication, preferences, and analytics.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">3. How We Use Your Information</h2>
              <p className="mb-4">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Delivery:</strong> To facilitate video calls between fans and creators, process bids, and manage event scheduling.</li>
                <li><strong>Payment Processing:</strong> To process payments, refunds, and creator payouts through our payment partners.</li>
                <li><strong>Account Management:</strong> To create and manage your account, verify your identity, and maintain security.</li>
                <li><strong>Communication:</strong> To send transactional emails, event reminders, bid updates, and customer support responses.</li>
                <li><strong>Platform Improvement:</strong> To analyze usage patterns, fix bugs, and improve our services.</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes in India.</li>
                <li><strong>Fraud Prevention:</strong> To detect and prevent fraudulent activities, abuse, and security threats.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">4. Information Sharing and Disclosure</h2>
              <p className="mb-4">We do not sell your personal information. We may share your information in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>With Creators/Fans:</strong> Limited profile information is shared between parties for scheduled video calls (name, profile photo, username).</li>
                <li><strong>Payment Processors:</strong> We share necessary payment details with Razorpay for processing transactions.</li>
                <li><strong>Service Providers:</strong> We work with trusted third parties for hosting (Supabase), video calls (Daily.co), and analytics who process data on our behalf.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government request in India.</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets, user data may be transferred to the new entity.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">5. Data Security</h2>
              <p className="mb-4">We implement robust security measures to protect your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All data transmission is encrypted using SSL/TLS (HTTPS).</li>
                <li>Payment processing is PCI-DSS compliant through Razorpay.</li>
                <li>Database access is restricted and monitored.</li>
                <li>Regular security audits and vulnerability assessments.</li>
                <li>Two-factor authentication available for accounts.</li>
              </ul>
              <p className="mt-4">
                While we strive to protect your information, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">6. Data Retention</h2>
              <p className="mb-4">We retain your personal information for as long as necessary to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide our services to you</li>
                <li>Comply with legal obligations (tax records: 7 years as per Indian law)</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Maintain business records</li>
              </ul>
              <p className="mt-4">
                You may request deletion of your account and associated data at any time, subject to legal retention requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">7. Your Rights</h2>
              <p className="mb-4">Under applicable Indian data protection laws, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal requirements).</li>
                <li><strong>Portability:</strong> Request your data in a portable format.</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable.</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time.</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at privacy@fanmeet.live or through our support portal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">8. Cookies Policy</h2>
              <p className="mb-4">We use the following types of cookies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for authentication and basic platform functionality.</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our Platform.</li>
              </ul>
              <p className="mt-4">
                You can manage cookie preferences through your browser settings. Disabling essential cookies may affect Platform functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">9. Children's Privacy</h2>
              <p>
                FanMeet is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a minor, we will take steps to delete it promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page with a new "Last updated" date. Your continued use of the Platform after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">11. Contact Us</h2>
              <p className="mb-4">If you have questions about this Privacy Policy or our data practices, please contact us:</p>
              <div className="rounded-lg bg-[#F8F9FA] p-4">
                <p className="font-medium text-[#212529]">FanMeet Technologies Private Limited</p>
                <p>Email: privacy@fanmeet.live</p>
                <p>Support: support@fanmeet.live</p>
                <p>Address: Bangalore, Karnataka, India</p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">12. Grievance Officer</h2>
              <p className="mb-4">
                In accordance with the Information Technology Act, 2000 and rules made thereunder, the name and contact details of the Grievance Officer are provided below:
              </p>
              <div className="rounded-lg bg-[#F8F9FA] p-4">
                <p className="font-medium text-[#212529]">Grievance Officer</p>
                <p>Name: FanMeet Support Team</p>
                <p>Email: grievance@fanmeet.live</p>
                <p>Response Time: Within 24 hours of receipt</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1B1C1F] px-6 py-8 text-center text-sm text-[#6C757D]">
        <p>© {new Date().getFullYear()} FanMeet. Made with ❤️ in India. All rights reserved.</p>
      </footer>
    </div>
  );
}
