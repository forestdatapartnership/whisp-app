import { create } from "zustand";

type UserProfile = {
    id: number;
    name: string;
    last_name: string;
    organization: string | null;
    email: string;
    email_verified: boolean;
};

type StoreState = {
    token: string,
    response: any | null,
    error: string,
    geoIds: string[],
    selectedFile: string,
    geometry: string[],
    user: UserProfile | null,
    isAuthenticated: boolean,
    isLoading: boolean,
    featureCount: number,
    setUser: (user: UserProfile | null) => void,
    setIsAuthenticated: (isAuthenticated: boolean) => void,
    reset: () => void;
};

const initialState: Omit<StoreState, 'reset' | 'setUser' | 'setIsAuthenticated'> = {
    token: "",
    response: null,
    error: "",
    geoIds: [""],
    selectedFile: "",
    geometry: [],
    user: null,
    isAuthenticated: false,
    isLoading: false,
    featureCount: 0
};

export const useStore = create<StoreState>((set) => ({
    ...initialState,
    setUser: (user) => set({ user }),
    setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
    reset: () => set({ ...initialState }),
}));
