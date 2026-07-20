import { supabaseAdmin } from "../db/index.js";

const ACTIVE_RESERVATION_STATUSES = ["pending", "confirmed"];

const getTenantId = (reservation, user) => user?.tenant_id || reservation.tenant_id;

const normalizeReservation = (reservation, user) => ({
  tenant_id: getTenantId(reservation, user),
  name: reservation.name,
  date: reservation.date,
  time: reservation.time,
  phone: reservation.phone,
  guests: reservation.guests || 1,
  status: reservation.status || "CONFIRMED",
});

const assertReservationInput = (reservation) => {
  if (
    !reservation.tenant_id ||
    !reservation.name ||
    !reservation.date ||
    !reservation.time ||
    !reservation.phone ||
    reservation.guests == null
  ) {
    throw new Error("tenant_id, name, date, time, phone and guests are required");
  }
};

const isDuplicateReservationError = (error) =>
  error?.code === "23505" ||
  error?.message?.toLowerCase().includes("reservations_unique_active_slot");

export const createReservation = async (data, user) => {
  const reservation = normalizeReservation(data, user);
  assertReservationInput(reservation);

  const { data: created, error } = await supabaseAdmin
    .from("reservations")
    .insert(reservation)
    .select("*")
    .single();

  if (error) {
    if (isDuplicateReservationError(error)) {
      throw new Error("This reservation slot is already booked");
    }

    throw new Error(error.message);
  }

  return created;
};

export const getReservation = async ({ tenant_id } = {}) => {
  let query = supabaseAdmin
    .from("reservations")
    .select("*")
    .order("reservation_start", { ascending: true });

  if (tenant_id) {
    query = query.eq("tenant_id", tenant_id);
  }

  const { data, error } = await query.in("status", ACTIVE_RESERVATION_STATUSES);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
