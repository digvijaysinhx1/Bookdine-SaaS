import test from "node:test";
import assert from "node:assert/strict";
import { createVerifiedWidgetReservation } from "../src/services/widgetBookingFlow.js";
import { buildReservationInsertPayload } from "../src/services/reservationPayload.js";

test("verified widget phone is mapped to reservations.customer_phone", async () => {
  const verifiedPhone = "+14155550123";
  let createdInput;
  const result = await createVerifiedWidgetReservation({
    requestId: "request-1",
    tenantId: "tenant-1",
    phoneNumber: verifiedPhone,
    email: "guest@example.com",
    otp: "123456",
    // A conflicting body value must never override the OTP-bound number.
    reservation: { guest_name: "Guest", phone_number: "+14155550999", guests: 2, date: "2026-10-25", slot: "18:00" },
    verifyPhone: async ({ phoneNumber }) => phoneNumber === verifiedPhone,
    createReservation: async (input) => {
      createdInput = input;
      return { id: "reservation-1" };
    },
  });

  assert.deepEqual(result, { id: "reservation-1" });
  assert.equal(createdInput.reservation.phone_number, verifiedPhone);
  const payload = buildReservationInsertPayload({
    tableId: "table-1",
    userId: null,
    reservation: createdInput.reservation,
    source: createdInput.source,
    endTime: "19:30",
  });
  assert.equal(payload.customer_phone, verifiedPhone);
  assert.equal(payload.customer_email, "guest@example.com");
  assert.equal(payload.source, "online");
});

test("non-widget reservations use the allowed walk_in source value", () => {
  const payload = buildReservationInsertPayload({
    tableId: "table-1",
    userId: "user-1",
    reservation: { guest_name: "Guest", phone_number: "+14155550123", guests: 2, date: "2026-10-25", slot: "18:00" },
    source: "dashboard",
    endTime: "19:30",
  });

  assert.equal(payload.source, "walk_in");
});

test("widget reservation is rejected and not created unless OTP verification succeeds", async () => {
  let verifiedHookCalled = false;
  let createCalled = false;

  await assert.rejects(
    createVerifiedWidgetReservation({
      requestId: "request-2",
      tenantId: "tenant-1",
      phoneNumber: "+14155550123",
      email: "guest@example.com",
      otp: "000000",
      reservation: { guest_name: "Guest", guests: 2 },
      verifyPhone: async () => false,
      onVerified: async () => { verifiedHookCalled = true; },
      createReservation: async () => { createCalled = true; },
      verified: true,
    }),
    (error) => error.code === "INVALID_OTP" && error.statusCode === 401,
  );

  assert.equal(verifiedHookCalled, false);
  assert.equal(createCalled, false);
});
