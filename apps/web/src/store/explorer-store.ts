import { create } from 'zustand';
import type { CharacterFilters } from '@rme/shared';

interface ExplorerState {
  filters: CharacterFilters;
  favorites: string[];
  token: string | null;
  setFilters: (filters: CharacterFilters) => void;
  toggleFavorite: (characterId: string) => void;
  setToken: (token: string | null) => void;
}

// TODO: implement actions (and persistence for favorites/token if needed).
export const useExplorerStore = create<ExplorerState>()(() => ({
  filters: {},
  favorites: [],
  token: null,
  setFilters: () => {},
  toggleFavorite: () => {},
  setToken: () => {},
}));
