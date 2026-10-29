import { supabaseAdmin } from "../db/index.js";
import * as availabilityService from "./availability.service.js";
import { badRequest, conflict, HttpError } from "../utils/httpError.js";
import { refreshExpiredReservations } from "./reservationStatus.service.js";
import { buildReservationInsertPayload } from "./reservationPayload.js";

const RESERVATION_DURATION_MINUTES = 90;
const CANCELLATION_WINDOW_MINUTES = 60;
const GRACE_PERIOD_MINUTES = 10;
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "SEATED", "pending", "confirmed", "seated"];
const TERMINAL_STATUSES = ["COMPLETED", "NO_SHOW", "CANCELLED"];
const RESERVATION_COLUMNS = [
  "id",
  "table_id",
  "customer_name",
  "customer_phone",
  "customer_email",
  "guests",
  "reservation_date",
  "start_time",
  "end_time",
  "status",
  "source",
  "special_note",
  "created_by",
  "created_at",
  "tenant_tables!inner(tenant_id, table_number)",
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

const parseDateParts = (date) => date.split("-").map(Number);

const toMinutes = (time) => {
  const [hours, minutes] = String(time).slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
};

const formatTime = (minutes) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMaximumSuitableCapacity = (guests) => (guests === 1 ? 4 : guests * 2);

const dateTimeFromSlot = (date, slot) => {
  const [year, month, day] = parseDateParts(date);
  const minutes = toMinutes(slot);

  return new Date(
    year,
    month - 1,
    day,
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0
  );
};

const addMinutes = (date, minutes) =>
  new Date(date.getTime() + minutes * 60 * 1000);

const buildReservationDateTime = (reservation, field) => {
  const time = field === "start" ? reservation.start_time : reservation.end_time;
  return dateTimeFromSlot(reservation.reservation_date, time).toISOString();
};

export const normalizeReservation = (reservation) => ({
  id: reservation.id,
  guest_name: reservation.customer_name,
  phone_number: reservation.customer_phone,
  email: reservation.customer_email,
  guests: reservation.guests,
  date: reservation.reservation_date,
  slot: String(reservation.start_time || "").slice(0, 5),
  reservation_start: buildReservationDateTime(reservation, "start"),
  reservation_end: buildReservationDateTime(reservation, "end"),
  table_number: reservation.tenant_tables?.table_number || reservation.tenant_tables?.[0]?.table_number || null,
  source: reservation.source,
  status: String(reservation.status || "").toUpperCase(),
  special_notes: reservation.special_note,
});

export const validateReservationFilters = (filters = {}) => {
  if (filters.status && !new Set(["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"]).has(String(filters.status).toUpperCase())) {
    throw badRequest("status is not supported", "INVALID_STATUS_FILTER");
  }
  if (filters.date) {
    const value = String(filters.date);
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const parsed = match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : null;
    if (!match || parsed.getUTCFullYear() !== Number(match[1]) || parsed.getUTCMonth() !== Number(match[2]) - 1 || parsed.getUTCDate() !== Number(match[3])) {
      throw badRequest("date must be a valid YYYY-MM-DD calendar date", "INVALID_DATE");
    }
  }
  if (filters.source && !new Set(["online", "walk_in"]).has(String(filters.source))) {
    throw badRequest("source must be online or walk_in", "INVALID_SOURCE_FILTER");
  }
  if (filters.search != null && String(filters.search).length > 120) {
    throw badRequest("search must be 120 characters or fewer", "INVALID_SEARCH");
  }
  const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(filters.page_size, 10) || 50));
  return { page, pageSize };
};

const isDuplicateReservationError = (error) =>
  error?.code === "23505" ||
  error?.code === "23P01" ||
  error?.message?.includes("reservations_unique_active_slot") ||
  error?.message?.includes("reservations_no_active_table_overlap");

const assertAvailableSlot = async ({ tenant_id, date, guests, slot, source }) => {
  const slots = await availabilityService.getTimeSlots({ tenant_id, date, guests, source });
  const selectedSlot = slots.slots.find((candidate) => candidate.time === slot);

  if (!selectedSlot) {
    throw badRequest("slot is not valid for this date", "INVALID_SLOT");
  }

  if (!selectedSlot.is_available) {
    throw conflict("slot is no longer available", "SLOT_UNAVAILABLE");
  }
};

