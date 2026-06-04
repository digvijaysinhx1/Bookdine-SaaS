import express from "express";
import pool from "./db/index.js";
import authRoutes from "./routes/auth.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();
app.use(express.json());

app.use("/tenants", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tenants");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "db error" });
  }
});

app.use("/auth", authRoutes);
app.use("/reservations", reservationRoutes);

app.use(errorMiddleware);

export default app;