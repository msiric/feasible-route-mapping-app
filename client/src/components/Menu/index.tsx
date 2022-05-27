import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { IsochroneForm } from "@forms/RouteForm";
import classes from "@components/Menu/style.module.css";
import { FieldValues } from "react-hook-form";
import { ArrowBackIos as ToggleIcon } from "@mui/icons-material";

interface MenuCardProps {
  isHidden: boolean;
  handleMenuToggle: () => void;
  handleFormSubmit: (value: FieldValues) => Promise<void>;
}

export const MenuCard = ({
  isHidden,
  handleMenuToggle,
  handleFormSubmit,
}: MenuCardProps) => {
  return (
    <Box
      className={`${classes.container} ${isHidden && classes.containerHidden}`}
    >
      <Box
        onClick={handleMenuToggle}
        className={`${classes.toggle} ${isHidden && classes.toggleHidden}`}
      >
        <ToggleIcon
          className={`${classes.icon} ${isHidden && classes.iconHidden}`}
        />
      </Box>
      <Card variant="outlined">
        <CardContent>
          <IsochroneForm handleFormSubmit={handleFormSubmit} />
        </CardContent>
      </Card>
    </Box>
  );
};
