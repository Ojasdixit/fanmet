import { Button, Card, CardContent, CardHeader, Badge } from '@fanmeet/ui';

const pendingCreators = [
  {
    id: 'creator-1',
    name: 'Rahul Kumar',
    username: '@rahulkumar',
    joined: 'Jan 12, 2025',
    email: 'rahul@example.com',
    phone: '+91 98765 43210',
    bio: 'Content creator with 50K followers focused on lifestyle vlogs.',
    instagram: '@rahulcreates',
    youtube: 'RahulKumar',
  },
];

const approvedCreators = [
  { id: 'creator-2', name: 'Priya Sharma', username: '@priyasharma', events: 12 },
  { id: 'creator-3', name: 'Amit Gupta', username: '@cookingamit', events: 8 },
];

export function AdminCreators() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Creator Approvals</h1>
          <p className="text-sm text-[#ADB5BD]">Review new applications and manage existing creators.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export</Button>
          <Button>Invite Creator</Button>
        </div>
      </div>

      <Card className="bg-[#2C2F33] text-white">
        <CardHeader
          title="Pending Approval"
          subtitle="Creators awaiting manual review before onboarding"
          className="border-b border-[#3A3D42]"
        />
        <CardContent className="gap-6">
          {pendingCreators.map((creator) => (
            <div key={creator.id} className="rounded-[16px] border border-[#3A3D42] bg-[#1F2124] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{creator.name}</div>
                  <div className="text-sm text-[#ADB5BD]">{creator.username}</div>
                </div>
                <Badge variant="primary">Joined {creator.joined}</Badge>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-[#ADB5BD] md:grid-cols-2">
                <div>Email: {creator.email}</div>
                <div>Phone: {creator.phone}</div>
                <div className="md:col-span-2">Bio: {creator.bio}</div>
                <div>📸 Instagram: {creator.instagram}</div>
                <div>🎥 YouTube: {creator.youtube}</div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="danger">❌ Reject</Button>
                <Button>✅ Approve</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-[#2C2F33] text-white">
        <CardHeader title="Approved Creators" />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#ADB5BD]">
              <tr>
                <th className="border-b border-[#3A3D42] py-3">Creator</th>
                <th className="border-b border-[#3A3D42] py-3">Username</th>
                <th className="border-b border-[#3A3D42] py-3">Events</th>
              </tr>
            </thead>
            <tbody>
              {approvedCreators.map((creator) => (
                <tr key={creator.id} className="border-b border-[#3A3D42]">
                  <td className="py-3 text-white">{creator.name}</td>
                  <td className="py-3 text-[#ADB5BD]">{creator.username}</td>
                  <td className="py-3 text-white">{creator.events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
