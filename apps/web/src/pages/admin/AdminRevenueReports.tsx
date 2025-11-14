import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';

const reportTemplates = [
  {
    id: 'rr-1',
    name: 'Monthly Revenue Summary',
    cadence: 'Every 1st of the month',
    recipients: ['finance@fanmeet.com', 'ceo@fanmeet.com'],
    lastRun: 'Jan 01, 2025',
    nextRun: 'Feb 01, 2025',
    format: 'CSV, PDF',
  },
  {
    id: 'rr-2',
    name: 'Weekly Paid Event Report',
    cadence: 'Every Monday',
    recipients: ['ops@fanmeet.com'],
    lastRun: 'Jan 13, 2025',
    nextRun: 'Jan 20, 2025',
    format: 'CSV',
  },
];

const customReportConfigs = [
  { label: 'Date Range', value: 'Jan 01 – Jan 12, 2025' },
  { label: 'Grouping', value: 'Daily totals' },
  { label: 'Breakdowns', value: 'Event type, Creator, Region' },
  { label: 'Metrics', value: 'Gross revenue, Commission, Refunds, Net payout' },
];

const recentExports = [
  {
    id: 'export-345',
    report: 'Monthly Revenue Summary',
    generated: 'Jan 01 · 6:05 AM',
    status: 'Ready',
    download: 'export345.csv',
  },
  {
    id: 'export-344',
    report: 'Weekly Paid Event Report',
    generated: 'Jan 13 · 8:30 AM',
    status: 'Ready',
    download: 'export344.csv',
  },
  {
    id: 'export-343',
    report: 'Adhoc Revenue Report',
    generated: 'Jan 10 · 2:15 PM',
    status: 'Expired',
    download: 'export343.csv',
  },
];

export function AdminRevenueReports() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Revenue Reports</h1>
          <p className="text-sm text-[#6C757D]">Automate exports, schedule recurring deliveries, and generate custom reports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Schedule New Report</Button>
          <Button>Create Adhoc Report</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Scheduled Reports" subtitle="Recurring revenue snapshots and distribution." />
        <CardContent className="space-y-4">
          {reportTemplates.map((template) => (
            <div
              key={template.id}
              className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{template.name}</h2>
                  <p className="text-[#6C757D]">Runs {template.cadence}</p>
                </div>
                <Badge variant="primary">{template.format}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-[#6C757D]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Recipients</p>
                  <p>{template.recipients.join(', ')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Last Run</p>
                  <p>{template.lastRun}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Next Run</p>
                  <p>{template.nextRun}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Formats</p>
                  <p>{template.format}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary">
                  Edit
                </Button>
                <Button size="sm" variant="ghost">
                  Send Now
                </Button>
                <Button size="sm" variant="danger">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Generate Custom Report" subtitle="Select metrics, filters, and delivery preferences." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="Date Range" placeholder="From - To" />
          <TextInput label="Event Filter" placeholder="All events / Paid / Free / Creator" />
          <TextInput label="Payout Status" placeholder="All / Pending / Paid" />
          <TextInput label="File Format" placeholder="CSV / PDF / Excel" />
          <div className="md:col-span-2 grid gap-3 rounded-[16px] border border-[#E9ECEF] bg-white p-5 text-sm text-[#212529]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Current Configuration</p>
            <ul className="space-y-2 text-[#6C757D]">
              {customReportConfigs.map((config) => (
                <li key={config.label} className="flex items-center justify-between gap-4">
                  <span>{config.label}</span>
                  <span className="font-medium text-[#212529]">{config.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button variant="secondary">Preview</Button>
            <Button>Export</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Recent Exports" subtitle="Download the most recent generated files." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Export ID</th>
                <th className="border-b border-[#E9ECEF] py-3">Report</th>
                <th className="border-b border-[#E9ECEF] py-3">Generated</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Download</th>
              </tr>
            </thead>
            <tbody>
              {recentExports.map((exportItem) => (
                <tr key={exportItem.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#6C757D]">{exportItem.id}</td>
                  <td className="py-3 text-[#212529]">{exportItem.report}</td>
                  <td className="py-3 text-[#6C757D]">{exportItem.generated}</td>
                  <td className="py-3">
                    <Badge variant={exportItem.status === 'Ready' ? 'success' : 'warning'}>{exportItem.status}</Badge>
                  </td>
                  <td className="py-3">
                    <Button size="sm" variant="ghost">
                      {exportItem.status === 'Ready' ? 'Download' : 'Regenerate'}
                    </Button>
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
