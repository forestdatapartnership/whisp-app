import { create } from "zustand";

type RecordData = {
    Geo_id: string;
    Area_ha: number;
    Country: string;
    EUFO_2020: number;
    GLAD_Primary: number;
    TMF_undist: number;
    JAXA_FNF_2020: number;
    GFC_TC_2020: number;
    GLAD_LULC__2020: number;
    ESRI_TC_2020: number;
    TMF_disturbed: number;
    RADD_alerts: string;
    TMF_plant: number;
    Oil_palm_Descals: number;
    Oil_palm_FDaP_: number;
    Cocoa_ETH: number;
    WDPA: string;
    OECM: string;
    KBA: string;
};

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
    data: RecordData[],
    error: string,
    geoIds: string[],
    selectedFile: string,
    geometry: string[],
    user: UserProfile | null,
    isAuthenticated: boolean,
    setUser: (user: UserProfile | null) => void,
    setIsAuthenticated: (isAuthenticated: boolean) => void,
    reset: () => void;
};

const initialState: Omit<StoreState, 'reset' | 'setUser' | 'setIsAuthenticated'> = {
    token: "",
    data: [],
    error: "",
    geoIds: [""],
    selectedFile: "",
    geometry: [],
    user: null,
    isAuthenticated: false
};

export const useStore = create<StoreState>((set) => ({
    ...initialState,
    setUser: (user) => set({ user }),
    setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
    reset: () => set({ ...initialState }),
}));
