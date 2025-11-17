import { Badge, Button, Card, CardContent, CardHeader } from '@fanmeet/ui';

const featuredCreators = [
  {
    name: 'Priya Sharma',
    username: '@priyasharma',
    followers: '52K',
    earnings: '₹45,600',
    featuredSince: 'Jan 10, 2025',
  },
  {
    name: 'Rohan Verma',
    username: '@rohantech',
    followers: '48K',
    earnings: '₹38,200',
    featuredSince: 'Jan 8, 2025',
  },
  {
    name: 'Amit Gupta',
    username: '@chefamit',
    followers: '35K',
    earnings: '₹32,100',
    featuredSince: 'Jan 12, 2025',
  },
];

const candidatePool = [
  {
    id: '#C-456',
    name: 'Neha Kapoor',
    username: '@neha.live',
    followers: '28K',
    events: 18,
    winRate: '96%',
  },
  {
    id: '#C-441',
    name: 'Raj Malhotra',
    username: '@rajm',
    followers: '24K',
    events: 22,
    winRate: '92%',
  },
];

export function AdminFeaturedCreators() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Featured Creators</h1>
          <p className="text-sm text-[#6C757D]">Control homepage placement, scheduling, and promotion of spotlighted creators.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Preview Homepage</Button>
          <Button>+ Add Featured Creator</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Current Order" subtitle="Priority influences homepage carousel." />
        <CardContent className="space-y-4">
          {featuredCreators.map((creator, index) => (
            <div
              key={creator.username}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl font-semibold text-[#6C757D]">⋮⋮</div>
                <div>
                  <div className="text-sm text-[#6C757D]">#{index + 1}</div>
                  <div className="text-lg font-semibold text-[#212529]">{creator.name}</div>
                  <div className="text-sm text-[#6C757D]">{creator.username}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#6C757D]">
                <div>
                  Followers <span className="font-semibold text-[#212529]">{creator.followers}</span>
                </div>
                <div>
                  Earned <span className="font-semibold text-[#212529]">{creator.earnings}</span>
                </div>
                <Badge variant="primary">Featured since {creator.featuredSince}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary">
                  Edit Duration
                </Button>
                <Button size="sm" variant="ghost">
                  Preview
                </Button>
                <Button size="sm" variant="danger">
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Candidate Pool" subtitle="High-performing creators suggested for featuring." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Creator</th>
                <th className="border-b border-[#E9ECEF] py-3">Followers</th>
                <th className="border-b border-[#E9ECEF] py-3">Events</th>
                <th className="border-b border-[#E9ECEF] py-3">Completion</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidatePool.map((creator) => (
                <tr key={creator.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-[#212529]">{creator.name}</span>
                      <span className="text-xs text-[#6C757D]">{creator.username}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[#212529]">{creator.followers}</td>
                  <td className="py-3 text-[#212529]">{creator.events}</td>
                  <td className="py-3 text-[#212529]">{creator.winRate}</td>
                  <td className="py-3">
                    <div className="flex gap-2 text-xs">
                      <Button size="sm" variant="secondary">
                        Feature
                      </Button>
                      <Button size="sm" variant="ghost">
                        View Profile
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
