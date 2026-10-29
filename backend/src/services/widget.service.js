import { supabaseAdmin } from "../db/index.js";
import { randomUUID } from "node:crypto";
import * as availabilityService from "./availability.service.js";
import * as reservationService from "./reservation.service.js";
import { createVerifiedWidgetReservation } from "./widgetBookingFlow.js";
import { badRequest, HttpError } from "../utils/httpError.js";
import { isValidSlug } from "../utils/slug.js";
import { createTenantSlugResolver } from "./tenantSlugResolver.js";
import {
  normalizePhoneNumber,
  requestWidgetOtp,
  verifyWidgetOtp,
  getWidgetBookingStatus,
  beginWidgetBooking,
  completeWidgetBooking,
  releaseWidgetBooking,
} from "./widgetOtp.service.js";

const getTenant = createTenantSlugResolver(supabaseAdmin);

export const getRestaurant = async (slug) => {
  const tenant = await getTenant(slug);
  return {
    name: tenant.name,
    opening_time: tenant.opening_time,
    closing_time: tenant.closing_time,
    minimum_guests: 1,
    maximum_guests: Math.min(tenant.max_guest || 15, 15),
    booking_window_days: 30,
    reservation_duration_minutes: 90,
    cancellation_hours_before: 1,
  };
};

export const getSlots = async ({ slug, date, guests }) => {
  const tenant = await getTenant(slug);
  return availabilityService.getTimeSlots({
    tenant_id: tenant.id,
    date,
    guests,
    source: "widget",
  });
};

export const sendPhoneOtp = async ({ slug, email, phoneNumber, ipAddress }) => {
  const tenant = await getTenant(slug);
  const requestId = randomUUID();
  const result = await requestWidgetOtp({
    requestId,
    tenantId: tenant.id,
    phoneNumber,
    email,
    ipAddress,
  });
  return { request_id: requestId, development_otp: result.developmentCode };
};

export const verifyAndBook = async ({
  slug,
  reservation,
  email,
  phoneNumber,
  otp,
  requestId,
}) => {
  const tenant = await getTenant(slug);
  const bookingBinding = { requestId, tenantId: tenant.id, phoneNumber, email };
  const existingBooking = await getWidgetBookingStatus(bookingBinding);
  if (existingBooking?.status === "complete")
    return reservationService.getReservation({
      tenant_id: tenant.id,
      id: existingBooking.reservationId,
    });
  if (existingBooking?.status === "processing") {
    throw new HttpError(409, "This booking request is already being processed", "BOOKING_IN_PROGRESS");
  }

  let bookingStarted = false;
  let reservationCreated = false;
  try {
    const booking = await createVerifiedWidgetReservation({
      requestId,
      tenantId: tenant.id,
      phoneNumber,
      email,
      otp,
      reservation,
      verifyPhone: verifyWidgetOtp,
      onVerified: async () => {
        bookingStarted = await beginWidgetBooking(bookingBinding);
        if (!bookingStarted) {
          throw new HttpError(409, "This booking request is already being processed", "BOOKING_IN_PROGRESS");
        }
      },
      createReservation: reservationService.createReservation,
    });
    reservationCreated = true;
    await completeWidgetBooking({ ...bookingBinding, reservationId: booking.id });
    return booking;
  } catch (error) {
    if (bookingStarted && !reservationCreated) {
      await releaseWidgetBooking(bookingBinding);
    }
    throw error;
  }
};

export const validateSlug = (value) => {
  if (!isValidSlug(value)) {
    throw badRequest("Restaurant slug is invalid", "INVALID_RESTAURANT_SLUG");
  }
  return value;
};

export { normalizePhoneNumber };
