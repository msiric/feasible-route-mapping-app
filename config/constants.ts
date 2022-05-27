import dotenv from "dotenv";

dotenv.config();

export const CLIENT_DOMAIN = process.env.CLIENT_URI || "http://localhost:3000";

export const VALHALLA_OSM_URL =
  "http://ec2-35-157-151-151.eu-central-1.compute.amazonaws.com:8002";
