import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, Button, TextInput, TextArea, Badge } from '@fanmeet/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const channelStatusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'default'> = {
  Connected: 'success',
  'Reconnect required': 'warning',
};

export function CreatorSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  const [profile, setProfile] = useState({
    display_name: '',
    username: '',
    bio: '',
    category: '',
    primary_language: ''
  });

  const [bankDetails, setBankDetails] = useState({
    bank_account_number: '',
    bank_ifsc: '',
    bank_account_name: '',
    upi_id: ''
  });

  const [settings, setSettings] = useState({
    contact_email: '',
    phone_number: '',
    sms_alerts: false,
    share_calendar: false
  });

  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile({
            display_name: profileData.display_name || '',
            username: profileData.username || '',
            bio: profileData.bio || '',
            category: profileData.category || '',
            primary_language: profileData.primary_language || ''
          });
          setBankDetails({
            bank_account_number: profileData.bank_account_number || '',
            bank_ifsc: profileData.bank_ifsc || '',
            bank_account_name: profileData.bank_account_name || '',
            upi_id: profileData.upi_id || ''
          });
        }

        // Fetch settings
        const { data: settingsData } = await supabase
          .from('creator_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (settingsData) {
          setSettings({
            contact_email: settingsData.contact_email || '',
            phone_number: settingsData.phone_number || '',
            sms_alerts: settingsData.sms_alerts || false,
            share_calendar: settingsData.share_calendar || false
          });
        }

        // Fetch channels
        const { data: channelsData } = await supabase
          .from('linked_channels')
          .select('*')
          .eq('user_id', user.id);

        if (channelsData) {
          setChannels(channelsData);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('user_id', user.id);

      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveContact = async () => {
    if (!user) return;
    setSavingContact(true);
    try {
      const { data: existing } = await supabase.from('creator_settings').select('user_id').eq('user_id', user.id).single();

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('creator_settings')
          .update(settings)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('creator_settings')
          .insert({ ...settings, user_id: user.id });
        error = insertError;
      }

      if (error) throw error;
      alert('Contact settings updated successfully!');
    } catch (error) {
      console.error('Error updating contact settings:', error);
      alert('Failed to update contact settings.');
    } finally {
      setSavingContact(false);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!user) return;
    setSavingBank(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(bankDetails)
        .eq('user_id', user.id);

      if (error) throw error;
      alert('Bank details updated successfully! Your earnings will be auto-withdrawn to this account after 24 hours.');
    } catch (error) {
      console.error('Error updating bank details:', error);
      alert('Failed to update bank details.');
    } finally {
      setSavingBank(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#212529]">Settings</h1>
        <p className="text-sm text-[#6C757D]">
          Fine-tune your public profile, contact preferences, and streaming setup.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card elevated>
          <CardHeader title="Profile information" subtitle="Fans see these details before bidding." />
          <CardContent className="gap-5">
            <TextInput
              label="Display name"
              placeholder="Your Name"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            />
            <TextInput
              label="Public username"
              placeholder="@username"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            />
            <TextArea
              label="Bio"
              placeholder="Tell your fans what to expect..."
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Category"
                placeholder="e.g. Music, Tech"
                value={profile.category}
                onChange={(e) => setProfile({ ...profile, category: e.target.value })}
              />
              <TextInput
                label="Primary language"
                placeholder="e.g. English"
                value={profile.primary_language}
                onChange={(e) => setProfile({ ...profile, primary_language: e.target.value })}
              />
            </div>
            <Button size="lg" onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save profile'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Contact settings" subtitle="We’ll use this for payouts and urgent reminders." />
          <CardContent className="gap-4">
            <TextInput
              label="Contact email"
              placeholder="email@example.com"
              value={settings.contact_email}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            />
            <TextInput
              label="Phone number"
              placeholder="+1 234 567 8900"
              value={settings.phone_number}
              onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
            />
            <label className="flex items-center gap-3 text-sm text-[#212529]">
              <input
                type="checkbox"
                checked={settings.sms_alerts}
                onChange={(e) => setSettings({ ...settings, sms_alerts: e.target.checked })}
                className="h-5 w-5 rounded border-[#CBD5F5] text-[#C045FF] focus:ring-[#C045FF]"
              />
              Send SMS alerts for high-value bids
            </label>
            <label className="flex items-center gap-3 text-sm text-[#212529]">
              <input
                type="checkbox"
                checked={settings.share_calendar}
                onChange={(e) => setSettings({ ...settings, share_calendar: e.target.checked })}
                className="h-5 w-5 rounded border-[#CBD5F5] text-[#C045FF] focus:ring-[#C045FF]"
              />
              Share calendar availability with FanMeet team
            </label>
            <Button variant="secondary" className="self-start" onClick={handleSaveContact} disabled={savingContact}>
              {savingContact ? 'Updating...' : 'Update contact info'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card elevated>
        <CardHeader 
          title="Bank & Payout Details" 
          subtitle="Add your bank account or UPI for automatic withdrawals. Earnings are auto-transferred 24 hours after event completion." 
        />
        <CardContent className="gap-5">
          <div className="rounded-[12px] bg-[#F4E6FF]/60 p-4">
            <p className="text-sm text-[#6C757D]">
              💰 <strong>Auto-withdrawal:</strong> Your earnings (90% after platform fee) are automatically transferred to your account 24 hours after each event ends. Add either bank account OR UPI details below.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Bank Account Number"
              placeholder="Enter account number"
              value={bankDetails.bank_account_number}
              onChange={(e) => setBankDetails({ ...bankDetails, bank_account_number: e.target.value })}
            />
            <TextInput
              label="IFSC Code"
              placeholder="e.g. HDFC0001234"
              value={bankDetails.bank_ifsc}
              onChange={(e) => setBankDetails({ ...bankDetails, bank_ifsc: e.target.value.toUpperCase() })}
            />
          </div>
          <TextInput
            label="Account Holder Name"
            placeholder="Name as per bank records"
            value={bankDetails.bank_account_name}
            onChange={(e) => setBankDetails({ ...bankDetails, bank_account_name: e.target.value })}
          />
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[#E9ECEF]" />
            <span className="text-sm text-[#6C757D]">OR</span>
            <div className="h-px flex-1 bg-[#E9ECEF]" />
          </div>
          <TextInput
            label="UPI ID"
            placeholder="yourname@upi"
            value={bankDetails.upi_id}
            onChange={(e) => setBankDetails({ ...bankDetails, upi_id: e.target.value })}
          />
          <Button size="lg" onClick={handleSaveBankDetails} disabled={savingBank}>
            {savingBank ? 'Saving...' : 'Save Payout Details'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Streaming & channel integrations"
          subtitle="Connect tools to streamline your live experiences."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          {channels.map((channel) => (
            <div key={channel.id} className="flex flex-col gap-3 rounded-[14px] border border-[#E9ECEF] bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-[#212529]">{channel.platform}</p>
                <span className="text-sm text-[#6C757D]">{channel.handle}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={channelStatusVariant[channel.status] ?? 'default'}>{channel.status}</Badge>
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          ))}
          {channels.length === 0 && (
            <p className="text-sm text-[#6C757D]">No channels connected yet.</p>
          )}
          <Button variant="ghost" className="self-start">
            + Connect new channel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
