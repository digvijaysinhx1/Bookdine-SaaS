import express from "express";
import authRoutes from "./routes/auth.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import authMiddleware from "./middlewares/auth.middleware.js";
import roleMiddleware from "./middlewares/role.middleware.js";
import tenantMiddleware from "./middlewares/tenant.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import { RESTAURANT_ROLES } from "./config/roles.js";
import { HttpError } from "./utils/httpError.js";

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use(
  "/api/reservations",
  authMiddleware,
  roleMiddleware(RESTAURANT_ROLES),
  tenantMiddleware,
  reservationRoutes
);

app.use((req, res, next) => {
  next(new HttpError(404, "Route not found", "ROUTE_NOT_FOUND"));
});

app.use(errorMiddleware);

export default app;
