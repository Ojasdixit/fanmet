import { useNavigate } from 'react-router-dom';
import { Button } from '@fanmeet/ui';

export function ContactPage() {
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
          <h1 className="mb-2 text-3xl font-bold text-[#212529]">Contact Us</h1>
          <p className="mb-8 text-sm text-[#6C757D]">
            Need help? We respond fast. Use the details below to reach FanMeet support.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-6">
              <div className="text-sm font-semibold text-[#212529]">Support</div>
              <div className="mt-2 text-sm text-[#495057]">Email: support@fanmeet.live</div>
              <div className="mt-1 text-sm text-[#495057]">Response time: within 24 hours</div>
            </div>

            <div className="rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-6">
              <div className="text-sm font-semibold text-[#212529]">Business / Partnerships</div>
              <div className="mt-2 text-sm text-[#495057]">Email: partners@fanmeet.live</div>
              <div className="mt-1 text-sm text-[#495057]">For brands and creators onboarding</div>
            </div>

            <div className="rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-6">
              <div className="text-sm font-semibold text-[#212529]">Legal</div>
              <div className="mt-2 text-sm text-[#495057]">Email: legal@fanmeet.live</div>
              <div className="mt-1 text-sm text-[#495057]">Privacy & policy requests</div>
            </div>

            <div className="rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-6">
              <div className="text-sm font-semibold text-[#212529]">Registered Office</div>
              <div className="mt-2 text-sm text-[#495057]">Bangalore, Karnataka, India</div>
              <div className="mt-1 text-sm text-[#495057]">(Address can be updated once finalized)</div>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-[#E9ECEF] bg-white p-6">
            <div className="text-sm font-semibold text-[#212529]">Grievance Officer (India)</div>
            <div className="mt-2 text-sm text-[#495057]">Email: grievance@fanmeet.live</div>
            <div className="mt-1 text-sm text-[#495057]">We acknowledge complaints within 24 hours.</div>
          </div>
        </div>
      </main>

      <footer className="bg-[#1B1C1F] px-6 py-8 text-center text-sm text-[#6C757D]">
        <p>© {new Date().getFullYear()} FanMeet. Made with ❤️ in India. All rights reserved.</p>
      </footer>
    </div>
  );
}
