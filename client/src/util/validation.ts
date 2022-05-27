import * as Yup from "yup";
import { TRANSPORTATION_MODE_OPTIONS } from "@util/options";

const findPathIndex = (path: string) => path.split("[")[1].split("]")[0];

export const validationSchema = Yup.object().shape({
  options: Yup.array().of(
    Yup.object().shape({
      location: Yup.object().nullable().required("Location cannot be empty"),
      timeRange: Yup.number()
        .integer()
        .test("isRequired", "Time range cannot be empty", (value, index) => {
          const id = findPathIndex(index.path);
          if (id !== "0") {
            return !!value;
          }
          return !value;
        })
        .test(
          "isMinimum",
          "Time range cannot be less than one minute",
          (value, index) => {
            const id = findPathIndex(index.path);
            if (id !== "0") {
              return !!value && value >= 60;
            }
            return !value;
          }
        )
        .test(
          "isMaximum",
          "Time range cannot be greater than ten minutes",
          (value, index) => {
            const id = findPathIndex(index.path);
            if (id !== "0") {
              return !!value && value <= 600;
            }
            return !value;
          }
        ),
      transportationMode: Yup.string()
        .test(
          "isRequired",
          "Transportation mode cannot be empty",
          (value, index) => {
            const id = findPathIndex(index.path);
            if (id !== "0") {
              return !!value;
            }
            return !value;
          }
        )
        .test("isValid", "Transportation mode is invalid", (value, index) => {
          const id = findPathIndex(index.path);
          if (id !== "0") {
            return (
              !!value &&
              Object.keys(TRANSPORTATION_MODE_OPTIONS).includes(value)
            );
          }
          return !value;
        }),
    })
  ),
  excludeLocations: Yup.array().of(Yup.object().required()),
});
