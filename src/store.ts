import { create } from "zustand";

type StoreState = {
    token: string,
    response: any | null,
    error: string,
    geoIds: string[],
    selectedFile: string,
    geometry: string[],
    isLoading: boolean,
    featureCount: number,
    reset: () => void;
};

const initialState: Omit<StoreState, 'reset'> = {
    token: "",
    response: null,
    error: "",
    geoIds: [""],
    selectedFile: "",
    geometry: [],
    isLoading: false,
    featureCount: 0
};

export const useStore = create<StoreState>((set) => ({
    ...initialState,
    reset: () => set({ ...initialState }),
}));
