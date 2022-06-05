import Leaflet, { LatLngExpression } from "leaflet";
import { MenuCard } from "@components/Menu";
import { Map } from "@components/Map";
import { calcArea, calcIntersection } from "@util/geometry";
import { useEffect, useRef, useState } from "react";
import { Box, Collapse, ThemeProvider } from "@mui/material";
import theme from "@styles/theme";
import { StyledEngineProvider } from "@mui/material/styles";
import {
  applyTransportationMode,
  CostingOption,
  TransportationMode,
} from "@util/options";
import { fetchIsochrone, fetchRoute } from "@api/endpoints";
import { LegendCard } from "@components/Legend";
import { Feature, Position, Geometry } from "@turf/turf";
import { FieldValues, FormProvider, useForm } from "react-hook-form";
import { toErrorMessage } from "@util/error";
import { OptionsObject, useSnackbar } from "notistack";
import { yupResolver } from "@hookform/resolvers/yup";
import { validationSchema } from "@util/validation";
import useWindowDimensions from "./hooks/useWindowDimensions";
import hash from "object-hash";
import { useShortestPath } from "./contexts/shortestPath";
import { useIsochroneIntersections } from "./contexts/isochroneIntersections";

export const DEFAULT_LOCATION_OPTIONS = {
  location: null,
  timeRange: 300,
  transportationMode: "auto",
};

Leaflet.Icon.Default.imagePath = "img/";

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
export interface ShortestPath {
  features: LatLngExpression[];
  duration: number;
  length: number;
  locations: Location[];
  transportationMode: TransportationMode;
  excludedLocations?: Location[];
  timeRange: number;
}

export interface FormValues {
  options: Option[];
  excludeLocations: Location[];
}

export type Intersection = Feature<Geometry> & {
  order?: number;
};

export interface Option {
  location: Location | null;
  timeRange?: number;
  transportationMode?: TransportationMode;
}

const SNACKBAR_OPTIONS: OptionsObject = {
  anchorOrigin: {
    vertical: "bottom",
    horizontal: "center",
  },
  variant: "error",
  TransitionComponent: Collapse,
};

const AUTO_HIDE_MENU_WIDTH = 750;

export const App = () => {
  const shortestPath = useShortestPath((state) => state.data);
  const breakPathIntoSegments = useShortestPath(
    (state) => state.breakPathIntoSegments
  );
  const shortestPathLoading = useShortestPath((state) => state.loading);

  const isochroneIntersections = useIsochroneIntersections(
    (state) => state.data
  );
  const findIsochroneIntersections = useIsochroneIntersections(
    (state) => state.findIsochroneIntersections
  );
  const resetIsochroneIntersections = useIsochroneIntersections(
    (state) => state.resetIsochroneIntersections
  );
  const isochroneIntersectionsLoading = useIsochroneIntersections(
    (state) => state.loading
  );

  const [isHidden, setIsHidden] = useState(false);

  const valuesHash = useRef("");

  const { width } = useWindowDimensions();

  const methods = useForm<FieldValues>({
    defaultValues: {
      options: [{ location: null }, { ...DEFAULT_LOCATION_OPTIONS }],
      excludeLocations: [],
    },
    mode: "onSubmit",
    resolver: yupResolver(validationSchema),
  });

  const values = methods.watch();

  const { enqueueSnackbar } = useSnackbar();

  const handleMenuToggle = () => setIsHidden(!isHidden);

  const handleFormSubmit = async (values: FieldValues) => {
    resetIsochroneIntersections();
    const params = [];
    // ensure all the shortest route segments are fetched
    if (values.options.length - 1 === shortestPath.length) {
      for (let i = 0; i < values.options.length - 1; i++) {
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
      await findIsochroneIntersections(shortestPath);
      if (width <= AUTO_HIDE_MENU_WIDTH) setIsHidden(true);
    } else {
      // todo handle missing route segments
      console.log(
        "length mismatch",
        values.options.length,
        shortestPath.length
      );
    }
  };

  useEffect(() => {
    const newValuesHash = hash(values);
    if (newValuesHash !== valuesHash.current) {
      valuesHash.current = newValuesHash;
      breakPathIntoSegments(values);
    }
  }, [values]);

  console.log("shortest path", shortestPath);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <FormProvider {...methods}>
          <Box>
            <MenuCard
              shortestPath={shortestPath}
              isHidden={isHidden}
              handleMenuToggle={handleMenuToggle}
              handleFormSubmit={handleFormSubmit}
            />
            <LegendCard isHidden={isHidden} />
            <Map
              shortestPath={shortestPath}
              intersections={isochroneIntersections}
            />
          </Box>
        </FormProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
