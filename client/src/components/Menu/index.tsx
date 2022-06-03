import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { IsochroneForm } from "@forms/RouteForm";
import classes from "@components/Menu/style.module.css";
import { FieldValues } from "react-hook-form";
import { ArrowBackIos as ToggleIcon } from "@mui/icons-material";
import { CardHeader, Typography } from "@mui/material";

interface MenuCardProps {
  isHidden: boolean;
  handleMenuToggle: () => void;
  handleFormSubmit: (value: FieldValues) => Promise<void>;
}

export const MenuCard = ({
  shortestPath,
  isHidden,
  handleMenuToggle,
  handleFormSubmit,
}: MenuCardProps) => {
  return (
    <Box
      className={`${classes.container} ${isHidden && classes.containerHidden}`}
    >
      <Card variant="outlined">
        <CardHeader
          className={classes.header}
          title={
            <Typography className={classes.heading}>
              Feasible route mapping
            </Typography>
          }
          action={
            <Box
              onClick={handleMenuToggle}
              className={`${classes.toggle} ${
                isHidden && classes.toggleHidden
              }`}
            >
              <ToggleIcon
                className={`${classes.icon} ${isHidden && classes.iconHidden}`}
              />
            </Box>
          }
        ></CardHeader>
        <CardContent className={classes.content}>
          <IsochroneForm
            shortestPath={shortestPath}
            handleFormSubmit={handleFormSubmit}
          />
        </CardContent>
      </Card>
    </Box>
  );
};
