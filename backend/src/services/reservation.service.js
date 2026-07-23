import { supabaseAdmin } from "../db/index.js";
import * as availabilityService from "./availability.service.js";
import { badRequest, conflict, HttpError } from "../utils/httpError.js";

const RESERVATION_DURATION_MINUTES = 90;
const CANCELLATION_WINDOW_MINUTES = 60;
const GRACE_PERIOD_MINUTES = 10;
const MAX_ACTIVE_RESERVATIONS_PER_PHONE = 3;
const ACTIVE_STATUSES = ["confirmed", "seated"];
const TERMINAL_STATUSES = ["completed", "no_show", "cancelled"];
const RESERVATION_COLUMNS = [
  "id",
  "tenant_id",
  "table_id",
  "created_by_user_id",
  "customer_name",
  "customer_phone",
  "no_of_guests",
  "reservation_start",
  "reservation_end",
  "status",
  "booking_reference",
].join(", ");

const requireTenant = (tenant_id) => {
  if (!tenant_id) {
    throw new HttpError(
      401,
      "Authenticated user is missing tenant context",
      "TENANT_REQUIRED"
    );
  }
};

const notFound = () =>
  new HttpError(404, "Reservation was not found", "RESERVATION_NOT_FOUND");

const parseLocalDate = (date) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toMinutes = (time) => {
  const [hours, minutes] = String(time).slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
};

const dateTimeFromSlot = (date, slot) => {
  const value = parseLocalDate(date);
  value.setHours(Math.floor(toMinutes(slot) / 60), toMinutes(slot) % 60, 0, 0);
  return value;
};

const addMinutes = (date, minutes) =>
  new Date(date.getTime() + minutes * 60 * 1000);

const normalizeReservation = (reservation) => ({
  id: reservation.id,
  tenant_id: reservation.tenant_id,
  guest_name: reservation.customer_name,
  phone_number: reservation.customer_phone,
  guests: reservation.no_of_guests,
  date: String(reservation.reservation_start || "").slice(0, 10),
  slot: String(reservation.reservation_start || "").slice(11, 16),
  reservation_start: reservation.reservation_start,
  reservation_end: reservation.reservation_end,
  table_id: reservation.table_id,
  status: String(reservation.status || ""),
  booking_reference: reservation.booking_reference,
});

const isDuplicateReservationError = (error) =>
  error?.code === "23505" ||
  error?.code === "23P01" ||
  error?.message?.includes("reservations_unique_active_slot") ||
  error?.message?.includes("reservations_no_active_table_overlap");

const assertAvailableSlot = async ({ tenant_id, date, guests, slot }) => {
  const slots = await availabilityService.getTimeSlots({ tenant_id, date, guests });
  const selectedSlot = slots.slots.find((candidate) => candidate.time === slot);

  if (!selectedSlot) {
    throw badRequest("slot is not valid for this date", "INVALID_SLOT");
  }

  if (!selectedSlot.is_available) {
    throw conflict("slot is no longer available", "SLOT_UNAVAILABLE");
  }
};

const assertActiveReservationLimit = async ({ tenant_id, phone_number, phone }) => {
  const normalizedPhoneNumber = String(phone_number ?? phone ?? "").trim();

  if (!normalizedPhoneNumber) {
    throw badRequest("phone_number is required", "VALIDATION_ERROR");
  }

  let { count, error } = await supabaseAdmin
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant_id)
    .eq("customer_phone", normalizedPhoneNumber)
    .in("status", ACTIVE_STATUSES);

  if (error) {
    const fallback = await supabaseAdmin
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant_id)
      .eq("customer_phone", normalizedPhoneNumber)
      .in("status", ACTIVE_STATUSES);

    count = fallback.count;
    error = fallback.error;
  }

  if (error) {
    console.warn("Skipping active reservation limit check:", error.message);
    return;
  }

  if ((count || 0) >= MAX_ACTIVE_RESERVATIONS_PER_PHONE) {
    throw conflict(
      "Maximum active reservation limit exceeded",
      "ACTIVE_RESERVATION_LIMIT_EXCEEDED"
    );
  }
};

const getTables = async ({ tenant_id, guests }) => {
  const { data, error } = await supabaseAdmin
    .from("cafe_tables")
    .select("id, capacity")
    .eq("tenant_id", tenant_id)
    .eq("is_active", true)
    .gte("capacity", guests)
    .order("capacity", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) {
    throw conflict("No available tables can seat this party size", "NO_AVAILABLE_TABLES");
  }

  return data;
};

