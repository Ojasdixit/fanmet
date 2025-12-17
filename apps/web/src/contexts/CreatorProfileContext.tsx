import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export interface CreatorProfile {
  username: string;
  displayName: string;
  bio: string;
  profilePhotoUrl?: string;
  cover_photo_url?: string;
}

export interface CreatorPost {
  id: string;
  username: string;
  text: string;
  createdAtLabel: string;
}

interface CreatorProfileContextValue {
  profiles: CreatorProfile[];
  posts: CreatorPost[];
  following: string[];
  getProfile: (username: string) => CreatorProfile | undefined;
  upsertProfile: (input: { username: string; displayName: string; bio: string }) => Promise<CreatorProfile>;
  followCreator: (username: string) => Promise<void>;
  unfollowCreator: (username: string) => Promise<void>;
  getPostsForCreator: (username: string) => CreatorPost[];
  addPost: (input: { username: string; text: string }) => CreatorPost;
  updatePost: (postId: string, text: string) => void;
  deletePost: (postId: string) => void;
}

const CreatorProfileContext = createContext<CreatorProfileContextValue | undefined>(undefined);

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const CreatorProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profiles, setProfiles] = useState<CreatorProfile[]>([]);
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const { user } = useAuth();

  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from('profiles').select('username, display_name, bio, profile_photo_url, cover_photo_url');

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      if (data) {
        setProfiles(
          data.map((p) => ({
            username: p.username,
            displayName: p.display_name || '',
            bio: p.bio || '',
            profilePhotoUrl: p.profile_photo_url || undefined,
            cover_photo_url: p.cover_photo_url || undefined,
          })),
        );
      }
    };

    fetchProfiles();
  }, []);

  useEffect(() => {
    if (!user) {
      setFollowing([]);
      return;
    }

    const fetchFollowing = async () => {
      const { data, error } = await supabase
        .from('creator_follows')
        .select('creator_id')
        .eq('fan_id', user.id);

      if (error) {
        console.error('Error fetching following:', error);
        return;
      }

      if (data && data.length > 0) {
        const creatorIds = data.map((d) => d.creator_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('username')
          .in('user_id', creatorIds);

        const usernames = profiles?.map((p) => p.username).filter(Boolean) || [];
        setFollowing(usernames);
      }
    };

    fetchFollowing();
  }, [user]);

  const getProfile: CreatorProfileContextValue['getProfile'] = (username) =>
    profiles.find((profile) => profile.username === username);

  const upsertProfile: CreatorProfileContextValue['upsertProfile'] = async ({ username, displayName, bio }) => {
    const existing = profiles.find((profile) => profile.username === username);
    const updated: CreatorProfile = { username, displayName, bio };

    // Optimistic update
    if (existing) {
      setProfiles((current) => current.map((profile) => (profile.username === username ? updated : profile)));
    } else {
      setProfiles((current) => [...current, updated]);
    }

    if (user) {
      const { error } = await supabase.from('profiles').upsert({
        user_id: user.id,
        username,
        display_name: displayName,
        bio,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error updating profile:', error);
      }
    }

    return updated;
  };

  const followCreator = async (username: string) => {
    if (!user) return;

    // Optimistic
    setFollowing((prev) => [...prev, username]);

    // Find creator ID
    const { data: creatorData } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .single();

    if (!creatorData) return;

    const { error } = await supabase.from('creator_follows').insert({
      fan_id: user.id,
      creator_id: creatorData.user_id,
    });

    if (error) {
      console.error('Error following creator:', error);
      setFollowing((prev) => prev.filter((u) => u !== username));
    }
  };

  const unfollowCreator = async (username: string) => {
    if (!user) return;

    // Optimistic
    setFollowing((prev) => prev.filter((u) => u !== username));

    // Find creator ID
    const { data: creatorData } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .single();

    if (!creatorData) return;

    const { error } = await supabase
      .from('creator_follows')
      .delete()
      .eq('fan_id', user.id)
      .eq('creator_id', creatorData.user_id);

    if (error) {
      console.error('Error unfollowing creator:', error);
      setFollowing((prev) => [...prev, username]);
    }
  };

  const getPostsForCreator: CreatorProfileContextValue['getPostsForCreator'] = (username) =>
    posts.filter((post) => post.username === username).sort((a, b) => (a.id < b.id ? 1 : -1));

  const addPost: CreatorProfileContextValue['addPost'] = ({ username, text }) => {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Post text cannot be empty');
    }

    const created: CreatorPost = {
      id: createId(),
      username,
      text: trimmed,
      createdAtLabel: 'Just now',
    };

    setPosts((current) => [created, ...current]);
    return created;
  };

  const updatePost: CreatorProfileContextValue['updatePost'] = (postId, text) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
            ...post,
            text: text.trim(),
          }
          : post,
      ),
    );
  };

  const deletePost: CreatorProfileContextValue['deletePost'] = (postId) => {
    setPosts((current) => current.filter((post) => post.id !== postId));
  };

  const value: CreatorProfileContextValue = useMemo(
    () => ({
      profiles,
      posts,
      following,
      getProfile,
      upsertProfile,
      followCreator,
      unfollowCreator,
      getPostsForCreator,
      addPost,
      updatePost,
      deletePost,
    }),
    [profiles, posts, following],
  );

  return <CreatorProfileContext.Provider value={value}>{children}</CreatorProfileContext.Provider>;
};

export const useCreatorProfiles = () => {
  const context = useContext(CreatorProfileContext);

  if (!context) {
    throw new Error('useCreatorProfiles must be used within a CreatorProfileProvider');
  }

  return context;
};
