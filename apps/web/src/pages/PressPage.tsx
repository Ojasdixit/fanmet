import { Card, CardContent, CardHeader, Button } from '@fanmeet/ui';

const items = [
  { title: 'Press kit', desc: 'Logos, screenshots, and basic product info.', href: '#' },
  { title: 'Media inquiries', desc: 'Write to press@fanmeet.live', href: 'mailto:press@fanmeet.live' },
];

export function PressPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Press & Media</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">Press & Media</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          For press inquiries and brand assets.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <Card key={it.title} elevated>
            <CardHeader title={it.title} subtitle={it.desc} />
            <CardContent>
              <a
                className="inline-flex h-9 items-center justify-center rounded-[10px] border border-[#E9ECEF] bg-white px-4 text-sm font-semibold text-[#050014] hover:bg-[#F8F9FA]"
                href={it.href}
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
