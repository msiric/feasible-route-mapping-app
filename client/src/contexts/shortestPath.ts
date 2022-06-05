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

const initialState: ShortestPathState = {
  data: [],
  loading: false,
  error: { retry: false, message: "" },
};

const initState = () => ({
  ...initialState,
});

const initActions = (
  set: SetState<ShortestPathState>,
  get: GetState<ShortestPathState>
) => ({
  findShortestPath: async (
    options: CostingOption[]
  ): Promise<ShortestPathData[] | void> => {
    try {
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

      return shortestPath;
    } catch (err) {
      set((state) => ({
        ...state,
        loading: false,
        error: { retry: true, message: toErrorMessage(err) },
      }));
    }
  },
  breakPathIntoSegments: async (values) => {
    const params = [];
    const findShortestPath = get().findShortestPath;
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
    const shortestPath = await findShortestPath(params);
    set((state) => ({
      ...state,
      data: shortestPath,
      loading: false,
      error: { ...initialState.error },
    }));
  },
  resetShortestPath: () => {
    set({ ...initialState });
  },
});

export const useShortestPath = create((set, get) => ({
  ...initState(),
  ...initActions(set, get),
}));
