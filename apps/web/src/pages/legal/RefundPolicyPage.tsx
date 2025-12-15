import { useNavigate } from 'react-router-dom';
import { Button } from '@fanmeet/ui';

export function RefundPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
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

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm md:p-12">
          <h1 className="mb-2 text-3xl font-bold text-[#212529]">Refund Policy</h1>
          <p className="mb-8 text-sm text-[#6C757D]">Last updated: December 15, 2024</p>

          <div className="space-y-8 text-sm text-[#495057]">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#212529]">1. Overview</h2>
              <p>
                FanMeet runs paid creator events using bidding (auction-style). To make bidding low-risk, we provide automatic refunds for non-winning bids and full refunds in specific failure cases.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#212529]">2. Refund Cases</h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                  <div className="font-semibold text-[#212529]">A) You do not win the bid — 90% refund</div>
                  <div className="mt-1">
                    If you placed a bid but did not win, we automatically refund <strong>90%</strong> of your bid amount.
                    The remaining 10% covers payment gateway and processing costs.
                  </div>
                </div>

                <div className="rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                  <div className="font-semibold text-[#212529]">B) Creator cancels the event — 100% refund</div>
                  <div className="mt-1">All bidders receive a full refund if the creator cancels the event.</div>
                </div>

                <div className="rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                  <div className="font-semibold text-[#212529]">C) Creator no-show — 100% refund (winner)</div>
                  <div className="mt-1">If the creator does not join at the scheduled time, the event winner gets a full refund.</div>
                </div>

                <div className="rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                  <div className="font-semibold text-[#212529]">D) Platform technical failure — 100% refund or reschedule</div>
                  <div className="mt-1">
                    If the call fails due to FanMeet platform issues, we may provide either a full refund or a rescheduled call.
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#212529]">3. Non-Refundable Cases</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li><strong>Winner completed the call successfully:</strong> no refund.</li>
                <li><strong>Fan no-show:</strong> if you win but do not join, the payment is not refundable.</li>
                <li><strong>Fan-side connectivity/device issues:</strong> issues caused by your internet/device are not refundable.</li>
                <li><strong>Policy violations:</strong> abusive or prohibited conduct can void eligibility.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#212529]">4. Processing Time</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>Refunds are typically initiated within 24-48 hours after eligibility is confirmed.</li>
                <li>Bank/payment providers may take 5-7 business days to complete the refund.</li>
                <li>Refunds are always sent to the original payment method.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#212529]">5. Contact</h2>
              <div className="rounded-xl border border-[#E9ECEF] bg-white p-4">
                <div className="font-semibold text-[#212529]">Need help with a refund?</div>
                <div className="mt-1">Email: support@fanmeet.live</div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-[#1B1C1F] px-6 py-8 text-center text-sm text-[#6C757D]">
        <p>© {new Date().getFullYear()} FanMeet. Made with ❤️ in India. All rights reserved.</p>
      </footer>
    </div>
  );
}
