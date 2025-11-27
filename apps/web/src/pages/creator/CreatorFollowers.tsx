import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Badge, Avatar } from '@fanmeet/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface FanProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export function CreatorFollowers() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<FanProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowers() {
      if (!user) return;

      try {
        const { data: follows, error } = await supabase
          .from('creator_follows')
          .select('fan_id')
          .eq('creator_id', user.id);

        if (error) throw error;

        if (follows && follows.length > 0) {
          const fanIds = follows.map(f => f.fan_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('user_id', fanIds);

          if (profilesError) throw profilesError;

          if (profiles) {
            setFollowers(profiles);
          }
        } else {
          setFollowers([]);
        }
      } catch (error) {
        console.error('Error fetching followers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFollowers();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-[#6C757D]">Loading...</div>;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[#212529]">Followers</h1>
        <p className="mt-1 text-sm text-[#6C757D]">
          People who follow you on FanMeet. Use this list to understand who shows up for
          your events most often.
        </p>
      </div>

      <div className="space-y-4">
        {followers.map((fan) => (
          <Card key={fan.user_id} elevated className="border-none bg-white/95">
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={fan.avatar_url}
                    initials={fan.display_name?.charAt(0) || fan.username?.charAt(0)}
                    size="md"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#212529]">{fan.display_name || fan.username}</span>
                    <span className="text-xs text-[#6C757D]">@{fan.username}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                <Badge variant="primary">Follower</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="rounded-full">
                    Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {followers.length === 0 && (
          <Card>
            <CardContent>
              <p className="text-sm text-[#6C757D]">
                You don’t have any followers yet. Share your profile link and host a few events to start building
                your fan list.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
