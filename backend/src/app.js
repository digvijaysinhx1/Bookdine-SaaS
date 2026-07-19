import express from "express";
import { supabaseAdmin } from "./db/index.js";
import authRoutes from "./routes/auth.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import tenantMiddleware from "./middlewares/tenant.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();
app.use(express.json());

app.use("/tenants", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("tenants").select("*");

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "db error" });
  }
});

app.use("/auth", authRoutes);
app.use("/reservations", tenantMiddleware, reservationRoutes);

app.use(errorMiddleware);

export default app;