const getOverlappingReservations = async ({ tenant_id, reservation_start, reservation_end }) => {
  const { data, error } = await supabaseAdmin
    .from("reservations")
    .select("id, table_id, no_of_guests, reservation_start, reservation_end, status")
    .eq("tenant_id", tenant_id)
    .lt("reservation_start", reservation_end.toISOString())
    .gt("reservation_end", reservation_start.toISOString())
    .in("status", ACTIVE_STATUSES);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const assignTable = async ({ tenant_id, guests, reservation_start, reservation_end }) => {
  const tables = await getTables({ tenant_id, guests });
  const reservations = await getOverlappingReservations({
    tenant_id,
    reservation_start,
    reservation_end,
  });
  const unavailableTableIds = new Set(
    reservations.map((reservation) => reservation.table_id).filter(Boolean)
  );
  const table = tables.find((candidate) => !unavailableTableIds.has(candidate.id));

  if (!table) {
    throw conflict("slot is no longer available", "SLOT_UNAVAILABLE");
  }

  return table.id;
};

const getReservationById = async ({ tenant_id, id }) => {
  requireTenant(tenant_id);

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .select(RESERVATION_COLUMNS)
    .eq("tenant_id", tenant_id)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw notFound();
  }

  return data;
};

export const getReservations = async ({ tenant_id, filters = {} } = {}) => {
  requireTenant(tenant_id);

  let query = supabaseAdmin
    .from("reservations")
    .select(RESERVATION_COLUMNS)
    .eq("tenant_id", tenant_id)
    .order("reservation_start", { ascending: true });

  if (filters.status) {
    query = query.eq("status", String(filters.status));
  }

  if (filters.date) {
    query = query.eq("date", filters.date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeReservation);
};

export const getReservation = async ({ tenant_id, id } = {}) => {
  const reservation = await getReservationById({ tenant_id, id });
  return normalizeReservation(reservation);
};

const createBookingReference = () => `BKD${Date.now().toString().slice(-8)}`;

export const createReservation = async ({ tenant_id, reservation } = {}) => {
  requireTenant(tenant_id);

  await assertActiveReservationLimit({
    tenant_id,
    phone_number: reservation.phone_number,
    phone: reservation.phone,
  });

  await assertAvailableSlot({
    tenant_id,
    date: reservation.date,
    guests: reservation.guests,
    slot: reservation.slot,
  });

  const reservationStart = dateTimeFromSlot(reservation.date, reservation.slot);
  const reservationEnd = addMinutes(reservationStart, RESERVATION_DURATION_MINUTES);
  const tableId = await assignTable({
    tenant_id,
    guests: reservation.guests,
    reservation_start: reservationStart,
    reservation_end: reservationEnd,
  });

  const payload = {
    tenant_id,
    table_id: tableId,
    customer_name: reservation.guest_name,
    customer_phone: reservation.phone_number,
    no_of_guests: reservation.guests,
    reservation_start: reservationStart.toISOString(),
    reservation_end: reservationEnd.toISOString(),
    status: "confirmed",
    booking_reference: createBookingReference(),
  };

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .insert(payload)
    .select(RESERVATION_COLUMNS)
    .single();

  if (error) {
    if (isDuplicateReservationError(error)) {
      throw conflict("slot is no longer available", "SLOT_UNAVAILABLE");
    }

    throw new Error(error.message);
  }

  return normalizeReservation(data);
};

const VALID_TRANSITIONS = {
  confirmed: new Set(["seated", "no_show"]),
  seated: new Set(["completed"]),
};

const assertStatusTransition = (currentStatus, nextStatus, reservation) => {
  if (TERMINAL_STATUSES.includes(currentStatus)) {
    throw conflict("Terminal reservations cannot change status", "INVALID_STATUS_FLOW");
  }

  if (!VALID_TRANSITIONS[currentStatus]?.has(nextStatus)) {
    throw conflict(
      `Cannot change reservation status from ${currentStatus} to ${nextStatus}`,
      "INVALID_STATUS_FLOW"
    );
  }

  if (nextStatus === "no_show") {
    const graceEndsAt = addMinutes(
      new Date(reservation.reservation_start),
      GRACE_PERIOD_MINUTES
    );

    if (new Date() < graceEndsAt) {
      throw conflict(
        "Reservation cannot be marked NO_SHOW before the 10 minute grace period ends",
        "GRACE_PERIOD_ACTIVE"
      );
    }
  }
};

export const updateReservationStatus = async ({ tenant_id, id, status } = {}) => {
status =
    String(status)
    .toLowerCase();
  const reservation = await getReservationById({ tenant_id, id });
  const currentStatus = String(reservation.status);

  assertStatusTransition(currentStatus, status, reservation);

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .update({status})
    .eq("tenant_id", tenant_id)
    .eq("id", id)
    .select(RESERVATION_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw notFound();
  }

  return normalizeReservation(data);
};

export const cancelReservation = async ({ tenant_id, id } = {}) => {
  const reservation = await getReservationById({ tenant_id, id });
  const currentStatus = String(reservation.status);

  if (currentStatus !== "confirmed") {
    throw conflict("Only confirmed reservations can be cancelled", "INVALID_STATUS_FLOW");
  }

  const cancellationClosesAt = addMinutes(
    new Date(reservation.reservation_start),
    -CANCELLATION_WINDOW_MINUTES
  );

  if (new Date() > cancellationClosesAt) {
    throw conflict(
      "Reservations can only be cancelled up to 1 hour before reservation time",
      "CANCELLATION_WINDOW_CLOSED"
    );
  }

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("tenant_id", tenant_id)
    .eq("id", id)
    .select(RESERVATION_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw notFound();
  }

  return normalizeReservation(data);
};
