import { Card, CardContent, CardHeader } from '@fanmeet/ui';

export function AboutPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">About</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">About FanMeet</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          FanMeet is an India-first platform for live 1:1 video calls between fans and verified creators.
          We make it simple, safe, and transparent through auctions (paid events) and lucky draws (free events).
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card elevated>
          <CardHeader title="Our mission" />
          <CardContent className="text-sm text-[#6C757D]">
            Help fans build real connections with creators they admire, while helping creators earn fairly and grow stronger communities.
          </CardContent>
        </Card>
        <Card elevated>
          <CardHeader title="Trust & safety" />
          <CardContent className="text-sm text-[#6C757D]">
            Creators are human-verified. Payments are secure via Razorpay. Refunds are automatic based on policy.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
