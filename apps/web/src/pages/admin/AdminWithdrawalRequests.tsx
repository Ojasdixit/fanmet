import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const pendingWithdrawals = [
  {
    id: '#WR-456',
    creator: 'Priya Sharma',
    username: '@priyasharma',
    amount: '₹2,340',
    method: 'UPI · priya@oksbi',
    requestedOn: 'Jan 12, 2025 · 10:30 AM',
    pendingFor: '2 hours',
    earnings: {
      total: '₹45,600',
      withdrawn: '₹43,260',
      pendingBalance: '₹2,340',
    },
  },
  {
    id: '#WR-455',
    creator: 'Rohan Verma',
    username: '@rohantech',
    amount: '₹3,200',
    method: 'Bank · HDFC ••8290',
    requestedOn: 'Jan 12, 2025 · 9:10 AM',
    pendingFor: '3 hours',
    earnings: {
      total: '₹38,200',
      withdrawn: '₹35,000',
      pendingBalance: '₹3,200',
    },
  },
];

const history = [
  { id: '#WR-454', creator: 'Amit Gupta', amount: '₹1,800', method: 'UPI', status: 'Paid', date: 'Jan 11 · 5:05 PM' },
  { id: '#WR-453', creator: 'Neha Kapoor', amount: '₹2,100', method: 'Bank', status: 'Rejected', date: 'Jan 11 · 3:18 PM' },
  { id: '#WR-452', creator: 'Raj Malhotra', amount: '₹1,450', method: 'UPI', status: 'Paid', date: 'Jan 10 · 2:40 PM' },
];

export function AdminWithdrawalRequests() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Withdrawal Requests</h1>
          <p className="text-sm text-[#6C757D]">Verify payouts, capture references, and keep the audit trail healthy.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export Pending</Button>
          <Button>Mark Batch as Paid</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Pending" subtitle="Requests needing manual review or payment confirmation." />
        <CardContent className="space-y-4">
          {pendingWithdrawals.map((request) => (
            <div key={request.id} className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#212529]">{request.creator}</h2>
                  <p className="text-sm text-[#6C757D]">
                    {request.username} · Requested {request.pendingFor} ago
                  </p>
                </div>
                <Badge variant="warning">Awaiting payout</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm text-[#212529]">
                  <p>Request ID: <strong>{request.id}</strong></p>
                  <p>Amount: <strong>{request.amount}</strong></p>
                  <p>Method: {request.method}</p>
                  <p>Requested On: {request.requestedOn}</p>
                </div>
                <div className="space-y-2 rounded-[12px] bg-white p-4 text-sm text-[#212529]">
                  <p className="text-[#6C757D]">Creator Earnings Breakdown</p>
                  <p>Total Earnings: <strong>{request.earnings.total}</strong></p>
                  <p>Withdrawn: <strong>{request.earnings.withdrawn}</strong></p>
                  <p>Pending Balance: <strong>{request.earnings.pendingBalance}</strong></p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-[12px] border border-[#E9ECEF] bg-white p-4">
                  <p className="text-sm font-semibold text-[#212529]">Mark as Paid</p>
                  <TextInput label="Gateway Reference ID" placeholder="pay_xyz123" />
                  <TextInput label="Payment Date" placeholder="Jan 12, 2025" />
                  <TextArea label="Admin Notes" rows={2} placeholder="Optional note for audit log" />
                  <label className="flex items-center gap-2 text-xs text-[#6C757D]">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#CED4DA]" />
                    Send confirmation email to creator
                  </label>
                  <div className="flex gap-2">
                    <Button size="sm">Confirm Payment</Button>
                    <Button size="sm" variant="ghost">
                      Upload Proof
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 rounded-[12px] border border-[#E9ECEF] bg-white p-4">
                  <p className="text-sm font-semibold text-[#212529]">Reject or Hold</p>
                  <TextInput label="Reason" placeholder="Insufficient balance / pending dispute / ..." />
                  <TextArea label="Message to creator" rows={2} placeholder="Explain next steps" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger">
                      Reject Request
                    </Button>
                    <Button size="sm" variant="secondary">
                      Put on Hold
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="History" subtitle="Resolved withdrawal requests across the platform." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-left text-sm">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">ID</th>
                <th className="border-b border-[#E9ECEF] py-3">Creator</th>
                <th className="border-b border-[#E9ECEF] py-3">Amount</th>
                <th className="border-b border-[#E9ECEF] py-3">Method</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Date</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#6C757D]">{entry.id}</td>
                  <td className="py-3 text-[#212529]">{entry.creator}</td>
                  <td className="py-3 text-[#212529]">{entry.amount}</td>
                  <td className="py-3 text-[#212529]">{entry.method}</td>
                  <td className="py-3">
                    <Badge variant={entry.status === 'Paid' ? 'success' : 'danger'}>{entry.status}</Badge>
                  </td>
                  <td className="py-3 text-[#6C757D]">{entry.date}</td>
                  <td className="py-3">
                    <Button size="sm" variant="ghost">
                      View Log
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
