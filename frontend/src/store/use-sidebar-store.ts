import { create } from 'zustand';

interface SidebarStore {
    isExpanded: boolean;
    toggleSidebar: () => void;
    setSidebarState: (state: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
    isExpanded: false,
    toggleSidebar: () => set((state) => ({ isExpanded: !state.isExpanded })),
    setSidebarState: (state: boolean) => set({ isExpanded: state }),
})); 