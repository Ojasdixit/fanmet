import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextInput } from '@fanmeet/ui';
import { formatCurrency } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface PricingSettings {
  default_commission: number;
  min_bid_increment: number;
  fast_payout_fee: number;
  auto_refund_percentage: number;
}

interface PricingTier {
  basePrice: number;
  commission: number;
  creatorShare: number;
  autoRefund: number;
}

export function AdminSettingsPricing() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PricingSettings>({
    default_commission: 10,
    min_bid_increment: 20,
    fast_payout_fee: 20,
    auto_refund_percentage: 90,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate pricing tiers based on settings
  const pricingTiers: PricingTier[] = [
    { basePrice: 50, commission: settings.default_commission, creatorShare: 0, autoRefund: settings.auto_refund_percentage },
    { basePrice: 100, commission: settings.default_commission, creatorShare: 0, autoRefund: settings.auto_refund_percentage },
    { basePrice: 200, commission: settings.default_commission, creatorShare: 0, autoRefund: settings.auto_refund_percentage },
  ].map((tier) => ({
    ...tier,
    creatorShare: tier.basePrice * (1 - tier.commission / 100),
  }));

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('key, value')
          .in('key', ['default_commission', 'min_bid_increment', 'fast_payout_fee', 'auto_refund_percentage']);

        if (error) {
          console.error('Error fetching settings:', error);
          return;
        }

        const newSettings: Record<string, any> = { ...settings };
        for (const row of (data ?? []) as any[]) {
          try {
            newSettings[row.key] = JSON.parse(row.value);
          } catch {
            newSettings[row.key] = row.value;
          }
        }
        setSettings(newSettings as PricingSettings);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: update.value, updated_by: update.updated_by, updated_at: update.updated_at })
          .eq('key', update.key);

        if (error) {
          console.error('Error updating setting:', update.key, error);
        }
      }

      alert('Pricing settings saved successfully!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Pricing &amp; Commission</h1>
          <p className="text-sm text-[#6C757D]">Control base pricing, creator revenue share, and commission rates.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <CardHeader title="Commission Settings" subtitle="Configure platform commission and fees" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Default Commission (%)"
            type="number"
            value={settings.default_commission.toString()}
            onChange={(e) => setSettings({ ...settings, default_commission: parseInt(e.target.value) || 0 })}
          />
          <TextInput
            label="Auto Refund (%)"
            type="number"
            value={settings.auto_refund_percentage.toString()}
            onChange={(e) => setSettings({ ...settings, auto_refund_percentage: parseInt(e.target.value) || 0 })}
          />
          <TextInput
            label="Minimum Bid Increment (₹)"
            type="number"
            value={settings.min_bid_increment.toString()}
            onChange={(e) => setSettings({ ...settings, min_bid_increment: parseInt(e.target.value) || 0 })}
          />
          <TextInput
            label="Fast Payout Fee (₹)"
            type="number"
            value={settings.fast_payout_fee.toString()}
            onChange={(e) => setSettings({ ...settings, fast_payout_fee: parseInt(e.target.value) || 0 })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Revenue Split Preview" subtitle="How revenue is divided based on current settings" />
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[16px] border border-[#C045FF]/30 bg-[#C045FF]/10 p-5 text-center">
            <p className="text-3xl font-bold text-[#C045FF]">{settings.default_commission}%</p>
            <p className="text-sm text-[#6C757D]">Platform Commission</p>
          </div>
          <div className="rounded-[16px] border border-[#28A745]/30 bg-[#28A745]/10 p-5 text-center">
            <p className="text-3xl font-bold text-[#28A745]">{100 - settings.default_commission}%</p>
            <p className="text-sm text-[#6C757D]">Creator Earnings</p>
          </div>
          <div className="rounded-[16px] border border-[#FFC107]/30 bg-[#FFC107]/10 p-5 text-center">
            <p className="text-3xl font-bold text-[#FFC107]">{settings.auto_refund_percentage}%</p>
            <p className="text-sm text-[#6C757D]">Non-Winner Refund</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Pricing Tiers" subtitle="Example pricing calculations based on current settings" />
        <CardContent className="space-y-4">
          {pricingTiers.map((tier) => (
            <div key={tier.basePrice} className="flex flex-col gap-4 rounded-[16px] border border-[#E9ECEF] bg-[#F8F9FA] p-5 text-sm text-[#212529]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{formatCurrency(tier.basePrice)} Base Price</h2>
                  <p className="text-[#6C757D]">Entry-level pricing tier</p>
                </div>
                <Badge variant="primary">{tier.commission}% commission</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-3 text-[#6C757D]">
                <div className="rounded-[12px] bg-white p-3">
                  <p className="text-xs uppercase tracking-wide">Creator Receives</p>
                  <p className="text-lg font-semibold text-[#28A745]">{formatCurrency(tier.creatorShare)}</p>
                </div>
                <div className="rounded-[12px] bg-white p-3">
                  <p className="text-xs uppercase tracking-wide">Platform Gets</p>
                  <p className="text-lg font-semibold text-[#C045FF]">{formatCurrency(tier.basePrice - tier.creatorShare)}</p>
                </div>
                <div className="rounded-[12px] bg-white p-3">
                  <p className="text-xs uppercase tracking-wide">Non-Winner Refund</p>
                  <p className="text-lg font-semibold text-[#FFC107]">{formatCurrency(tier.basePrice * tier.autoRefund / 100)}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Fee Structure" subtitle="Current platform fees" />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5">
            <p className="font-semibold text-[#212529]">Minimum Bid Increment</p>
            <p className="text-2xl font-bold text-[#C045FF]">{formatCurrency(settings.min_bid_increment)}</p>
            <p className="mt-2 text-xs text-[#6C757D]">Minimum amount fans must increase their bids by</p>
          </div>
          <div className="rounded-[16px] border border-[#E9ECEF] bg-white p-5">
            <p className="font-semibold text-[#212529]">Fast Payout Fee</p>
            <p className="text-2xl font-bold text-[#C045FF]">{formatCurrency(settings.fast_payout_fee)}</p>
            <p className="mt-2 text-xs text-[#6C757D]">Fee for instant withdrawal processing</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
