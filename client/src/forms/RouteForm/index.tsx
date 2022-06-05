import {
  useFieldArray,
  FieldError,
  FieldValues,
  useFormContext,
} from "react-hook-form";
import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  Delete as DeleteIcon,
  AddLocationAlt as AddLocationIcon,
  HourglassEmpty as CalculateIcon,
  ArrowDropUp as ArrowUp,
  ArrowDropDown as ArrowDown,
} from "@mui/icons-material";
import { AutocompleteInput } from "@controls/Autocomplete";
import { fetchAddress } from "@api/endpoints";
import { SelectInput } from "@controls/Select";
import classes from "@forms/RouteForm/style.module.css";
import { TIME_RANGE_OPTIONS, TRANSPORTATION_MODE_OPTIONS } from "@util/options";
import { DEFAULT_LOCATION_OPTIONS, Option } from "../../App";
import { useShortestPath } from "@contexts/shortestPath";
import { useIsochroneIntersections } from "@contexts/isochroneIntersections";
import { AUTO_HIDE_MENU_WIDTH, useMenuOverlay } from "@contexts/menuOverlay";
import useWindowDimensions from "@hooks/useWindowDimensions";

const MINIMUM_NUMBER_OF_WAYPOINTS = 2;

const TIME_RANGES = Array.from(
  { length: TIME_RANGE_OPTIONS.max - TIME_RANGE_OPTIONS.min + 1 / 1 },
  (_, i) => ({
    value: (TIME_RANGE_OPTIONS.min + i) * 60,
    label: `${TIME_RANGE_OPTIONS.min + i} ${
      TIME_RANGE_OPTIONS.min + i !== 1 ? "minutes" : "minute"
    }`,
  })
);

const TRANSPORTATION_MODES = Object.values(TRANSPORTATION_MODE_OPTIONS).map(
  (mode) => ({
    value: mode.costing,
    label: mode.label,
  })
);

