import express from "express";
import authRoutes from "./routes/auth.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import authMiddleware from "./middlewares/auth.middleware.js";
import roleMiddleware from "./middlewares/role.middleware.js";
import tenantMiddleware from "./middlewares/tenant.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import { RESTAURANT_ROLES } from "./config/roles.js";
import { HttpError } from "./utils/httpError.js";

const app = express();

app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN || "http://localhost:5173";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use(
  "/api/reservations",
  authMiddleware,
  roleMiddleware(RESTAURANT_ROLES),
  tenantMiddleware,
  reservationRoutes
);

app.use(
  "/api/settings",
  authMiddleware,
  roleMiddleware(RESTAURANT_ROLES),
  tenantMiddleware,
  settingsRoutes
);

app.use((req, res, next) => {
  next(new HttpError(404, "Route not found", "ROUTE_NOT_FOUND"));
});

app.use(errorMiddleware);

export default app;
