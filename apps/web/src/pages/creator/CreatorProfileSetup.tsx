import { useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';

import { useAuth } from '../../contexts/AuthContext';
import { useCreatorProfiles } from '../../contexts/CreatorProfileContext';

export function CreatorProfileSetup() {
  const { user } = useAuth();
  const { getProfile, upsertProfile, getPostsForCreator, addPost, updatePost, deletePost } = useCreatorProfiles();

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

  const creatorPosts = getPostsForCreator(user.username);
  const [newPostText, setNewPostText] = useState('');
  const [savingPostId, setSavingPostId] = useState<string | null>(null);

  const handleSaveProfile = () => {
    upsertProfile({ username: user.username, displayName: displayName.trim(), bio: bio.trim() });
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleAddPost = () => {
    const trimmed = newPostText.trim();
    if (!trimmed) {
      return;
    }

    try {
      addPost({ username: user.username, text: trimmed });
      setNewPostText('');
    } catch (error) {
      // Silent in UI for now; demo environment.
      console.error(error);
    }
  };

  const handleUpdatePost = (postId: string, text: string) => {
    setSavingPostId(postId);
    updatePost(postId, text);
    window.setTimeout(() => setSavingPostId(null), 400);
  };

  const handleDeletePost = (postId: string) => {
    if (!window.confirm('Remove this post from your public page?')) {
      return;
    }
    deletePost(postId);
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
          Update what fans see on your public page and manage the posts that appear under the Posts tab.
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

      <Card>
        <CardHeader
          title="Posts on your public page"
          subtitle="Short updates that appear under the Posts tab on your profile."
        />
        <CardContent className="gap-5">
          <div className="rounded-[14px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
            <TextArea
              label="New post"
              placeholder="Share an update, announcement, or personal note for your subscribers."
              rows={3}
              value={newPostText}
              onChange={(event) => setNewPostText(event.target.value)}
            />
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#6C757D]">
              <span>Posts are visible to anyone visiting your public page.</span>
              <Button size="sm" onClick={handleAddPost}>
                Post update
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {creatorPosts.length === 0 ? (
              <p className="text-sm text-[#6C757D]">
                You haven&apos;t posted anything yet. Share a quick hello or an update about your next meet.
              </p>
            ) : (
              creatorPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col gap-2 rounded-[12px] border border-[#E9ECEF] bg-white p-4 text-sm text-[#212529]"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#6C757D]">
                    <span>{post.createdAtLabel}</span>
                    {savingPostId === post.id ? (
                      <span className="text-[11px] text-[#28A745]">Saved</span>
                    ) : null}
                  </div>
                  <TextArea
                    rows={3}
                    value={post.text}
                    onChange={(event) => handleUpdatePost(post.id, event.target.value)}
                  />
                  <div className="mt-2 flex justify-between text-xs text-[#6C757D]">
                    <span>Visible under Posts on your public page.</span>
                    <Button variant="ghost" size="sm" className="text-[#DC3545]" onClick={() => handleDeletePost(post.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
