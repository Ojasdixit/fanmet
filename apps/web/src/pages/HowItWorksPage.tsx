import { Card, CardContent, CardHeader } from '@fanmeet/ui';

export function HowItWorksPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">How It Works</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">
          Simple 3-step flow for fans and creators.
        </h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          This page gives a high-level explanation of FanMeet without requiring login. Use it from marketing,
          ads, or the header navigation to explain the product.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card elevated>
          <CardHeader
            title="1. Pick a creator"
            subtitle="Browse public events and choose the creator you want to meet."
          />
          <CardContent className="text-sm text-[#6C757D]">
            Filter by category, price, and availability. Each event clearly shows duration, base price, and
            current winning bid.
          </CardContent>
        </Card>
        <Card elevated>
          <CardHeader
            title="2. Bid or join"
            subtitle="Place a bid for paid events or join free lucky-draw sessions."
          />
          <CardContent className="text-sm text-[#6C757D]">
            Highest bid wins the call. If you do not win, you receive up to 90% of your money back
            automatically.
          </CardContent>
        </Card>
        <Card elevated>
          <CardHeader
            title="3. Meet on video"
            subtitle="Enjoy a live 1:1 video call from your laptop or phone."
          />
          <CardContent className="text-sm text-[#6C757D]">
            Join directly from your FanMeet dashboard at the scheduled time. No extra apps needed.
          </CardContent>
        </Card>
      </section>

      <section>
        <Card elevated className="border-dashed border-[#E9ECEF] bg-[#F8F9FA]">
          <CardHeader
            title="For fans and creators"
            subtitle="Fans get intimate access. Creators get a new revenue stream and deeper community."
          />
          <CardContent className="grid gap-4 md:grid-cols-2 text-sm text-[#6C757D]">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-[#212529]">Fans</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Bid safely with transparent pricing and refund rules.</li>
                <li>Win 5–10 minute live calls with creators you truly care about.</li>
                <li>Ask questions, get advice, or just share a moment.</li>
              </ul>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-semibold text-[#212529]">Creators</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Host live micro-meets with your most engaged supporters.</li>
                <li>Set your own prices and schedule, we handle payments and refunds.</li>
                <li>Turn superfans into long-term community members.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
