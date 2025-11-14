import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';

const events = [
  { id: '#342', creator: 'Priya S.', title: 'Meet & Greet', status: 'LIVE', bids: 18, amount: '₹450' },
  { id: '#341', creator: 'Rahul K.', title: 'Q&A Session', status: 'SOON', bids: 0, amount: 'Free' },
  { id: '#340', creator: 'Amit G.', title: 'Cooking Demo', status: 'DONE', bids: 23, amount: '₹680' },
];

const statusVariant: Record<string, { label: string; variant: 'danger' | 'primary' | 'success' }> = {
  LIVE: { label: '🔴 LIVE', variant: 'danger' },
  SOON: { label: '⏰ Soon', variant: 'primary' },
  DONE: { label: '✅ Done', variant: 'success' },
};

export function AdminEvents() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Events Monitor</h1>
          <p className="text-sm text-[#ADB5BD]">Track live, upcoming, and completed events.</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Live Now', 'Upcoming', 'Completed'].map((filter) => (
            <Button key={filter} variant={filter === 'All' ? 'secondary' : 'ghost'} size="sm">
              {filter}
            </Button>
          ))}
          <Button variant="secondary">Download Report</Button>
        </div>
      </div>

      <Card className="bg-[#2C2F33] text-white">
        <CardHeader title="Events" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#ADB5BD]">
              <tr>
                <th className="border-b border-[#3A3D42] py-3">ID</th>
                <th className="border-b border-[#3A3D42] py-3">Creator</th>
                <th className="border-b border-[#3A3D42] py-3">Event Title</th>
                <th className="border-b border-[#3A3D42] py-3">Status</th>
                <th className="border-b border-[#3A3D42] py-3">Bids</th>
                <th className="border-b border-[#3A3D42] py-3">Amount</th>
                <th className="border-b border-[#3A3D42] py-3" />
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-[#3A3D42]">
                  <td className="py-3 text-white">{event.id}</td>
                  <td className="py-3 text-[#ADB5BD]">{event.creator}</td>
                  <td className="py-3 text-white">{event.title}</td>
                  <td className="py-3 text-white">
                    <Badge variant={statusVariant[event.status].variant}>{statusVariant[event.status].label}</Badge>
                  </td>
                  <td className="py-3 text-white">{event.bids}</td>
                  <td className="py-3 text-white">{event.amount}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm">
                        View
                      </Button>
                      <Button variant="danger" size="sm">
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
