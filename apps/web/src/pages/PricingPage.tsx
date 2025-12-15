import { Card, CardContent, CardHeader, Button } from '@fanmeet/ui';
import { useNavigate } from 'react-router-dom';

export function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Pricing</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">Transparent pricing, low-risk bidding.</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          FanMeet uses a bidding model for paid events and a lucky draw model for free events. If you do not win a paid
          event, you receive an automatic refund as per our refund policy.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card elevated>
          <CardHeader title="Paid Events (Bidding)" subtitle="Highest bid wins a 1:1 video call." />
          <CardContent className="space-y-3 text-sm text-[#6C757D]">
            <ul className="list-disc space-y-1 pl-5">
              <li>Base prices typically start at ₹50 / ₹100.</li>
              <li>Winning bid gets the scheduled call.</li>
              <li>Non-winning bids get an automatic refund (typically 90%).</li>
            </ul>
            <Button size="sm" onClick={() => navigate('/browse-events')}>Browse Paid Events</Button>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader title="Free Events (Lucky Draw)" subtitle="Join for ₹0 and get selected randomly." />
          <CardContent className="space-y-3 text-sm text-[#6C757D]">
            <ul className="list-disc space-y-1 pl-5">
              <li>No payment required to participate.</li>
              <li>Winners are selected fairly after entry closes.</li>
              <li>Same 1:1 call experience as paid events.</li>
            </ul>
            <Button size="sm" variant="secondary" onClick={() => navigate('/free-events')}>Explore Free Events</Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card elevated className="border-dashed border-[#E9ECEF] bg-[#F8F9FA]">
          <CardHeader title="Refunds" subtitle="Built-in safety for fans." />
          <CardContent className="text-sm text-[#6C757D]">
            Read the full policy at <a className="underline" href="/refund-policy">/refund-policy</a>.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
