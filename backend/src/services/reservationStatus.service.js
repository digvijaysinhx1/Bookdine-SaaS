import { supabaseAdmin } from "../db/index.js";

const GRACE_PERIOD_MINUTES = 10;
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "SEATED", "pending", "confirmed", "seated"];

const toMinutes = (time) => {
  const [hours, minutes] = String(time).slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
};

const dateTimeFromSlot = (date, slot) => {
  const [year, month, day] = String(date).split("-").map(Number);
  const minutes = toMinutes(slot);

  return new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60, 0, 0);
};

const addMinutes = (date, minutes) =>
  new Date(date.getTime() + minutes * 60 * 1000);

const getFinalStatus = (reservation, now) => {
  const status = String(reservation.status || "").toUpperCase();
  const start = dateTimeFromSlot(reservation.reservation_date, reservation.start_time);
  const end = dateTimeFromSlot(reservation.reservation_date, reservation.end_time);

  if (status === "SEATED" && now >= end) {
    return "COMPLETED";
  }

  if ((status === "PENDING" || status === "CONFIRMED") && now >= addMinutes(start, GRACE_PERIOD_MINUTES)) {
    return "no_show";
  }

  return null;
};

const updateReservationStatus = async ({ id, status }) => {
  const { error } = await supabaseAdmin
    .from("reservations")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
};

export const refreshExpiredReservations = async ({ tenant_id, date } = {}) => {
  if (!tenant_id) {
    return;
  }

  let query = supabaseAdmin
    .from("reservations")
    .select("id, reservation_date, start_time, end_time, status, tenant_tables!inner(tenant_id)")
    .eq("tenant_tables.tenant_id", tenant_id)
    .in("status", ACTIVE_STATUSES);

  if (date) {
    query = query.eq("reservation_date", date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const now = new Date();
  const updates = (data || [])
    .map((reservation) => ({
      id: reservation.id,
      status: getFinalStatus(reservation, now),
    }))
    .filter((reservation) => reservation.status);

  for (const update of updates) {
    await updateReservationStatus(update);
  }
};
