import Leaflet, { LatLngExpression } from "leaflet";
import { MenuCard } from "@components/Menu";
import { Map } from "@components/Map";
import { calcArea, calcIntersection } from "@util/geometry";
import { useState } from "react";
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

const getColor = (value: number) => {
  const hue = ((1 - value) * 120).toString(10);
  return ["hsl(", hue, ",100%,50%)"].join("");
};

const formatIntersection = (
  coordinate: Position[][],
  intervals: number,
  counter: number
): Intersection => {
  const coordinates = coordinate.flat();
  const areaColor = getColor((intervals - counter + 1) / intervals);
  return {
    type: "Feature",
    geometry: {
      coordinates,
      type: "Polygon",
    },
    properties: {
      stroke: true,
      fill: true,
      fillColor: areaColor,
      color: areaColor,
      contour: intervals - counter + 1,
      area: calcArea(coordinates) || 0,
    },
    order: counter,
  };
};

export const App = () => {
  const [shortestPath, setShortestPath] = useState<ShortestPath[]>([]);
  const [intersections, setIntersections] = useState<Intersection[]>([]);
  const [isHidden, setIsHidden] = useState(false);

  const methods = useForm<FieldValues>({
    defaultValues: {
      options: [{ location: null }, { ...DEFAULT_LOCATION_OPTIONS }],
      excludeLocations: [],
    },
    mode: "onSubmit",
    resolver: yupResolver(validationSchema),
  });
  const { enqueueSnackbar } = useSnackbar();

  const setStateInBatch = (
    newShortestPath: ShortestPath[],
    newIntersections: Intersection[]
  ) => {
    setShortestPath(newShortestPath);
    setIntersections(newIntersections);
  };

  const handleMenuToggle = () => setIsHidden(!isHidden);

  const fetchSegmentIsochrones = async (
    locations: Location[],
    duration: number,
    range: number,
    transportationMode: TransportationMode,
    excludedLocations: Location[]
  ) => {
    const totalTime = duration + range;
    const upperBound = (totalTime - (totalTime % 60) - 60) / 60;
    const intervalSteps = Array(upperBound)
      .fill(1)
      .map((item, index) => (index + item) * 60);

    try {
      return await Promise.all(
        intervalSteps.map(
          async (time) =>
            await Promise.all(
              locations.map(async (location, index) => {
                const params = applyTransportationMode(
                  transportationMode,
                  range,
                  [location],
                  excludedLocations,
                  index !== 0,
                  [{ time: time / 60 }]
                );
                return fetchIsochrone(params);
              })
            )
        )
      );
    } catch (err) {
      enqueueSnackbar(toErrorMessage(err), SNACKBAR_OPTIONS);
      throw err;
    }
  };

  const findShortestPath = async (
    options: CostingOption[]
  ): Promise<ShortestPath[]> => {
    try {
      const shortestSegments = await Promise.all(
        options.map(async (segment) => await fetchRoute(segment))
      );

      const shortestPath: ShortestPath[] = shortestSegments.map(
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
      enqueueSnackbar(toErrorMessage(err), SNACKBAR_OPTIONS);
      throw err;
    }
  };

  const findIsochroneIntersections = async (path: ShortestPath[]) => {
    const isochrones = await Promise.all(
      path.map(
        async (segment) =>
          await fetchSegmentIsochrones(
            segment.locations,
            segment.duration,
            segment.timeRange ?? 0,
            segment.transportationMode,
            segment.excludedLocations ?? []
          )
      )
    );
    const intersections: Intersection[] = [];
    for (const [index, segment] of path.entries()) {
      const intervals = (segment.timeRange - (segment.timeRange % 60)) / 60;
      for (let counter = 1; counter <= intervals; counter++) {
        let start = 0;
        let end = isochrones[index].length - counter;
        while (end >= 0) {
          const originCoordinates =
            isochrones[index][start][0].features[0].geometry.coordinates;
          const destinationCoordinates =
            isochrones[index][end][1].features[0].geometry.coordinates;
          const calculation = calcIntersection(
            originCoordinates as Position[],
            destinationCoordinates as Position[]
          );
          if (calculation?.geometry?.coordinates) {
            if (calculation.geometry.type === "MultiPolygon") {
              calculation.geometry.coordinates.forEach((coordinate) => {
                const intersection = formatIntersection(
                  coordinate as Position[][],
                  intervals,
                  counter
                );
                intersections.push(intersection);
              });
            } else {
              const intersection = formatIntersection(
                calculation.geometry.coordinates as Position[][],
                intervals,
                counter
              );
              intersections.push(intersection);
            }
          }
          start++;
          end--;
        }
      }
    }
    return intersections.sort((a, b) => a.order! - b.order!);
  };

  const handleFormSubmit = async (values: FieldValues) => {
    setStateInBatch([], []);
    const params = [];
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
    const shortestPath = await findShortestPath(params);
    const intersections = await findIsochroneIntersections(shortestPath);
    setStateInBatch(shortestPath, intersections);
  };

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <FormProvider {...methods}>
          <Box>
            <MenuCard
              isHidden={isHidden}
              handleMenuToggle={handleMenuToggle}
              handleFormSubmit={handleFormSubmit}
            />
            <LegendCard isHidden={isHidden} />
            <Map shortestPath={shortestPath} intersections={intersections} />
          </Box>
        </FormProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
