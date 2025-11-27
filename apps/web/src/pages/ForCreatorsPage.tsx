import { Card, CardContent, CardHeader, Button, Badge } from '@fanmeet/ui';

const sampleStats = [
  {
    label: 'Typical monthly earnings',
    value: '₹30k–₹50k',
    note: 'for active mid-sized creators',
  },
  {
    label: 'Refund handled by FanMeet',
    value: '90%',
    note: 'we manage all payment flows',
  },
  {
    label: 'Average call length',
    value: '5–10 min',
    note: 'short, meaningful conversations',
  },
];

export function ForCreatorsPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">For Creators</p>
          <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">
            Turn your audience into premium, live 1:1 experiences.
          </h1>
          <p className="max-w-xl text-sm text-[#6C757D] md:text-base">
            This is a public overview page about the creator side of FanMeet. Share it with potential creators
            before they sign up.
          </p>
        </div>
        <Badge variant="primary" className="self-start md:self-auto">
          Early creator program open
        </Badge>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {sampleStats.map((stat) => (
          <Card key={stat.label} elevated>
            <CardHeader title={stat.label} />
            <CardContent className="space-y-1 text-sm text-[#6C757D]">
              <div className="text-xl font-semibold text-[#050014]">{stat.value}</div>
              <div className="text-xs text-[#6C757D]">{stat.note}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <Card elevated className="bg-[#050014] text-white">
          <CardHeader
            title="Why creators love FanMeet"
            subtitle="You focus on the conversation. We handle everything else."
          />
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            <ul className="space-y-1 list-disc pl-5 text-white/80">
              <li>Host paid or free events for superfans.</li>
              <li>Flexible schedule that fits around your content calendar.</li>
              <li>Dashboard to track bids, winners, and upcoming calls.</li>
            </ul>
            <ul className="space-y-1 list-disc pl-5 text-white/80">
              <li>Secure payments, refunds, and payouts managed by FanMeet.</li>
              <li>Human review of fans and clear safety controls for calls.</li>
              <li>Dedicated support team for you and your community.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card elevated className="border-dashed border-[#E9ECEF] bg-[#F8F9FA]">
          <CardHeader
            title="Interested in hosting events?"
            subtitle="Start by creating a creator account. You can explore the dashboard before running your first event."
          />
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-md text-sm text-[#6C757D]">
              Use the login / sign up button in the header when you are ready. Once you are in, switch to the
              creator panel from the role selector.
            </p>
            <Button size="sm">Login / Sign up</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
