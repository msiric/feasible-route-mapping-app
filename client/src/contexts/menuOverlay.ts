import { fetchRoute } from "@api/endpoints";
import { toErrorMessage } from "@util/error";
import {
  TransportationMode,
  CostingOption,
  applyTransportationMode,
} from "@util/options";
import { LatLngExpression } from "leaflet";
import create, { GetState, SetState } from "zustand";

export interface ShortestPathData {
  features: LatLngExpression[];
  duration: number;
  length: number;
  locations: Location[];
  transportationMode: TransportationMode;
  excludedLocations?: Location[];
  timeRange: number;
}

export interface ShortestPathError {
  retry: boolean;
  message: string;
}

export interface ShortestPathState {
  data: ShortestPathData[];
  loading: boolean;
  error: ShortestPathError;
}

export const AUTO_HIDE_MENU_WIDTH = 750;

const initialState: ShortestPathState = {
  visible: true,
};

const initState = () => ({
  ...initialState,
});

const initActions = (
  set: SetState<ShortestPathState>,
  get: GetState<ShortestPathState>
) => ({
  showMenuOverlay: () => {
    set({ visible: true });
  },
  hideMenuOverlay: () => {
    set({ visible: false });
  },
  toggleMenuOverlay: () => {
    const isVisible = get().visible;
    set({ visible: !isVisible });
  },
  resetMenuOverlay: () => {
    set({ ...initialState });
  },
});

export const useMenuOverlay = create((set, get) => ({
  ...initState(),
  ...initActions(set, get),
}));
