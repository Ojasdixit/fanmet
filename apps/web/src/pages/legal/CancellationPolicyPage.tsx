import { useNavigate } from 'react-router-dom';
import { Button } from '@fanmeet/ui';

export function CancellationPolicyPage() {
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
          <h1 className="mb-2 text-3xl font-bold text-[#212529]">Cancellation & Rescheduling Policy</h1>
          <p className="mb-8 text-sm text-[#6C757D]">Last updated: December 15, 2024</p>

          <div className="space-y-8 text-sm text-[#495057]">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#212529]">1. Overview</h2>
              <p>
                FanMeet events are scheduled, time-bound live video calls. Because creators block time and fans bid for limited slots, cancellations and reschedules are handled with clear rules to protect both sides.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#212529]">2. Creator Cancellations</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li><strong>Creator cancels before the event:</strong> all bidders receive a 100% refund.</li>
                <li><strong>Creator no-show:</strong> the winner receives a 100% refund and the creator account may be reviewed.</li>
                <li><strong>Repeated cancellations/no-shows:</strong> may lead to suspension or removal from the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#212529]">3. Fan Cancellations</h2>
              <p className="mb-3">
                Bids are commitments. Once you place a bid, you cannot cancel it because it impacts the auction and other bidders.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li><strong>Non-winning bids:</strong> automatically get 90% refund as per Refund Policy.</li>
                <li><strong>Winning bids:</strong> are not refundable if the call is successfully completed.</li>
                <li><strong>Fan no-show:</strong> if you win but do not join the call, the payment is not refundable.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#212529]">4. Rescheduling</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li><strong>Platform-side technical issue:</strong> we may offer rescheduling or a 100% refund.</li>
                <li><strong>Creator requests reschedule:</strong> we may reschedule with winner consent; otherwise, a 100% refund is processed.</li>
                <li><strong>Fan requests reschedule:</strong> not guaranteed and handled case-by-case through support.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#212529]">5. How to Request Support</h2>
              <div className="rounded-xl border border-[#E9ECEF] bg-white p-4">
                <div className="font-semibold text-[#212529]">Need help?</div>
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
