import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

const pricingTiers = [
  {
    id: 'tier-1',
    name: '₹50 Base',
    commission: '10%',
    autoRefund: '90% (₹45) to non-winners',
    creatorShare: '₹45',
    description: 'Default entry level for new creators',
  },
  {
    id: 'tier-2',
    name: '₹100 Base',
    commission: '10%',
    autoRefund: '90% (₹90) to non-winners',
    creatorShare: '₹90',
    description: 'Popular with top creators; adds premium experience',
  },
  {
    id: 'tier-3',
    name: 'Custom Pricing',
    commission: '8% – 15%',
    autoRefund: 'Configurable',
    creatorShare: 'Varies',
    description: 'For special campaigns or brand partnerships',
  },
];

const coupons = [
  { code: 'WELCOME90', usage: 'New fans only', discount: '₹10 off first bid', status: 'Active', expires: 'Mar 31, 2025' },
  { code: 'CREATORBOOST', usage: 'Selected creators', discount: 'Platform commission 5% for 1 week', status: 'Scheduled', expires: 'Feb 15, 2025' },
];

export function AdminSettingsPricing() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Pricing &amp; Commission</h1>
          <p className="text-sm text-[#6C757D]">Control base pricing, creator revenue share, and promotional coupons.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Preview Pricing Page</Button>
          <Button>Save Changes</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Commission Defaults" subtitle="Adjust global platform take rate and overrides." />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput label="Default Commission" defaultValue="10%" />
          <TextInput label="Creator Bonus Pool" defaultValue="₹50,000" />
          <TextInput label="Fast Payout Fee" defaultValue="₹20" />
          <TextInput label="Minimum Bid Increment" defaultValue="₹20" />
          <div className="md:col-span-2">
            <TextArea label="Commission Policy Notes" rows={3} placeholder="Display to creators during onboarding" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Pricing Tiers" subtitle="Current catalogue offered to creators." />
        <CardContent className="space-y-4">
          {pricingTiers.map((tier) => (
            <div key={tier.id} className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{tier.name}</h2>
                  <p className="text-[#6C757D]">{tier.description}</p>
                </div>
                <Badge variant="primary">{tier.commission}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-3 text-[#6C757D]">
                <span>Auto-refund: {tier.autoRefund}</span>
                <span>Creator share per win: {tier.creatorShare}</span>
                <span>Commission: {tier.commission}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary">
                  Edit Tier
                </Button>
                <Button size="sm" variant="ghost">
                  Duplicate
                </Button>
                <Button size="sm" variant="danger">
                  Disable
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Coupons &amp; Incentives" subtitle="Manage promotions to drive conversions." />
        <CardContent className="overflow-x-auto text-sm">
          <table className="min-w-full table-auto border-collapse text-left">
            <thead className="text-[#6C757D]">
              <tr>
                <th className="border-b border-[#E9ECEF] py-3">Code</th>
                <th className="border-b border-[#E9ECEF] py-3">Usage</th>
                <th className="border-b border-[#E9ECEF] py-3">Benefit</th>
                <th className="border-b border-[#E9ECEF] py-3">Status</th>
                <th className="border-b border-[#E9ECEF] py-3">Expires</th>
                <th className="border-b border-[#E9ECEF] py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.code} className="border-b border-[#E9ECEF]">
                  <td className="py-3 text-[#212529]">{coupon.code}</td>
                  <td className="py-3 text-[#6C757D]">{coupon.usage}</td>
                  <td className="py-3 text-[#212529]">{coupon.discount}</td>
                  <td className="py-3">
                    <Badge variant={coupon.status === 'Active' ? 'success' : 'warning'}>{coupon.status}</Badge>
                  </td>
                  <td className="py-3 text-[#6C757D]">{coupon.expires}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button size="sm" variant="secondary">
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost">
                        Pause
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