export const IsochroneForm = () => {
  const shortestPath = useShortestPath((state) => state.data);

  const resetIsochroneIntersections = useIsochroneIntersections(
    (state) => state.resetIsochroneIntersections
  );
  const findIsochroneIntersections = useIsochroneIntersections(
    (state) => state.findIsochroneIntersections
  );

  const hideMenuOverlay = useMenuOverlay((state) => state.hideMenuOverlay);

  const { width } = useWindowDimensions();

  const {
    watch,
    register,
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = useFormContext();

  const { append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const values = watch();

  const containsWaypoints = values.options.length > MINIMUM_NUMBER_OF_WAYPOINTS;

  const handleFormSubmit = async () => {
    await resetIsochroneIntersections();
    await findIsochroneIntersections(shortestPath);
    if (width <= AUTO_HIDE_MENU_WIDTH) {
      hideMenuOverlay();
    }
  };

  const formatSegmentDuration = (duration: number, fixedDigits = 0) =>
    !!fixedDigits
      ? parseFloat((duration / 60).toFixed(fixedDigits))
      : duration / 60;

  const handleLocationSwap = (origin: number, destination: number) => {
    if (origin >= 0 && origin < values.options.length) {
      if (destination >= 0 && destination < values.options.length) {
        if (origin !== destination) {
          setValue(
            "options",
            values.options.map((item: Option, index: number) =>
              origin === index
                ? {
                    ...item,
                    location: !!values.options[destination].location
                      ? {
                          ...values.options[destination].location,
                        }
                      : null,
                  }
                : destination === index
                ? {
                    ...item,
                    location: !!values.options[origin].location
                      ? {
                          ...values.options[origin].location,
                        }
                      : null,
                  }
                : item
            )
          );
        }
      }
    }
    return;
  };

  return (
    <Box className={classes.container}>
      <form
        noValidate
        autoComplete="off"
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        <List className={classes.list}>
          {values.options.map((item: Option, index: number) => (
            <Box
              key={`${item.location?.lat}.${item.location?.lon}.${index}`}
              className={classes.listWrapper}
            >
              {index !== 0 && (
                <Box className={classes.options}>
                  <Divider className={classes.divider} orientation="vertical" />
                  <Box className={classes.itemOptions}>
                    <SelectInput
                      {...register(`options.${index}.timeRange` as const, {
                        required: true,
                      })}
                      control={control}
                      label="Time range"
                      options={TIME_RANGES}
                      disabled={isSubmitting}
                      error={!!errors.options?.[index]?.timeRange?.message}
                      helperText={errors.options?.[index]?.timeRange?.message}
                    />
                    <Box className={classes.duration}>
                      <Typography className={classes.durationLabel}>
                        {`SP ${formatSegmentDuration(
                          shortestPath[index - 1]?.duration ?? 0,
                          2
                        )} min`}
                      </Typography>
                      <Divider className={classes.partition} />
                      <Typography className={classes.durationLabel}>
                        {`AT ${formatSegmentDuration(
                          (shortestPath[index - 1]?.duration ?? 0) +
                            values.options[index].timeRange,
                          2
                        )} min`}
                      </Typography>
                    </Box>
                    <SelectInput
                      {...register(
                        `options.${index}.transportationMode` as const,
                        { required: true }
                      )}
                      control={control}
                      label="Transport mode"
                      options={TRANSPORTATION_MODES}
                      disabled={isSubmitting}
                      error={
                        !!errors.options?.[index]?.transportationMode?.message
                      }
                      helperText={
                        errors.options?.[index]?.transportationMode?.message
                      }
                    />
                  </Box>

                  <Divider className={classes.divider} orientation="vertical" />
                </Box>
              )}
              <ListItem
                className={`${classes.listItem} ${
                  containsWaypoints && classes.listItemPadding
                }`}
                disableGutters
              >
                <Box className={classes.controlContainer}>
                  <ListItemAvatar className={classes.controlWrapper}>
                    <IconButton
                      className={classes.swapIcon}
                      aria-label="Move up"
                      onClick={() => handleLocationSwap(index, index - 1)}
                    >
                      <ArrowUp />
                    </IconButton>
                    <IconButton
                      className={classes.swapIcon}
                      aria-label="Move down"
                      onClick={() => handleLocationSwap(index, index + 1)}
                    >
                      <ArrowDown />
                    </IconButton>
                  </ListItemAvatar>
                  <AutocompleteInput
                    {...register(`options.${index}.location` as const, {
                      required: true,
                    })}
                    label={`Location ${index + 1}`}
                    fetchData={fetchAddress}
                    identifier="display_name"
                    control={control}
                    disabled={isSubmitting}
                    error={
                      !!(errors.options?.[index]?.location as FieldError)
                        ?.message
                    }
                    helperText={
                      (errors.options?.[index]?.location as FieldError)
                        ?.message ?? ""
                    }
                  />
                </Box>
                {containsWaypoints && (
                  <ListItemSecondaryAction className={classes.deleteAction}>
                    <IconButton
                      className={classes.deleteIcon}
                      aria-label="Delete"
                      onClick={() => remove(index)}
                      disabled={isSubmitting}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            </Box>
          ))}
          <Box className={classes.duration}>
            <Typography className={classes.durationLabel}>
              {`Total SP ${shortestPath.reduce(
                (total, segment) =>
                  total + formatSegmentDuration(segment?.duration ?? 0, 2),
                0
              )} min`}
            </Typography>
            <Divider className={classes.partition} />
            <Typography className={classes.durationLabel}>
              {`Total AT ${shortestPath.reduce(
                (total, segment, index) =>
                  total +
                  formatSegmentDuration(
                    segment?.duration ??
                      0 + values.options[index + 1].timeRange,
                    2
                  ),
                0
              )} min`}
            </Typography>
          </Box>
          <Divider className={classes.divider} />
          <Box className={classes.excludeLocations}>
            <AutocompleteInput
              {...register(`excludeLocations` as const, {})}
              multiple
              label="Exclude locations"
              fetchData={fetchAddress}
              identifier="display_name"
              control={control}
              disabled={isSubmitting}
              error={!!errors.excludeLocations?.message}
              helperText={errors.excludeLocations?.message}
            />
          </Box>
        </List>
        <Box className={classes.actions}>
          <Button
            color="primary"
            type="button"
            variant="outlined"
            size="small"
            startIcon={<AddLocationIcon />}
            onClick={() =>
              append({
                ...DEFAULT_LOCATION_OPTIONS,
              })
            }
            disabled={isSubmitting}
          >
            Add waypoint
          </Button>
          <LoadingButton
            color="primary"
            type="submit"
            size="small"
            loading={isSubmitting}
            loadingPosition="start"
            startIcon={<CalculateIcon />}
            variant="outlined"
          >
            Run calculation
          </LoadingButton>
        </Box>
      </form>
    </Box>
  );
};
