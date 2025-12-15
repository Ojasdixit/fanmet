import { useNavigate } from 'react-router-dom';
import { Button } from '@fanmeet/ui';

export function TermsOfServicePage() {
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
          <h1 className="mb-2 text-3xl font-bold text-[#212529]">Terms of Service</h1>
          <p className="mb-8 text-sm text-[#6C757D]">Last updated: December 15, 2024</p>

          <div className="prose prose-sm max-w-none text-[#495057]">
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">1. Acceptance of Terms</h2>
              <p className="mb-4">
                Welcome to FanMeet! These Terms of Service ("Terms") constitute a legally binding agreement between you and FanMeet Technologies Private Limited ("FanMeet," "we," "our," or "us") governing your use of the FanMeet platform, website, and services (collectively, the "Platform").
              </p>
              <p className="mb-4">
                By creating an account, accessing, or using our Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Platform.
              </p>
              <p>
                We reserve the right to modify these Terms at any time. Changes will be effective upon posting to the Platform. Your continued use after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">2. Eligibility</h2>
              <p className="mb-4">To use FanMeet, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Be a resident of India (currently, FanMeet operates only in India)</li>
                <li>Have the legal capacity to enter into a binding agreement</li>
                <li>Not be prohibited from using the Platform under applicable laws</li>
                <li>Provide accurate and complete registration information</li>
              </ul>
              <p className="mt-4">
                By using the Platform, you represent and warrant that you meet all eligibility requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">3. Account Registration</h2>
              <h3 className="mb-2 text-lg font-medium text-[#212529]">3.1 Account Creation</h3>
              <p className="mb-4">
                You must create an account to access most features of the Platform. You agree to provide accurate, current, and complete information during registration and keep your account information updated.
              </p>
              
              <h3 className="mb-2 text-lg font-medium text-[#212529]">3.2 Account Security</h3>
              <p className="mb-4">
                You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. Notify us immediately of any unauthorized access or security breach.
              </p>

              <h3 className="mb-2 text-lg font-medium text-[#212529]">3.3 Account Types</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Fan Account:</strong> For users who want to participate in events and connect with creators.</li>
                <li><strong>Creator Account:</strong> For content creators who want to host events and meet their fans. Creator accounts require additional verification and approval.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">4. Platform Services</h2>
              <h3 className="mb-2 text-lg font-medium text-[#212529]">4.1 How FanMeet Works</h3>
              <p className="mb-4">
                FanMeet is a marketplace that facilitates live video calls between fans and creators through an auction-based system:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Creators list events with specified time slots and base prices</li>
                <li>Fans place bids to win video call opportunities</li>
                <li>The highest bidder wins the call when the bidding period ends</li>
                <li>Non-winning bidders receive automatic refunds (90% of bid amount)</li>
                <li>Video calls are conducted through our integrated video platform</li>
              </ul>

              <h3 className="mb-2 text-lg font-medium text-[#212529]">4.2 Free Events</h3>
              <p>
                Some creators may offer free events where winners are selected through a random draw. No payment is required for entry into free events.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">5. Bidding and Payments</h2>
              <h3 className="mb-2 text-lg font-medium text-[#212529]">5.1 Bidding Rules</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>All bids are binding commitments to pay if you win</li>
                <li>Bids cannot be cancelled or withdrawn once placed</li>
                <li>The bid amount is charged immediately upon placement</li>
                <li>Multiple bids on the same event are allowed (only your highest bid counts)</li>
                <li>Minimum bid amounts are set by creators (starting from ₹50 or ₹100)</li>
              </ul>

              <h3 className="mb-2 text-lg font-medium text-[#212529]">5.2 Payment Processing</h3>
              <p className="mb-4">
                All payments are processed securely through Razorpay, our authorized payment gateway. We accept UPI, credit cards, debit cards, and net banking. By making a payment, you agree to Razorpay's terms of service.
              </p>

              <h3 className="mb-2 text-lg font-medium text-[#212529]">5.3 Platform Fee</h3>
              <p>
                FanMeet charges a 10% platform fee on successful transactions. Creators receive 90% of the winning bid amount. This fee covers payment processing, platform maintenance, and support services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">6. Refund Policy</h2>
              <p className="mb-4">
                Please refer to our detailed <a href="/refund-policy" className="text-[#C045FF] underline">Refund Policy</a> for complete information. Key points include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Non-Winning Bids:</strong> 90% refund processed automatically within 5-7 business days</li>
                <li><strong>Creator Cancellation:</strong> 100% refund if the creator cancels the event</li>
                <li><strong>Technical Issues:</strong> 100% refund or reschedule for platform-caused technical failures</li>
                <li><strong>No-Show by Creator:</strong> 100% refund if the creator fails to attend</li>
                <li><strong>10% Processing Fee:</strong> Retained on non-winning bids to cover payment gateway charges</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">7. Creator Terms</h2>
              <h3 className="mb-2 text-lg font-medium text-[#212529]">7.1 Creator Eligibility</h3>
              <p className="mb-4">To become a creator on FanMeet, you must:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Have a minimum of 1,000 followers on any social media platform, OR</li>
                <li>Demonstrate a unique skill or expertise that fans would pay to learn about</li>
                <li>Complete identity verification (KYC) process</li>
                <li>Provide valid bank account or UPI details for payouts</li>
                <li>Receive approval from our team</li>
              </ul>

              <h3 className="mb-2 text-lg font-medium text-[#212529]">7.2 Creator Responsibilities</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Attend all scheduled video calls on time</li>
                <li>Maintain professional and respectful conduct during calls</li>
                <li>Not engage in any illegal, inappropriate, or harmful activities</li>
                <li>Not solicit fans to transact outside the Platform</li>
                <li>Respond to fan messages within reasonable timeframes</li>
              </ul>

              <h3 className="mb-2 text-lg font-medium text-[#212529]">7.3 Payouts</h3>
              <p>
                Creator earnings (90% of winning bids) are available for withdrawal 48 hours after successful event completion. Payouts are processed within 2-3 business days via bank transfer or UPI.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">8. User Conduct</h2>
              <p className="mb-4">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Platform for any illegal purpose or in violation of any laws</li>
                <li>Harass, abuse, threaten, or intimidate other users or creators</li>
                <li>Share explicit, obscene, or inappropriate content during video calls</li>
                <li>Impersonate any person or entity, or falsely represent your affiliation</li>
                <li>Attempt to manipulate bidding through fake accounts or collusion</li>
                <li>Record, screenshot, or distribute video call content without consent</li>
                <li>Circumvent the Platform to arrange direct transactions with creators</li>
                <li>Use bots, scripts, or automated tools to interact with the Platform</li>
                <li>Interfere with or disrupt the Platform's security or functionality</li>
                <li>Upload viruses, malware, or other harmful code</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">9. Intellectual Property</h2>
              <h3 className="mb-2 text-lg font-medium text-[#212529]">9.1 FanMeet's IP</h3>
              <p className="mb-4">
                The Platform, including its design, features, content, and code, is owned by FanMeet and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written permission.
              </p>

              <h3 className="mb-2 text-lg font-medium text-[#212529]">9.2 User Content</h3>
              <p>
                You retain ownership of content you create. By posting content on FanMeet, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content for Platform operation and promotion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">10. Disclaimers</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>The Platform is provided "as is" without warranties of any kind</li>
                <li>We do not guarantee continuous, uninterrupted, or error-free service</li>
                <li>We are not responsible for the conduct of creators or fans during video calls</li>
                <li>We do not endorse or verify the accuracy of creator claims or content</li>
                <li>Video call quality depends on participants' internet connections</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">11. Limitation of Liability</h2>
              <p className="mb-4">
                To the maximum extent permitted by law, FanMeet shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use or inability to use the Platform</li>
                <li>Any conduct or content of third parties on the Platform</li>
                <li>Unauthorized access to your account or data</li>
                <li>Technical failures or service interruptions</li>
              </ul>
              <p className="mt-4">
                Our total liability shall not exceed the amount you paid to FanMeet in the 12 months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">12. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless FanMeet, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">13. Termination</h2>
              <p className="mb-4">
                We may suspend or terminate your account at our discretion, with or without notice, for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Harmful conduct towards other users</li>
                <li>Extended inactivity</li>
                <li>Any other reason we deem appropriate</li>
              </ul>
              <p className="mt-4">
                You may close your account at any time through account settings. Upon termination, your right to use the Platform ceases immediately. Pending payouts will be processed according to our policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">14. Dispute Resolution</h2>
              <h3 className="mb-2 text-lg font-medium text-[#212529]">14.1 Governing Law</h3>
              <p className="mb-4">
                These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.
              </p>

              <h3 className="mb-2 text-lg font-medium text-[#212529]">14.2 Informal Resolution</h3>
              <p>
                Before initiating formal proceedings, you agree to contact us at support@fanmeet.live to attempt to resolve any dispute informally within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">15. General Provisions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and FanMeet.</li>
                <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect.</li>
                <li><strong>Waiver:</strong> Our failure to enforce any right does not constitute a waiver of that right.</li>
                <li><strong>Assignment:</strong> You may not assign your rights under these Terms without our consent.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-[#212529]">16. Contact Information</h2>
              <p className="mb-4">For questions about these Terms, please contact us:</p>
              <div className="rounded-lg bg-[#F8F9FA] p-4">
                <p className="font-medium text-[#212529]">FanMeet Technologies Private Limited</p>
                <p>Email: legal@fanmeet.live</p>
                <p>Support: support@fanmeet.live</p>
                <p>Address: Bangalore, Karnataka, India</p>
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
