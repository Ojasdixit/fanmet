import { create } from 'zustand';

const STORAGE_KEY = 'fanmeet-demo-creator-dm-open';

export type DmStatus = 'open' | 'closed';

interface DmPreferencesState {
  creatorDmStatus: DmStatus;
  setCreatorDmStatus: (status: DmStatus) => void;
}

const loadInitialStatus = (): DmStatus => {
  if (typeof window === 'undefined') return 'open';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'closed' ? 'closed' : 'open';
};

export const useDmPreferences = create<DmPreferencesState>((set) => ({
  creatorDmStatus: loadInitialStatus(),
  setCreatorDmStatus: (status) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, status);
    }
    set({ creatorDmStatus: status });
  },
}));
