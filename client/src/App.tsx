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
import { useMenuOverlay } from "./contexts/menuOverlay";

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

export const App = () => {
  const findShortestPath = useShortestPath((state) => state.findShortestPath);
  const breakPathIntoSegments = useShortestPath(
    (state) => state.breakPathIntoSegments
  );
  const shortestPathLoading = useShortestPath((state) => state.loading);

  const isochroneIntersectionsLoading = useIsochroneIntersections(
    (state) => state.loading
  );

  const valuesHash = useRef("");

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

  const handleValuesChange = async () => {
    const newValuesHash = hash(values);
    if (newValuesHash !== valuesHash.current) {
      valuesHash.current = newValuesHash;
      const options = breakPathIntoSegments(values);
      await findShortestPath(options);
    }
  };

  useEffect(() => {
    handleValuesChange();
  }, [values]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <FormProvider {...methods}>
          <Box>
            <MenuCard />
            <LegendCard />
            <Map />
          </Box>
        </FormProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