const getTables = async ({ tenant_id, guests }) => {
  const { data, error } = await supabaseAdmin
    .from("tenant_tables")
    .select("id, capacity")
    .eq("tenant_id", tenant_id)
    .eq("status", "available")
    .gte("capacity", guests)
    .lt("capacity", getMaximumSuitableCapacity(guests))
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
  const date = formatLocalDate(reservation_start);
  const startMinutes = reservation_start.getHours() * 60 + reservation_start.getMinutes();
  const endMinutes = reservation_end.getHours() * 60 + reservation_end.getMinutes();

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .select("id, table_id, guests, reservation_date, start_time, end_time, status, tenant_tables!inner(tenant_id)")
    .eq("tenant_tables.tenant_id", tenant_id)
    .eq("reservation_date", date)
    .lt("start_time", formatTime(endMinutes))
    .gt("end_time", formatTime(startMinutes))
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

const reservationQueryForTenant = (tenant_id) =>
  supabaseAdmin
    .from("reservations")
    .select(RESERVATION_COLUMNS)
    .eq("tenant_tables.tenant_id", tenant_id);

const getReservationById = async ({ tenant_id, id }) => {
  requireTenant(tenant_id);

  const { data, error } = await reservationQueryForTenant(tenant_id)
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
  const { page, pageSize } = validateReservationFilters(filters);
  await refreshExpiredReservations({ tenant_id, date: filters.date });

  let query = reservationQueryForTenant(tenant_id)
    .order("reservation_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (filters.status) {
    const status = String(filters.status);
    query = query.in("status", [status.toUpperCase(), status.toLowerCase()]);
  }

  if (filters.date) {
    query = query.eq("reservation_date", filters.date);
  }

  if (filters.source) {
    query = query.eq("source", filters.source);
  }

  if (filters.search) {
    const search = String(filters.search).replace(/[(),]/g, " ").trim();
    if (search) {
      const pattern = `%${search}%`;
      const clauses = [`customer_name.ilike.${pattern}`, `customer_phone.ilike.${pattern}`, `customer_email.ilike.${pattern}`];
      if (/^\d+$/.test(search)) clauses.push(`id.eq.${search}`);
      query = query.or(clauses.join(","));
    }
  }

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeReservation);
};

export const getReservation = async ({ tenant_id, id } = {}) => {
  await refreshExpiredReservations({ tenant_id });
  const reservation = await getReservationById({ tenant_id, id });
  return normalizeReservation(reservation);
};

export const createReservation = async ({ tenant_id, user_id, reservation, source = "dashboard" } = {}) => {
  requireTenant(tenant_id);

  await assertAvailableSlot({
    tenant_id,
    date: reservation.date,
    guests: reservation.guests,
    slot: reservation.slot,
    source,
  });

  const reservationStart = dateTimeFromSlot(reservation.date, reservation.slot);
  const reservationEnd = addMinutes(reservationStart, RESERVATION_DURATION_MINUTES);
  const tableId = await assignTable({
    tenant_id,
    guests: reservation.guests,
    reservation_start: reservationStart,
    reservation_end: reservationEnd,
  });

  const payload = buildReservationInsertPayload({
    tableId,
    userId: user_id,
    reservation,
    source,
    endTime: formatTime(toMinutes(reservation.slot) + RESERVATION_DURATION_MINUTES),
  });

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
  CONFIRMED: new Set(["SEATED", "NO_SHOW"]),
  SEATED: new Set(["COMPLETED"]),
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

  if (nextStatus === "NO_SHOW") {
    const graceEndsAt = addMinutes(
      new Date(buildReservationDateTime(reservation, "start")),
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

const updateReservationById = async ({ id, status }) => {
  const { error } = await supabaseAdmin
    .from("reservations")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
};

export const updateReservationStatus = async ({ tenant_id, id, status } = {}) => {
  await refreshExpiredReservations({ tenant_id });
  const nextStatus = String(status).toUpperCase();
  const reservation = await getReservationById({ tenant_id, id });
  const currentStatus = String(reservation.status || "").toUpperCase();

  assertStatusTransition(currentStatus, nextStatus, reservation);
  await updateReservationById({ id, status: nextStatus });

  const updatedReservation = await getReservationById({ tenant_id, id });
  return normalizeReservation(updatedReservation);
};

export const cancelReservation = async ({ tenant_id, id } = {}) => {
  await refreshExpiredReservations({ tenant_id });
  const reservation = await getReservationById({ tenant_id, id });
  const currentStatus = String(reservation.status || "").toUpperCase();

  if (currentStatus !== "CONFIRMED") {
    throw conflict("Only confirmed reservations can be cancelled", "INVALID_STATUS_FLOW");
  }

  const cancellationClosesAt = addMinutes(
    new Date(buildReservationDateTime(reservation, "start")),
    -CANCELLATION_WINDOW_MINUTES
  );

  if (new Date() > cancellationClosesAt) {
    throw conflict(
      "Reservations can only be cancelled up to 1 hour before reservation time",
      "CANCELLATION_WINDOW_CLOSED"
    );
  }

  await updateReservationById({ id, status: "CANCELLED" });

  const updatedReservation = await getReservationById({ tenant_id, id });
  return normalizeReservation(updatedReservation);
};
