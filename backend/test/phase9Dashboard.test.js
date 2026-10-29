import test from "node:test";
import assert from "node:assert/strict";
import { getLocalDateString, summarizeReservations } from "../src/services/dashboard.service.js";
import { normalizeReservation, validateReservationFilters } from "../src/services/reservation.service.js";

test("dashboard uses local calendar date and summarizes status and today rows", () => {
  const today = getLocalDateString(new Date(2026, 9, 28, 23, 59));
  assert.equal(today, "2026-10-28");
  const result = summarizeReservations([
    { id: 1, customer_name: "A", guests: 2, reservation_date: today, start_time: "19:00:00", status: "CONFIRMED", tenant_tables: { tenant_id: 9, table_number: "T1" } },
    { id: 2, customer_name: "B", guests: 4, reservation_date: "2026-10-29", start_time: "20:00:00", status: "SEATED" },
    { id: 3, customer_name: "C", guests: 1, reservation_date: today, start_time: "18:00:00", status: "CANCELLED" },
  ], today);
  assert.equal(result.today_total, 2);
  assert.equal(result.upcoming_total, 1);
  assert.equal(result.status_counts.confirmed, 1);
  assert.equal(result.status_counts.seated, 1);
  assert.equal(result.status_counts.cancelled, 1);
  assert.equal(result.today_reservations[0].table_number, "T1");
});

test("reservation filtering validates supported filters and caps page size", () => {
  assert.deepEqual(validateReservationFilters({ status: "confirmed", date: "2026-10-28", source: "online", page: "2", page_size: "500" }), { page: 2, pageSize: 100 });
  assert.throws(() => validateReservationFilters({ status: "OWNER" }), { code: "INVALID_STATUS_FILTER" });
  assert.throws(() => validateReservationFilters({ source: "other" }), { code: "INVALID_SOURCE_FILTER" });
  assert.throws(() => validateReservationFilters({ date: "yesterday" }), { code: "INVALID_DATE" });
  assert.throws(() => validateReservationFilters({ date: "2026-02-31" }), { code: "INVALID_DATE" });
});

test("normalized reservation response never contains tenant identifier", () => {
  const result = normalizeReservation({ id: 4, tenant_tables: { tenant_id: 123, table_number: "A1" }, reservation_date: "2026-10-28", start_time: "12:30", end_time: "14:00", status: "CONFIRMED" });
  assert.equal(result.table_number, "A1");
  assert.equal(Object.hasOwn(result, "tenant_id"), false);
});
