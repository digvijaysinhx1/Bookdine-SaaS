import { supabaseAdmin } from "../db/index.js";

let reservationChannel;

export const startReservationRealtime = () => {
  if (process.env.SUPABASE_REALTIME_ENABLED === "false" || reservationChannel) {
    return reservationChannel;
  }

  reservationChannel = supabaseAdmin
    .channel("reservations-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reservations",
      },
      (payload) => {
        console.log("Reservation realtime event:", payload.eventType);
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error("Reservation realtime subscription failed");
      }
    });

  return reservationChannel;
};

export const stopReservationRealtime = async () => {
  if (!reservationChannel) {
    return;
  }

  await supabaseAdmin.removeChannel(reservationChannel);
  reservationChannel = undefined;
};
