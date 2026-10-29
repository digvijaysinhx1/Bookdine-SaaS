import { supabaseAdmin } from "../db/index.js";
import { refreshExpiredReservations } from "./reservationStatus.service.js";

const STATUS_BUCKETS = ["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"];

export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const summarizeReservations = (reservations, today) => {
  const statusCounts = Object.fromEntries(STATUS_BUCKETS.map((status) => [status.toLowerCase(), 0]));
  const todayReservations = [];
  let upcomingCount = 0;

  for (const reservation of reservations) {
    const status = String(reservation.status || "").toUpperCase();
    const normalizedStatus = status.toLowerCase();
    if (Object.hasOwn(statusCounts, normalizedStatus)) statusCounts[normalizedStatus] += 1;
    if (reservation.reservation_date > today) upcomingCount += 1;
    if (reservation.reservation_date === today) {
      todayReservations.push({
        id: reservation.id,
        guest_name: reservation.customer_name,
        time: String(reservation.start_time || "").slice(0, 5),
        guests: reservation.guests,
        table_number: reservation.tenant_tables?.table_number || reservation.tenant_tables?.[0]?.table_number || null,
        status: normalizedStatus,
      });
    }
  }

  return { today_total: todayReservations.length, upcoming_total: upcomingCount, status_counts: statusCounts, today_reservations: todayReservations };
};

export const getDashboard = async ({ tenant_id } = {}) => {
  await refreshExpiredReservations({ tenant_id });
  const today = getLocalDateString();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 30);
  const throughDate = getLocalDateString(horizon);

  const [reservationsResult, tenantResult] = await Promise.all([
    supabaseAdmin.from("reservations")
      .select("id, customer_name, guests, reservation_date, start_time, status, tenant_tables!inner(tenant_id, table_number)")
      .eq("tenant_tables.tenant_id", tenant_id)
      .gte("reservation_date", today)
      .lte("reservation_date", throughDate)
      .order("reservation_date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabaseAdmin.from("tenants").select("name").eq("id", tenant_id).maybeSingle(),
  ]);

  if (reservationsResult.error) throw new Error(reservationsResult.error.message);
  if (tenantResult.error) throw new Error(tenantResult.error.message);

  return { restaurant_name: tenantResult.data?.name || null, ...summarizeReservations(reservationsResult.data || [], today) };
};
