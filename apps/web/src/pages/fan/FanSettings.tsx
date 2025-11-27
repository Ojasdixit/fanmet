import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, TextInput, TextArea, Button, Badge } from '@fanmeet/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface SecurityLogEntry {
  id: string;
  event_type: string;
  created_at: string;
  location: string | null;
}

export function FanSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [language, setLanguage] = useState('');
  const [timezone, setTimezone] = useState('');
  const [securityLogs, setSecurityLogs] = useState<SecurityLogEntry[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('display_name, username, bio, primary_language, timezone')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          setFullName(profileData.display_name || '');
          setUsername(profileData.username || '');
          setBio(profileData.bio || '');
          setLanguage(profileData.primary_language || '');
          setTimezone(profileData.timezone || '');
        }

        // Fetch Security Logs
        const { data: logsData, error: logsError } = await supabase
          .from('security_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (logsError) {
          console.error('Error fetching security logs:', logsError);
        } else if (logsData) {
          setSecurityLogs(logsData);
        }

      } catch (err) {
        console.error('Unexpected error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Check for duplicate username
      if (username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('username', username)
          .neq('user_id', user.id) // Exclude current user
          .maybeSingle();

        if (checkError) {
          console.error('Error checking username:', checkError);
          alert('Error checking username availability.');
          setSaving(false);
          return;
        }

        if (existingUser) {
          alert('Username already taken. Please choose another one.');
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: fullName,
          username: username,
          bio: bio,
          primary_language: language,
          timezone: timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        alert('Error updating profile: ' + error.message);
      } else {
        alert('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#212529]">Settings</h1>
        <p className="text-sm text-[#6C757D]">
          Update your profile details, preferences, and review recent security activity.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card elevated>
          <CardHeader title="Profile" subtitle="Let creators know who they’re meeting." />
          <CardContent className="gap-5">
            <TextInput
              label="Full name"
              placeholder="Your Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
            <TextInput
              label="Public username"
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <TextArea
              label="About you"
              placeholder="Share your interests, favorite creators, and background."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              disabled={loading}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Preferred language"
                placeholder="English"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={loading}
              />
              <TextInput
                label="Timezone"
                placeholder="IST"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button size="lg" onClick={handleSave} disabled={loading || saving}>
              {saving ? 'Saving...' : 'Save profile'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Communication" subtitle="Choose how we keep you informed." />
          <CardContent className="gap-4 text-sm text-[#212529]">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-[#CBD5F5] text-[#C045FF] focus:ring-[#C045FF]" />
              Email me when I’m outbid on an event
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-[#CBD5F5] text-[#C045FF] focus:ring-[#C045FF]" />
              Remind me 24 hours before a meet
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-5 w-5 rounded border-[#CBD5F5] text-[#C045FF] focus:ring-[#C045FF]" />
              Send me creator spotlights and platform updates
            </label>
            <Button variant="secondary" className="self-start">
              Save preferences
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Security activity"
          subtitle="Recent actions that impact your account safety."
          className="border-b border-[#E9ECEF] pb-4"
        />
        <CardContent className="gap-4">
          {securityLogs.length === 0 ? (
            <div className="text-sm text-[#6C757D]">No recent security activity found.</div>
          ) : (
            securityLogs.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-3 rounded-[14px] border border-[#E9ECEF] bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#212529]">{entry.event_type}</h3>
                  <p className="text-sm text-[#6C757D]">
                    {new Date(entry.created_at).toLocaleString()} · {entry.location || 'Unknown Location'}
                  </p>
                </div>
                <Badge variant="default">Logged</Badge>
              </div>
            ))
          )}
          <Button variant="ghost" className="self-start">
            Review all security events →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
