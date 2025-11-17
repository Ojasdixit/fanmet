import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface CreatorProfile {
  username: string;
  displayName: string;
  bio: string;
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
  getProfile: (username: string) => CreatorProfile | undefined;
  upsertProfile: (input: { username: string; displayName: string; bio: string }) => CreatorProfile;
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

  const getProfile: CreatorProfileContextValue['getProfile'] = (username) =>
    profiles.find((profile) => profile.username === username);

  const upsertProfile: CreatorProfileContextValue['upsertProfile'] = ({ username, displayName, bio }) => {
    const existing = profiles.find((profile) => profile.username === username);

    if (existing) {
      const updated: CreatorProfile = { ...existing, displayName, bio };
      setProfiles((current) => current.map((profile) => (profile.username === username ? updated : profile)));
      return updated;
    }

    const created: CreatorProfile = { username, displayName, bio };
    setProfiles((current) => [...current, created]);
    return created;
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
      getProfile,
      upsertProfile,
      getPostsForCreator,
      addPost,
      updatePost,
      deletePost,
    }),
    [profiles, posts],
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
