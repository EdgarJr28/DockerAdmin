import { create } from 'zustand';

type State = {
  hostId: string;
  setHostId: (id: string) => void;
};

const KEY = 'selected-docker-host';

export const useDockerHost = create<State>((set) => ({
  hostId: (typeof window !== 'undefined' ? localStorage.getItem(KEY) : null) || 'ins-wayuu',
  setHostId: (id) => {
    if (typeof window !== 'undefined') localStorage.setItem(KEY, id);
    set({ hostId: id });
  },
}));
