import { create } from "zustand";
import type { FeatureCollection } from "geojson";
import { AnalysisOptionsValue } from "./components/submission/AnalysisOptions";

type StoreState = {
    token: string,
    response: any | null,
    error: string,
    errorCause: string | null,
    isLoading: boolean,
    featureCount: number,
    preloadedGeojson: FeatureCollection | null,
    preloadedAnalysisOptions: Partial<AnalysisOptionsValue> | null,
    reset: () => void;
};

const initialState: Omit<StoreState, 'reset'> = {
    token: "",
    response: null,
    error: "",
    errorCause: null,
    isLoading: false,
    featureCount: 0,
    preloadedGeojson: null,
    preloadedAnalysisOptions: null,
};

export const useStore = create<StoreState>((set) => ({
    ...initialState,
    reset: () => set({ ...initialState }),
}));
