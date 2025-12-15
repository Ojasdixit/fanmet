import { Card, CardContent, CardHeader } from '@fanmeet/ui';

const posts = [
  { title: 'Why live 1:1 beats DMs', date: 'Dec 2024', excerpt: 'Real conversations, real community.' },
  { title: 'Creator safety on FanMeet', date: 'Dec 2024', excerpt: 'How we review creators and protect fans.' },
  { title: 'Understanding our refund rules', date: 'Dec 2024', excerpt: 'Transparent refunds that keep bidding low-risk.' },
];

export function BlogPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Blog</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">FanMeet Blog</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">Updates, guides, and product stories.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {posts.map((p) => (
          <Card key={p.title} elevated>
            <CardHeader title={p.title} subtitle={p.date} />
            <CardContent className="text-sm text-[#6C757D]">{p.excerpt}</CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
