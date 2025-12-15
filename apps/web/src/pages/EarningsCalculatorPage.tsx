import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, TextInput, Badge } from '@fanmeet/ui';

export function EarningsCalculatorPage() {
  const [winningBid, setWinningBid] = useState('500');
  const [platformFeePercent] = useState(10);

  const { gross, fee, net } = useMemo(() => {
    const g = Math.max(parseInt(winningBid || '0', 10) || 0, 0);
    const f = Math.floor((g * platformFeePercent) / 100);
    const n = Math.max(g - f, 0);
    return { gross: g, fee: f, net: n };
  }, [platformFeePercent, winningBid]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-0 md:py-10">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C045FF]">Earnings Calculator</p>
        <h1 className="text-2xl font-semibold text-[#050014] md:text-3xl">Estimate your creator earnings</h1>
        <p className="max-w-2xl text-sm text-[#6C757D] md:text-base">
          Estimate net earnings after the platform fee. This is a simple estimate and may not include payment gateway fees or taxes.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card elevated>
          <CardHeader title="Calculator" subtitle="Try different winning bid amounts." />
          <CardContent className="space-y-4">
            <TextInput
              label="Winning bid amount (₹)"
              type="number"
              min={0}
              value={winningBid}
              onChange={(e) => setWinningBid(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">Platform fee: {platformFeePercent}%</Badge>
              <Badge variant="success">Net: ₹{net}</Badge>
            </div>
            <div className="text-sm text-[#6C757D]">
              Gross ₹{gross} → Fee ₹{fee} → Net ₹{net}
            </div>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader title="Payout notes" subtitle="When can creators withdraw?" />
          <CardContent className="text-sm text-[#6C757D]">
            <ul className="list-disc space-y-1 pl-5">
              <li>Creators must be approved (verified) to withdraw.</li>
              <li>Add bank/UPI details in Settings before withdrawal.</li>
              <li>Earnings may be released after meet completion and clearance window.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
