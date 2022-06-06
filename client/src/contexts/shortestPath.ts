import { fetchRoute } from "@api/endpoints";
import { toErrorMessage } from "@util/error";
import {
  TransportationMode,
  CostingOption,
  applyTransportationMode,
} from "@util/options";
import { LatLngExpression } from "leaflet";
import { FieldValues } from "react-hook-form";
import create, { GetState, SetState } from "zustand";

export interface Location {
  lat: number;
  lon: number;
  type: string;
  place_id?: number;
  licence?: string;
  osm_type?: string;
  osm_id?: number;
  boundingbox?: string[];
  display_name?: string;
  class?: string;
  importance?: number;
  icon?: string;
}

export interface Option {
  location: Location | null;
  timeRange?: number;
  transportationMode?: TransportationMode;
}

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

export interface ShortestPathActions {
  findShortestPath: (options: CostingOption[]) => Promise<void>;
  breakPathIntoSegments: (values: FieldValues) => CostingOption[];
  resetShortestPath: () => void;
}

export type ShortestPathContext = ShortestPathState & ShortestPathActions;

const initialState: ShortestPathState = {
  data: [],
  loading: false,
  error: { retry: false, message: "" },
};

const initState = () => ({
  ...initialState,
});

const initActions = (
  set: SetState<ShortestPathContext>,
  get: GetState<ShortestPathContext>
) => ({
  findShortestPath: async (options: CostingOption[]): Promise<void> => {
    try {
      set((state) => ({
        ...state,
        data: [],
        loading: true,
        error: { ...initialState.error },
      }));
      const shortestSegments = await Promise.all(
        options.map(async (segment) => await fetchRoute(segment))
      );
      const shortestPath: ShortestPathData[] = shortestSegments.map(
        ({ features, trip }, index) => ({
          features: features,
          duration: trip.legs.reduce(
            (sum, { summary }) => sum + summary.time,
            0
          ),
          length: trip.legs.reduce(
            (sum, { summary }) => sum + summary.length,
            0
          ),
          locations: trip.locations.map((location) => location),
          transportationMode: options[index].costing,
          excludedLocations: options[index].exclude_locations,
          timeRange: options[index].time_range ?? 0,
        })
      );

      set((state) => ({
        ...state,
        data: shortestPath,
        loading: false,
        error: { ...initialState.error },
      }));
    } catch (err) {
      const errorMessage = toErrorMessage(err);
      set((state) => ({
        ...state,
        loading: false,
        error: { retry: true, message: errorMessage },
      }));
    }
  },
  breakPathIntoSegments: (values: FieldValues): CostingOption[] => {
    const params: CostingOption[] = [];
    for (let i = 0; i < values.options.length - 1; i++) {
      if (values.options[i].location && values.options[i + 1].location) {
        const options: Option[] = values.options.slice(i, i + 2);
        params.push(
          applyTransportationMode(
            values.options[i + 1].transportationMode,
            values.options[i + 1].timeRange,
            options.map(({ location }) => location!),
            values.excludeLocations
          )
        );
      }
    }
    return params;
  },
  resetShortestPath: () => {
    set({ ...initialState });
  },
});

export const useShortestPath = create<ShortestPathContext>((set, get) => ({
  ...initState(),
  ...initActions(set, get),
}));
