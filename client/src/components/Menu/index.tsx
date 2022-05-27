import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { IsochroneForm } from "@forms/RouteForm";
import classes from "@components/Menu/style.module.css";
import { FieldValues } from "react-hook-form";

interface MenuCardProps {
  handleFormSubmit: (value: FieldValues) => Promise<void>;
}

export const MenuCard = ({ handleFormSubmit }: MenuCardProps) => (
  <Box className={classes.container}>
    <Card variant="outlined">
      <CardContent>
        <IsochroneForm handleFormSubmit={handleFormSubmit} />
      </CardContent>
    </Card>
  </Box>
);
