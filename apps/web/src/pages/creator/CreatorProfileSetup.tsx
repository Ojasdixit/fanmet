import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

import { useAuth } from '../../contexts/AuthContext';
import { useCreatorProfiles } from '../../contexts/CreatorProfileContext';

export function CreatorProfileSetup() {
  const { user } = useAuth();
  const { getProfile, upsertProfile } = useCreatorProfiles();

  if (!user || user.role !== 'creator') {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <h1 className="text-xl font-semibold text-[#212529]">Creator profile setup</h1>
        <p className="text-sm text-[#6C757D]">
          Please sign in as a creator to edit your public profile.
        </p>
      </div>
    );
  }

  const existingProfile = getProfile(user.username);
  const initialDisplayName = existingProfile?.displayName || user.email.split('@')[0] || user.username;
  const initialBio =
    existingProfile?.bio ||
    'Tell fans who you are, what you create, and what kind of micro-meets or AMAs they can expect.';

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveProfile = async () => {
    await upsertProfile({ username: user.username, displayName: displayName.trim(), bio: bio.trim() });
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleShareProfile = () => {
    const url = `${window.location.origin}/${user.username}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => {
          window.alert('Profile link copied. Share it with your fans.');
        },
        () => {
          window.prompt('Share this profile link with your fans:', url);
        },
      );
    } else {
      window.prompt('Share this profile link with your fans:', url);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#212529]">Public profile setup</h1>
        <p className="text-sm text-[#6C757D]">
          Update what fans see on your public page.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <Card elevated>
          <CardHeader
            title="Profile details"
            subtitle="These details are shown at the top of your public page."
          />
          <CardContent className="gap-5">
            <TextInput
              label="Display name"
              placeholder="Your public display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            <TextInput
              label="Public username"
              value={`@${user.username}`}
              disabled
              helperText="Your profile link uses this username."
            />
            <TextArea
              label="Bio"
              rows={4}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Short description that appears on your public profile."
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleSaveProfile}>Save profile</Button>
              {profileSaved && (
                <span className="text-xs font-medium text-[#28A745]">Saved. Your public page is updated.</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Public page preview"
            subtitle="Fans visiting your profile will see something like this."
          />
          <CardContent className="gap-4">
            <div className="rounded-[16px] bg-gradient-to-br from-[#FFE5D9] via-white to-[#F4E6FF] p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#050014] text-center text-sm font-semibold leading-10 text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#212529]">{displayName}</span>
                  <span className="text-xs text-[#6C757D]">@{user.username}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#6C757D]">{bio}</p>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-[#6C757D]">
              <p>
                Visit <span className="font-mono font-semibold">/{user.username}</span> to see your public page in a
                new tab.
              </p>
              <Button size="sm" variant="secondary" onClick={handleShareProfile}>
                Share profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
