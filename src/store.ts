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

type StoreState = {
    token: string,
    data: RecordData[],
    geometryFile: File | null,
    geoIdsFile: File | null,
    error: string,
    geoIds: string[],
    isDisabled: boolean,
    selectedFile: string,
    geometry: string[],
    shpBase64: string,
    reset: () => void;
};

const initialState: Omit<StoreState, 'reset'> = {
    token: "",
    data: [],
    geometryFile: null,
    geoIdsFile: null,
    error: "",
    geoIds: [""],
    isDisabled: true,
    selectedFile: "",
    geometry: [],
    shpBase64: ""
};

export const useStore = create<StoreState>((set) => ({
    ...initialState,
    reset: () => set({ ...initialState }),
}));
