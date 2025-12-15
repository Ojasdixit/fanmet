import { Card, CardContent, CardHeader } from '@fanmeet/ui';

const faqs = [
  {
    category: 'Fans',
    q: "What if I don't win the bid?",
    a: 'You automatically receive a refund as per our Refund Policy. Typically non-winning bids receive 90% back.',
  },
  {
    category: 'Fans',
    q: 'How do I join a call?'
    ,
    a: 'If you win, you can join directly from your dashboard at the scheduled time. No extra apps needed.',
  },
  {
    category: 'Creators',
    q: 'How do payouts work?'
    ,
    a: 'Creators keep 90% of winning bids (platform fee 10%). Payouts are available after clearance and processed via bank/UPI.',
  },
  {
    category: 'Creators',
    q: 'How do I get approved as a creator?',
    a: 'Apply through the creator program. Our team verifies identity and social presence before approval.',
  },
];

export function FaqPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">FAQs</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">Frequently asked questions</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          Answers for fans and creators. If your question isn’t listed, visit Help Center or Contact Us.
        </p>
      </section>

      <section className="grid gap-4">
        {faqs.map((item) => (
          <Card key={`${item.category}-${item.q}`} elevated>
            <CardHeader title={item.q} subtitle={item.category} />
            <CardContent className="text-sm text-[#6C757D]">{item.a}</CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
