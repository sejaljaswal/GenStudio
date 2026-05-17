import { create } from 'zustand';
import { GenerationStatus } from '@/types';

interface GenerationState {
  activeJobId: string | null;
  activeJobStatus: GenerationStatus | null;
  activeJobImageUrl: string | null;
  activeJobError: string | null;
  
  setActiveJob: (id: string) => void;
  updateActiveJob: (updates: Partial<Pick<GenerationState, 'activeJobStatus' | 'activeJobImageUrl' | 'activeJobError'>>) => void;
  clearActiveJob: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  activeJobId: null,
  activeJobStatus: null,
  activeJobImageUrl: null,
  activeJobError: null,

  setActiveJob: (id) => set({
    activeJobId: id,
    activeJobStatus: "pending",
    activeJobImageUrl: null,
    activeJobError: null,
  }),

  updateActiveJob: (updates) => set((state) => ({ ...state, ...updates })),

  clearActiveJob: () => set({
    activeJobId: null,
    activeJobStatus: null,
    activeJobImageUrl: null,
    activeJobError: null,
  }),
}));
