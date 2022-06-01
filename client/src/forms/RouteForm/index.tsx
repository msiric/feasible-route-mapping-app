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

interface IsochroneFormProps {
  handleFormSubmit: (value: FieldValues) => Promise<void>;
}

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

export const IsochroneForm = ({ handleFormSubmit }: IsochroneFormProps) => {
  const {
    watch,
    register,
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useFormContext();

  const { append, remove, swap } = useFieldArray({
    control,
    name: "options",
  });

  const values = watch();

  const containsWaypoints = values.options.length > MINIMUM_NUMBER_OF_WAYPOINTS;

  const handleLocationSwap = (origin: number, destination: number) => {
    if (origin >= 0 && origin < values.options.length) {
      if (destination >= 0 && destination < values.options.length) {
        if (origin !== destination) {
          swap(origin, destination);
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
