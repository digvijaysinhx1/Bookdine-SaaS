import { supabaseAdmin } from "../db/index.js";
import { badRequest, conflict, HttpError } from "../utils/httpError.js";

const RESERVATION_DURATION_MINUTES = 90;
const SLOT_INTERVAL_MINUTES = 30;
const BOOKING_WINDOW_DAYS = 30;
const MIN_GUESTS = 1;
const BOOKDINE_MAX_GUESTS = 15;
const ACTIVE_RESERVATION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SEATED",
  "pending",
  "confirmed",
  "seated",
];
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205"]);

const requireTenant = (tenant_id) => {
  if (!tenant_id) {
    throw new HttpError(
      401,
      "Authenticated user is missing tenant context",
      "TENANT_REQUIRED"
    );
  }
};

const toMinutes = (time) => {
  const [hours, minutes] = String(time).slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
};

const getMaximumSuitableCapacity = (guests) => (guests === 1 ? 4 : guests * 2);

const formatTime = (minutes) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const parseLocalDate = (date) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const dateTimeFromMinutes = (date, minutes) => {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(
    Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60, 0, 0)
  );
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDayOfWeek = (date) => parseLocalDate(date).getDay();

const isMissingOptionalTable = (error) =>
  MISSING_TABLE_CODES.has(error?.code) ||
  error?.message?.toLowerCase().includes("could not find the table");

const getRestaurantSettings = async (tenant_id) => {
  const { data, error } = await supabaseAdmin
    .from("restaurant_settings")
    .select("opening_time, closing_time, minimum_guests, maximum_guests, is_active")
    .eq("tenant_id", tenant_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new HttpError(404, "Restaurant settings were not found", "SETTINGS_NOT_FOUND");
  }

  return data;
};

const getWeeklyTiming = async ({ tenant_id, date, settings }) => {
  const { data, error } = await supabaseAdmin
    .from("restaurant_weekly_timings")
    .select("opening_time, closing_time, is_closed")
    .eq("tenant_id", tenant_id)
    .eq("day_of_week", getDayOfWeek(date))
    .maybeSingle();

  if (error) {
    if (isMissingOptionalTable(error)) {
      return {
        opening_time: settings.opening_time,
        closing_time: settings.closing_time,
        is_closed: !settings.is_active,
        source: "restaurant_settings",
      };
    }

    throw new Error(error.message);
  }

  if (!data) {
    return {
      opening_time: settings.opening_time,
      closing_time: settings.closing_time,
      is_closed: !settings.is_active,
      source: "restaurant_settings",
    };
  }

  return {
    opening_time: data.opening_time,
    closing_time: data.closing_time,
    is_closed: Boolean(data.is_closed),
    source: "weekly_timings",
  };
};

const isReservationClosedDate = async ({ tenant_id, date }) => {
  const { data, error } = await supabaseAdmin
    .from("restaurant_closed_dates")
    .select("id")
    .eq("tenant_id", tenant_id)
    .eq("closed_date", date)
    .eq("is_active", true)
    .limit(1);

  if (error) {
    if (isMissingOptionalTable(error)) {
      return false;
    }

    throw new Error(error.message);
  }

  return Boolean(data?.length);
};

const validateGuests = ({ guests, settings }) => {
  const configuredMaximum = settings.maximum_guests || BOOKDINE_MAX_GUESTS;
  const maximumGuests = Math.min(configuredMaximum, BOOKDINE_MAX_GUESTS);

  if (guests < MIN_GUESTS) {
    throw badRequest(
      `guests must be at least ${MIN_GUESTS}`,
      "INVALID_GUEST_COUNT"
    );
  }

  if (guests > maximumGuests) {
    throw badRequest(
      `guests cannot be greater than ${maximumGuests}`,
      "MAX_GUESTS_EXCEEDED"
    );
  }

  return maximumGuests;
};

