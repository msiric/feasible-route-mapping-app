import classes from "@components/Menu/style.module.css";
import { useMenuOverlay } from "@contexts/menuOverlay";
import { IsochroneForm } from "@forms/RouteForm";
import { ArrowBackIos as ToggleIcon } from "@mui/icons-material";
import { CardHeader, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export const MenuCard = () => {
  const isMenuVisible = useMenuOverlay((state) => state.visible);
  const toggleMenuOverlay = useMenuOverlay((state) => state.toggleMenuOverlay);

  return (
    <Box
      className={`${classes.container} ${
        !isMenuVisible && classes.containerHidden
      }`}
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
              onClick={toggleMenuOverlay}
              className={`${classes.toggle} ${
                !isMenuVisible && classes.toggleHidden
              }`}
            >
              <ToggleIcon
                className={`${classes.icon} ${
                  !isMenuVisible && classes.iconHidden
                }`}
              />
            </Box>
          }
        ></CardHeader>
        <CardContent className={classes.content}>
          <IsochroneForm />
        </CardContent>
      </Card>
    </Box>
  );
};
