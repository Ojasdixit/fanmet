import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const activeAnnouncements = [
  {
    id: 'ann-1',
    title: 'New Year Special - Free Events Available',
    target: 'All Users',
    type: 'Banner',
    start: 'Jan 1, 2025',
    end: 'Jan 15, 2025',
    views: 1234,
    clicks: 456,
    status: 'Active',
  },
  {
    id: 'ann-2',
    title: 'New Feature: Instant Refunds',
    target: 'Fans Only',
    type: 'Modal',
    start: 'Jan 10, 2025',
    end: 'Jan 20, 2025',
    views: 890,
    clicks: 345,
    status: 'Active',
  },
];

const draftAnnouncements = [
  {
    id: 'ann-draft-1',
    title: 'Upcoming Maintenance - Jan 20',
    schedule: 'Jan 19, 2025 · 9:00 PM',
  },
];

export function AdminAnnouncements() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Announcements</h1>
          <p className="text-sm text-[#6C757D]">
            Publish platform-wide communications and monitor their reach.
          </p>
        </div>
        <Button>+ Create Announcement</Button>
      </div>

      <Card>
        <CardHeader title="Composer" subtitle="Draft a new announcement with targeting and scheduling." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="Title" placeholder="Announcement headline" />
          <TextInput label="Target" placeholder="All Users / Fans / Creators" />
          <TextInput label="Display Type" placeholder="Banner / Modal / Email / In-App" />
          <TextInput label="Schedule" placeholder="Immediate / Scheduled" />
          <TextInput label="Expiry" placeholder="Optional end date" />
          <div className="md:col-span-2">
            <TextArea label="Message" rows={4} placeholder="Write the announcement copy here" />
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button variant="secondary">Save Draft</Button>
            <Button>Publish</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Active Announcements" subtitle="Currently scheduled or live notices." />
        <CardContent className="space-y-4">
          {activeAnnouncements.map((announcement) => (
            <div key={announcement.id} className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#212529]">{announcement.title}</h2>
                  <p className="text-sm text-[#6C757D]">
                    Target: {announcement.target} · Type: {announcement.type}
                  </p>
                </div>
                <Badge variant="primary">{announcement.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-[#6C757D]">
                <span>
                  Active: {announcement.start} – {announcement.end}
                </span>
                <span>Views: {announcement.views.toLocaleString()}</span>
                <span>Clicks: {announcement.clicks.toLocaleString()}</span>
                <span>CTR: {((announcement.clicks / Math.max(announcement.views, 1)) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary">
                  Edit
                </Button>
                <Button size="sm" variant="ghost">
                  View Analytics
                </Button>
                <Button size="sm" variant="danger">
                  Deactivate
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Drafts" subtitle="Announcements scheduled or awaiting approval." />
        <CardContent className="space-y-3">
          {draftAnnouncements.map((draft) => (
            <div key={draft.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#E9ECEF] bg-white px-4 py-3 text-sm text-[#212529]">
              <div>
                <div className="font-medium">{draft.title}</div>
                <div className="text-xs text-[#6C757D]">Scheduled for {draft.schedule}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">
                  Edit
                </Button>
                <Button size="sm" variant="ghost">
                  Publish Now
                </Button>
                <Button size="sm" variant="danger">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