const validateBookingWindow = (date) => {
  const requested = parseLocalDate(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latest = addDays(today, BOOKING_WINDOW_DAYS);
  latest.setHours(0, 0, 0, 0);

  if (requested < today) {
    throw badRequest("date cannot be in the past", "PAST_DATE");
  }

  if (requested > latest) {
    throw badRequest(
      `date must be within ${BOOKING_WINDOW_DAYS} days`,
      "BOOKING_WINDOW_VIOLATION"
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

const getReservations = async ({ tenant_id, date, openingMinutes, closingMinutes }) => {
  const rangeStart = dateTimeFromMinutes(date, openingMinutes);
  const rangeEnd = dateTimeFromMinutes(date, closingMinutes);

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .select("id, table_id, no_of_guests, reservation_start, reservation_end, status")
    .eq("tenant_id", tenant_id)
    .lt("reservation_start", rangeEnd.toISOString())
    .gt("reservation_end", rangeStart.toISOString())
    .in("status", ACTIVE_RESERVATION_STATUSES);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const overlapsSlot = (reservation, slotStart, slotEnd) => {
  const reservationStart = new Date(reservation.reservation_start);
  const reservationEnd = new Date(reservation.reservation_end);
  return reservationStart < slotEnd && reservationEnd > slotStart;
};

const getUnavailableTableIds = ({ reservations, tables, slotStart, slotEnd }) => {
  const unavailableIds = new Set();
  const unassignedReservations = [];

  for (const reservation of reservations) {
    if (!overlapsSlot(reservation, slotStart, slotEnd)) {
      continue;
    }

    if (reservation.table_id) {
      unavailableIds.add(reservation.table_id);
    } else {
      unassignedReservations.push(reservation);
    }
  }

  for (const reservation of unassignedReservations) {
    const guests = reservation.no_of_guests || MIN_GUESTS;
    const table = tables.find(
      (candidate) =>
        candidate.capacity >= guests &&
        candidate.capacity < getMaximumSuitableCapacity(guests) &&
        !unavailableIds.has(candidate.id)
    );

    if (table) {
      unavailableIds.add(table.id);
    }
  }

  return unavailableIds;
};

const getNextAllowedSameDaySlot = (now) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return Math.ceil(currentMinutes / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES +
    SLOT_INTERVAL_MINUTES;
};

const buildSlots = ({ date, timing, tables, reservations, source }) => {
  if (timing.is_closed) {
    throw conflict("Restaurant is closed for reservations on this day", "RESTAURANT_CLOSED");
  }

  const openingMinutes = toMinutes(timing.opening_time);
  const closingMinutes = toMinutes(timing.closing_time);
  const lastStartMinutes = closingMinutes - RESERVATION_DURATION_MINUTES;

  if (lastStartMinutes < openingMinutes) {
    throw conflict("Restaurant opening hours do not allow a reservation slot", "NO_TIME_SLOTS");
  }

  const today = new Date();
  const isToday = date === formatLocalDate(today);
  const usesWidgetBuffer = source !== "dashboard";
  const firstSlotMinutes = isToday && usesWidgetBuffer
    ? Math.max(openingMinutes, getNextAllowedSameDaySlot(today))
    : openingMinutes;

  const slots = [];

  for (
    let startMinutes = firstSlotMinutes;
    startMinutes <= lastStartMinutes;
    startMinutes += SLOT_INTERVAL_MINUTES
  ) {
    const endMinutes = startMinutes + RESERVATION_DURATION_MINUTES;
    const slotStart = dateTimeFromMinutes(date, startMinutes);
    const slotEnd = dateTimeFromMinutes(date, endMinutes);
    const unavailableIds = getUnavailableTableIds({
      reservations,
      tables,
      slotStart,
      slotEnd,
    });
    const availableTables = tables.filter((table) => !unavailableIds.has(table.id));

    slots.push({
      time: formatTime(startMinutes),
      start_time: formatTime(startMinutes),
      end_time: formatTime(endMinutes),
      is_available: availableTables.length > 0,
      available_tables_count: availableTables.length,
    });
  }

  return slots;
};

const buildAvailabilityContext = async ({ tenant_id, date, guests, source }) => {
  requireTenant(tenant_id);
  validateBookingWindow(date);

  const settings = await getRestaurantSettings(tenant_id);
  const maximumGuests = validateGuests({ guests, settings });

  const isClosedDate = await isReservationClosedDate({ tenant_id, date });
  if (isClosedDate) {
    throw conflict("Restaurant has closed reservations for this date", "RESERVATION_DATE_CLOSED");
  }

  const timing = await getWeeklyTiming({ tenant_id, date, settings });
  const openingMinutes = toMinutes(timing.opening_time);
  const closingMinutes = toMinutes(timing.closing_time);
  const tables = await getTables({ tenant_id, guests });
  const reservations = await getReservations({
    tenant_id,
    date,
    openingMinutes,
    closingMinutes,
  });
  const slots = buildSlots({ date, timing, tables, reservations, source });

  return {
    date,
    guests,
    maximum_guests: maximumGuests,
    reservation_duration_minutes: RESERVATION_DURATION_MINUTES,
    slot_interval_minutes: SLOT_INTERVAL_MINUTES,
    booking_window_days: BOOKING_WINDOW_DAYS,
    timing_source: timing.source,
    slots,
  };
};

export const getTimeSlots = async ({ tenant_id, date, guests, source } = {}) => {
  const context = await buildAvailabilityContext({ tenant_id, date, guests, source });

  return {
    date: context.date,
    guests: context.guests,
    reservation_duration_minutes: context.reservation_duration_minutes,
    slot_interval_minutes: context.slot_interval_minutes,
    slots: context.slots,
  };
};

export const getAvailability = async ({ tenant_id, date, guests } = {}) => {
  const context = await buildAvailabilityContext({ tenant_id, date, guests });
  const availableSlots = context.slots.filter((slot) => slot.is_available);
  const maxAvailableTables = context.slots.reduce(
    (max, slot) => Math.max(max, slot.available_tables_count),
    0
  );

  return {
    date: context.date,
    guests: context.guests,
    is_available: availableSlots.length > 0,
    available_tables_count: maxAvailableTables,
    total_available_slots: availableSlots.length,
    total_slots: context.slots.length,
    reservation_duration_minutes: context.reservation_duration_minutes,
    slot_interval_minutes: context.slot_interval_minutes,
    booking_window_days: context.booking_window_days,
    maximum_guests: context.maximum_guests,
  };
};
