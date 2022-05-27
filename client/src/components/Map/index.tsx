import classes from "@components/Map/style.module.css";
import { MapMarker, MarkerType } from "@components/Marker";
import { MapPopup } from "@components/Popup";
import { MapTooltip } from "@components/Tooltip";
import {
  AccessTime as TimeIcon,
  ColorLens as ColorIcon,
  Directions as DirectionsIcon,
  SouthAmerica as AreaIcon,
} from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { Properties } from "@turf/turf";
import { formatLocation } from "@util/geometry";
import {
  TransportationModeOption,
  TRANSPORTATION_MODE_PROPERTIES,
} from "@util/options";
import { LatLngExpression, LatLngLiteral } from "leaflet";
import { useFormContext } from "react-hook-form";
import {
  LayerGroup,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  ZoomControl,
} from "react-leaflet";
import { Intersection, ShortestPath } from "src/App";
import { Option, Location } from "../../App";

interface MapProps {
  shortestPath: ShortestPath[];
  intersections: Intersection[];
}

const LEAFLET_TILES_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const POLYGON_TOOLTIP_OPTIONS = (regionProperties: Properties) => [
  {
    icon: <ColorIcon className={classes.tooltipIcon} />,
    element: (
      <Box
        className={`${classes.tooltipLabel} ${classes.colorPreview}`}
        style={{
          backgroundColor: regionProperties?.color,
        }}
      ></Box>
    ),
  },
  {
    icon: <TimeIcon className={classes.tooltipIcon} />,
    element: (
      <Typography
        className={classes.tooltipLabel}
      >{`${regionProperties?.contour} min`}</Typography>
    ),
  },
  {
    icon: <AreaIcon className={classes.tooltipIcon} />,
    element: (
      <Typography
        className={classes.tooltipLabel}
      >{`${regionProperties?.area?.toFixed(2)} km2`}</Typography>
    ),
  },
];

const POLYLINE_TOOLTIP_OPTIONS = (
  transportationMode: TransportationModeOption,
  pathSegment: ShortestPath
) => [
  {
    icon: transportationMode.icon({
      width: 14,
    }),
    element: (
      <Typography className={classes.tooltipLabel}>
        {transportationMode.label}
      </Typography>
    ),
  },
  {
    icon: <TimeIcon className={classes.tooltipIcon} />,
    element: (
      <Typography className={classes.tooltipLabel}>
        {`${(pathSegment.duration / 60).toFixed(2)} min`}
      </Typography>
    ),
  },
  {
    icon: <DirectionsIcon className={classes.tooltipIcon} />,
    element: (
      <Typography
        className={classes.tooltipLabel}
      >{`${pathSegment.length?.toFixed(2)} km`}</Typography>
    ),
  },
];

export const Map = ({ shortestPath, intersections }: MapProps) => {
  const { getValues, setValue, watch } = useFormContext();

  const values = watch();

  const handleLocationShift = (id: number, coordinate: LatLngLiteral) => {
    const values = getValues();

    const { lat, lon } = formatLocation(coordinate);
    const location = { lat, lon };

    setValue(
      "options",
      values.options.map((item: Option, index: number) =>
        id === index
          ? {
              ...item,
              location: {
                ...location,
                display_name: `${location.lat},${location.lon}`,
              },
            }
          : item
      )
    );
  };

  const handleExclusionShift = (id: number, coordinate: LatLngLiteral) => {
    const values = getValues();

    const { lat, lon } = formatLocation(coordinate);
    const location = { lat, lon };

    setValue(
      "excludeLocations",
      values.excludeLocations.map((item: Option, index: number) =>
        id === index
          ? {
              ...location,
              display_name: `${location.lat},${location.lon}`,
            }
          : item
      )
    );
  };

  return (
    <MapContainer
      id="map"
      center={[59.436696, 24.744644]}
      zoom={13}
      zoomControl={false}
      style={{ height: "100vh", width: "100wh" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={LEAFLET_TILES_URL}
      />
      <ZoomControl position="topright" />
      <LayerGroup>
        {intersections.map((intersection, index) => {
          const reversedCoordinates = intersection.geometry.coordinates.map(
            (coordinate) => [
              (coordinate as LatLngExpression[])[1],
              (coordinate as LatLngExpression[])[0],
            ]
          );
          return (
            <Polygon
              key={`${intersection.properties?.area}.${index}`}
              pathOptions={{
                color: intersection.properties?.color,
                fill: true,
                fillColor: intersection.properties?.color,
                fillOpacity: 1 / intersection.properties?.contour,
              }}
              positions={reversedCoordinates}
            >
              <MapTooltip
                sticky={true}
                options={POLYGON_TOOLTIP_OPTIONS(intersection.properties)}
              />
            </Polygon>
          );
        })}
      </LayerGroup>
      <LayerGroup>
        {shortestPath.map((segment, index) => (
          <Box key={`${segment.locations[0]}.${segment.locations[1]}.${index}`}>
            <Polyline
              pathOptions={{
                color:
                  TRANSPORTATION_MODE_PROPERTIES[segment.transportationMode]
                    .color,
                weight: 5,
                dashArray: "10",
              }}
              positions={segment.features}
              pane="shadowPane"
            >
              <MapTooltip
                sticky={true}
                options={POLYLINE_TOOLTIP_OPTIONS(
                  TRANSPORTATION_MODE_PROPERTIES[segment.transportationMode],
                  segment
                )}
              />
            </Polyline>

            <MapMarker
              index={index}
              position={segment.locations[0]}
              isDraggable={false}
              label={index + 1}
              handleMarkerShift={handleLocationShift}
            />
            {index === shortestPath.length - 1 && (
              <MapMarker
                index={index + 1}
                position={segment.locations[1]}
                isDraggable={false}
                label={index + 2}
                handleMarkerShift={handleLocationShift}
              />
            )}
          </Box>
        ))}
        {shortestPath[0]?.excludedLocations?.map((location, index) => (
          <MapMarker
            key={`${location.lat}.${location.lon}`}
            type={MarkerType.EXCLUSION}
            index={index}
            position={location}
            isDraggable={false}
            handleMarkerShift={handleLocationShift}
          />
        ))}
      </LayerGroup>
      <LayerGroup>
        {values.options.map(
          (item: Option, index: number) =>
            item.location && (
              <MapMarker
                key={`${item.location.lat}.${item.location.lon}`}
                index={index}
                position={item.location}
                isDraggable={true}
                label={index + 1}
                handleMarkerShift={handleLocationShift}
              />
            )
        )}
      </LayerGroup>
      <LayerGroup>
        {values.excludeLocations.map(
          (location: Location | null, index: number) =>
            location && (
              <MapMarker
                key={`${location.lat}.${location.lon}`}
                type={MarkerType.EXCLUSION}
                index={index}
                position={location}
                isDraggable={true}
                handleMarkerShift={handleExclusionShift}
              />
            )
        )}
      </LayerGroup>
      <MapPopup />
    </MapContainer>
  );
};
