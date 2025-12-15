import { Card, CardContent, CardHeader, Avatar } from '@fanmeet/ui';

const team = [
  { name: 'Arjun Singh', role: 'Founder', initials: 'AS' },
  { name: 'Priya Mehta', role: 'Co-Founder', initials: 'PM' },
  { name: 'Rahul Verma', role: 'Tech Lead', initials: 'RV' },
  { name: 'Neha Kapoor', role: 'Customer Support', initials: 'NK' },
  { name: 'Amit Gupta', role: 'Marketing', initials: 'AG' },
  { name: 'Sneha Sharma', role: 'Operations', initials: 'SS' },
];

export function TeamPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Team</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">Our Team</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          We’re a small team based in India building reliable creator-fan experiences.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {team.map((member) => (
          <Card key={member.name} elevated>
            <CardHeader title={member.name} subtitle={member.role} />
            <CardContent className="flex items-center gap-3">
              <Avatar initials={member.initials} size="md" />
              <div className="text-sm text-[#6C757D]">Building FanMeet</div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
