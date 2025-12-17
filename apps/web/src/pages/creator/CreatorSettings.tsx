import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, Button, TextInput, TextArea, Badge } from '@fanmeet/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || '';

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
  const [savingSocials, setSavingSocials] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    display_name: '',
    username: '',
    bio: '',
    category: '',
    primary_language: ''
  });

  const [bankDetails, setBankDetails] = useState({
    bank_account_number: '',
    confirm_bank_account_number: '',
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

  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    youtube: '',
    twitter: '',
    linkedin: '',
    website: ''
  });

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
          setProfilePhotoUrl(profileData.profile_photo_url || null);
          setCoverPhotoUrl(profileData.cover_photo_url || null);
          setSocialLinks({
            instagram: profileData.instagram_url || '',
            youtube: profileData.youtube_url || '',
            twitter: profileData.twitter_url || '',
            linkedin: profileData.linkedin_url || '',
            website: profileData.website_url || ''
          });
          setBankDetails({
            bank_account_number: profileData.bank_account_number || '',
            confirm_bank_account_number: profileData.bank_account_number || '',
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
          .maybeSingle();

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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB.');
      return;
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      alert('Cloudinary is not configured. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env.local file.');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'fanmeet/profiles');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      // Update database
      const { error } = await supabase
        .from('profiles')
        .update({ profile_photo_url: imageUrl })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfilePhotoUrl(imageUrl);
      alert('Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to remove your profile photo?')) return;

    setUploadingPhoto(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_photo_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfilePhotoUrl(null);
      alert('Profile photo removed.');
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Failed to remove photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB.');
      return;
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      alert('Cloudinary is not configured.');
      return;
    }

    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'fanmeet/covers');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();

      await supabase
        .from('profiles')
        .update({ cover_photo_url: data.secure_url })
        .eq('user_id', user.id);

      setCoverPhotoUrl(data.secure_url);
      alert('Cover photo updated!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload cover photo.');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleRemoveCover = async () => {
    if (!user || !confirm('Remove your cover photo?')) return;
    setUploadingCover(true);
    try {
      await supabase
        .from('profiles')
        .update({ cover_photo_url: null })
        .eq('user_id', user.id);
      setCoverPhotoUrl(null);
      alert('Cover photo removed.');
    } catch (error) {
      alert('Failed to remove cover photo.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveSocials = async () => {
    if (!user) return;
    setSavingSocials(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          instagram_url: socialLinks.instagram || null,
          youtube_url: socialLinks.youtube || null,
          twitter_url: socialLinks.twitter || null,
          linkedin_url: socialLinks.linkedin || null,
          website_url: socialLinks.website || null
        })
        .eq('user_id', user.id);

      if (error) throw error;
      alert('Social links updated successfully!');
    } catch (error) {
      console.error('Error updating social links:', error);
      alert('Failed to update social links.');
    } finally {
      setSavingSocials(false);
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

    // Validation
    const isUpi = !!bankDetails.upi_id;
    const isBank = !!bankDetails.bank_account_number;

    if (!isUpi && !isBank) {
      alert('Please provide either Bank Account details or a UPI ID.');
      return;
    }

    if (isBank) {
      if (!bankDetails.bank_account_name) {
        alert('Please enter the Account Holder Name.');
        return;
      }
      if (!bankDetails.bank_ifsc || bankDetails.bank_ifsc.length !== 11) {
        alert('Please enter a valid 11-character IFSC code.');
        return;
      }
      if (bankDetails.bank_account_number !== bankDetails.confirm_bank_account_number) {
        alert('Account numbers do not match. Please re-enter.');
        return;
      }
    }

    setSavingBank(true);
    try {
      const payload: any = {
        name: bankDetails.bank_account_name,
        ifsc: bankDetails.bank_ifsc,
        account_number: bankDetails.bank_account_number,
        upi_id: bankDetails.upi_id,
      };

      // 1. Call Edge Function to create Razorpay Contact & Fund Account
      const { data: payoutData, error: payoutError } = await supabase.functions.invoke('create-razorpay-fund-account', {
        body: payload
      });

      if (payoutError) {
        console.error('Edge function error:', payoutError);
        alert(`Verification failed: ${payoutError.message || 'Unknown error'}`);
        setSavingBank(false);
        return;
      }

      // 2. Update Profile in DB
      // Exclude confirm_bank_account_number from standard DB update
      const { confirm_bank_account_number, ...dbUpdates } = bankDetails;

      const updates: any = { ...dbUpdates };
      if (payoutData?.fund_account_id) {
        updates.razorpay_fund_account_id = payoutData.fund_account_id;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      alert('Bank details updated successfully! Your earnings will be available for withdrawal 48 hours after event completion.');
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
            {/* Profile Photo Upload */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-[#212529]">Profile Photo</label>
              <div className="flex items-center gap-4">
                {/* Photo Preview */}
                <div className="relative">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover ring-2 ring-[#C045FF]/20"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#C045FF] to-[#7B2CBF] flex items-center justify-center text-white font-bold text-2xl ring-2 ring-[#C045FF]/20">
                      {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                {/* Upload Controls */}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="profile-photo-upload"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? 'Uploading...' : profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {profilePhotoUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove Photo
                    </Button>
                  )}
                  <p className="text-xs text-[#6C757D]">JPG, PNG, GIF. Max 5MB.</p>
                </div>
              </div>
            </div>

            {/* Cover Photo Upload */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-[#212529]">Cover Photo</label>
              <div className="flex flex-col gap-4">
                {/* Cover Preview */}
                <div className="relative h-32 w-full overflow-hidden rounded-lg border-2 border-dashed border-[#E9ECEF]">
                  {coverPhotoUrl ? (
                    <img
                      src={coverPhotoUrl}
                      alt="Cover"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#FFE5D9] via-white to-[#F4E6FF] flex items-center justify-center">
                      <span className="text-sm text-[#6C757D]">No cover photo</span>
                    </div>
                  )}
                </div>
                {/* Upload Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                    id="cover-photo-upload"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                  >
                    {uploadingCover ? 'Uploading...' : coverPhotoUrl ? 'Change Cover' : 'Upload Cover'}
                  </Button>
                  {coverPhotoUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCover}
                      disabled={uploadingCover}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove Cover
                    </Button>
                  )}
                  <p className="w-full text-xs text-[#6C757D]">Recommended: 1200x300px. JPG, PNG, GIF. Max 5MB.</p>
                </div>
              </div>
            </div>

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
          title="Social Media Links"
          subtitle="Add your social media profiles so fans can find and follow you."
        />
        <CardContent className="gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Instagram"
              placeholder="https://instagram.com/yourhandle"
              value={socialLinks.instagram}
              onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
            />
            <TextInput
              label="YouTube"
              placeholder="https://youtube.com/@yourhandle"
              value={socialLinks.youtube}
              onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Twitter / X"
              placeholder="https://twitter.com/yourhandle"
              value={socialLinks.twitter}
              onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
            />
            <TextInput
              label="LinkedIn"
              placeholder="https://linkedin.com/in/yourprofile"
              value={socialLinks.linkedin}
              onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
            />
          </div>
          <TextInput
            label="Website"
            placeholder="https://yourwebsite.com"
            value={socialLinks.website}
            onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
          />
          <Button size="lg" onClick={handleSaveSocials} disabled={savingSocials}>
            {savingSocials ? 'Saving...' : 'Save Social Links'}
          </Button>
        </CardContent>
      </Card>

      <Card elevated>
        <CardHeader
          title="Bank & Payout Details"
          subtitle="Add your bank account or UPI for automatic withdrawals. Earnings are available 48 hours after event completion."
        />
        <CardContent className="gap-5">
          <div className="rounded-[12px] bg-[#F4E6FF]/60 p-4">
            <p className="text-sm text-[#6C757D]">
              💰 <strong>Auto-withdrawal:</strong> Your earnings (90% after platform fee) become available for withdrawal 48 hours after each event ends. Add either bank account OR UPI details below.
            </p>
          </div>

          {/* Option 1: Bank Account */}
          <div className="flex flex-col gap-4 rounded-xl border border-[#E9ECEF] p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E9ECEF] text-sm font-bold text-[#495057]">1</div>
              <h3 className="font-semibold text-[#212529]">Bank Transfer (NEFT/IMPS)</h3>
            </div>

            <TextInput
              label="Beneficiary Name"
              placeholder="Name as per bank records"
              value={bankDetails.bank_account_name}
              onChange={(e) => setBankDetails({ ...bankDetails, bank_account_name: e.target.value })}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Account Number"
                placeholder="e.g. 1234567890"
                type="password"
                value={bankDetails.bank_account_number}
                onChange={(e) => setBankDetails({ ...bankDetails, bank_account_number: e.target.value })}
              />
              <TextInput
                label="Confirm Account Number"
                placeholder="Re-enter account number"
                value={bankDetails.confirm_bank_account_number}
                onChange={(e) => setBankDetails({ ...bankDetails, confirm_bank_account_number: e.target.value })}
              />
            </div>

            <TextInput
              label="IFSC Code"
              placeholder="e.g. HDFC0001234"
              value={bankDetails.bank_ifsc}
              onChange={(e) => setBankDetails({ ...bankDetails, bank_ifsc: e.target.value.toUpperCase() })}
              maxLength={11}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[#E9ECEF]" />
            <span className="text-sm font-medium text-[#6C757D]">OR USE UPI</span>
            <div className="h-px flex-1 bg-[#E9ECEF]" />
          </div>

          {/* Option 2: UPI */}
          <div className="flex flex-col gap-4 rounded-xl border border-[#E9ECEF] p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E9ECEF] text-sm font-bold text-[#495057]">2</div>
              <h3 className="font-semibold text-[#212529]">UPI ID (VPA)</h3>
            </div>
            <TextInput
              label="UPI ID"
              placeholder="e.g. username@oksbi"
              value={bankDetails.upi_id}
              onChange={(e) => setBankDetails({ ...bankDetails, upi_id: e.target.value })}
            />
          </div>

          <Button size="lg" onClick={handleSaveBankDetails} disabled={savingBank}>
            {savingBank ? 'Verifying & Saving...' : 'Save Payout Details'}
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
