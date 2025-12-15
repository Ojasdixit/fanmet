import { Card, CardContent, CardHeader, Button } from '@fanmeet/ui';
import { useNavigate } from 'react-router-dom';

export function FreeEventsPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Free Events</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">₹0 lucky draw events</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          Join free creator events with zero payment. Winners are chosen randomly after entries close.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card elevated>
          <CardHeader title="How it works" subtitle="Fair selection, simple participation." />
          <CardContent className="text-sm text-[#6C757D]">
            <ul className="list-disc space-y-1 pl-5">
              <li>Select a free event and join the draw.</li>
              <li>Wait for entries to close.</li>
              <li>A winner is selected randomly and notified.</li>
              <li>If selected, you join the call at the scheduled time.</li>
            </ul>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader title="Want more chances?" subtitle="Paid events are bidding-based." />
          <CardContent className="space-y-3 text-sm text-[#6C757D]">
            <p>Paid events let you bid to increase your chance of winning.</p>
            <Button size="sm" onClick={() => navigate('/browse-events')}>Browse Events</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
