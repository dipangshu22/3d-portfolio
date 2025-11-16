import { create } from "zustand";

export const useSelection = create((set) => ({
  hovered: null,
  selected: null,

  setHovered: (mesh) => set({ hovered: mesh }),
  setSelected: (mesh) => set({ selected: mesh }),
}));
