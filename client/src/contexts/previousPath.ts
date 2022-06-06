import { TransportationMode } from "@util/options";
import { LatLngExpression } from "leaflet";
import create, { GetState, SetState } from "zustand";
import { Location } from "@contexts/shortestPath";

export interface PreviousPathData {
  features: LatLngExpression[];
  duration: number;
  length: number;
  locations: Location[];
  transportationMode: TransportationMode;
  excludedLocations?: Location[];
  timeRange: number;
}

export interface PreviousPathState {
  data: PreviousPathData[];
}

export interface PreviousPathActions {
  setPreviousPath: (path: PreviousPathData[]) => void;
  resetPreviousPath: () => void;
}

export type PreviousPathContext = PreviousPathState & PreviousPathActions;

const initialState: PreviousPathState = {
  data: [],
};

const initState = () => ({
  ...initialState,
});

const initActions = (
  set: SetState<PreviousPathContext>,
  get: GetState<PreviousPathContext>
) => ({
  setPreviousPath: (path: PreviousPathData[]) => {
    set((state) => ({
      ...state,
      data: path,
    }));
  },
  resetPreviousPath: () => {
    set({ ...initialState });
  },
});

export const usePreviousPath = create<PreviousPathContext>((set, get) => ({
  ...initState(),
  ...initActions(set, get),
}));
