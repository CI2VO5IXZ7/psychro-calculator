import { create } from 'zustand';

export const usePointsStore = create(set => ({
  pressure: 101325,
  points: [],
  processLines: [],
  setPressure: (p) => set({ pressure: p }),
  setPoints: (pts) => set({ points: pts }),
  setProcessLines: (lines) => set({ processLines: lines }),
  addPoint: (pt) => set(state => ({ points: [...state.points, pt] })),
  addProcessLine: (line) => set(state => ({ processLines: [...state.processLines, line] })),
  clearPoints: () => set({ points: [] }),
  clearProcessLines: () => set({ processLines: [] })
})); 