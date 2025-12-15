import { Card, CardContent, CardHeader, Button, Badge } from '@fanmeet/ui';

const roles = [
  { title: 'Full-stack Engineer', location: 'Remote / India', type: 'Full-time' },
  { title: 'Creator Partnerships', location: 'Bangalore / Hybrid', type: 'Full-time' },
  { title: 'Support Associate', location: 'Remote / India', type: 'Part-time' },
];

export function CareersPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Careers</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">We’re hiring</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          Join the team building India’s most trusted creator-fan marketplace.
        </p>
      </section>

      <section className="grid gap-4">
        {roles.map((r) => (
          <Card key={r.title} elevated>
            <CardHeader title={r.title} subtitle={r.location} />
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="primary">{r.type}</Badge>
              <a
                className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#C045FF] px-4 text-sm font-semibold text-white hover:opacity-90"
                href="mailto:careers@fanmeet.live?subject=Job%20Application"
              >
                Apply via Email
              </a>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
