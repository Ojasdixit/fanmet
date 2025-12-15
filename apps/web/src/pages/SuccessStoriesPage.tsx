import { Card, CardContent, CardHeader } from '@fanmeet/ui';

const stories = [
  {
    title: 'From Fan to Friend',
    body: 'A fan won a call, got streaming tips, and became a familiar face in the creator’s community.',
  },
  {
    title: 'Career-Changing Advice',
    body: 'A short 10-minute call helped a fan gain clarity and take action with confidence.',
  },
  {
    title: 'A Gift That Made Her Cry',
    body: 'A meaningful birthday call turned into a memory that lasted far longer than any material gift.',
  },
];

export function SuccessStoriesPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Success Stories</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">Stories from fans and creators</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          Real outcomes from short conversations.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stories.map((s) => (
          <Card key={s.title} elevated>
            <CardHeader title={s.title} />
            <CardContent className="text-sm text-[#6C757D]">{s.body}</CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
