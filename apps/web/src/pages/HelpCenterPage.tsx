import { Card, CardContent, CardHeader, Button } from '@fanmeet/ui';

const articles = [
  { title: 'Payments & bids', desc: 'How bidding works, charges, and refunds.', to: '/pricing' },
  { title: 'Creator approval', desc: 'Verification process and common issues.', to: '/apply' },
  { title: 'Refund policy', desc: 'Read the complete refund policy.', to: '/refund-policy' },
  { title: 'Contact support', desc: 'Reach us for unresolved issues.', to: '/contact' },
];

export function HelpCenterPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Help Center</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">Help Center</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">Quick answers and support resources.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {articles.map((a) => (
          <Card key={a.title} elevated>
            <CardHeader title={a.title} subtitle={a.desc} />
            <CardContent>
              <a
                className="inline-flex h-9 items-center justify-center rounded-[10px] border border-[#E9ECEF] bg-white px-4 text-sm font-semibold text-[#050014] hover:bg-[#F8F9FA]"
                href={a.to}
              >
                Open
              </a>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
