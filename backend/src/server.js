import app from "./app.js";
import { startReservationRealtime } from "./services/realtime.service.js";

const PORT = process.env.PORT || 3000;

startReservationRealtime();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
