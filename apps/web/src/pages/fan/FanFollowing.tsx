import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Badge, Avatar } from '@fanmeet/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface CreatorProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export function FanFollowing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowing() {
      if (!user) return;

      try {
        const { data: follows, error } = await supabase
          .from('creator_follows')
          .select('creator_id')
          .eq('fan_id', user.id);

        if (error) throw error;

        if (follows && follows.length > 0) {
          const creatorIds = follows.map(f => f.creator_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('user_id', creatorIds);

          if (profilesError) throw profilesError;

          if (profiles) {
            setFollowing(profiles);
          }
        } else {
          setFollowing([]);
        }
      } catch (error) {
        console.error('Error fetching following:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFollowing();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-[#6C757D]">Loading...</div>;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[#212529]">Following</h1>
        <p className="mt-1 text-sm text-[#6C757D]">
          Creators you follow. Join their upcoming events faster from here.
        </p>
      </div>

      <div className="space-y-4">
        {following.map((creator) => (
          <Card key={creator.user_id} elevated className="border-none bg-white/95">
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={creator.avatar_url}
                    initials={creator.display_name?.charAt(0) || creator.username?.charAt(0)}
                    size="md"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#212529]">{creator.display_name || creator.username}</span>
                    <span className="text-xs text-[#6C757D]">@{creator.username}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                <Badge variant="primary">
                  Following
                </Badge>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => navigate(`/${creator.username}`)}
                  >
                    View profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {following.length === 0 && (
          <Card>
            <CardContent>
              <p className="text-sm text-[#6C757D]">
                You’re not following any creators yet. Start by placing a bid or hitting follow on a creator profile.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
