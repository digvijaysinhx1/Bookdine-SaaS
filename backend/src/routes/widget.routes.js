import express from "express";
import * as controller from "../controllers/widget.controller.js";
import { validateAvailabilityQuery } from "../validators/availability.validator.js";
import { validateReservationCreate } from "../validators/reservation.validator.js";
import * as widgetService from "../services/widget.service.js";
import { badRequest } from "../utils/httpError.js";

const router = express.Router();
const slug = (req, res, next) => {
  try { req.params.slug = widgetService.validateSlug(req.params.slug); next(); }
  catch (error) { next(error); }
};
const email = (value) => {
  if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    throw badRequest("A valid email is required", "INVALID_EMAIL");
  }
  return value.trim().toLowerCase();
};
const validateOtpRequest = (req, res, next) => {
  try {
    req.body = {
      email: email(req.body?.email),
      phone_number: widgetService.normalizePhoneNumber(req.body?.phone_number),
    };
    next();
  } catch (error) { next(error); }
};
const validateBooking = (req, res, next) => {
  const otp = String(req.body?.otp || "").trim();
  const bookingEmail = req.body?.email;
  const bookingPhone = req.body?.phone_number;
  const requestId = req.body?.request_id;
  req.body = { ...req.body, source: "widget" };
  validateReservationCreate(req, res, (error) => {
    if (error) return next(error);
    try {
      if (!/^\d{6}$/.test(otp)) throw badRequest("otp must be a six-digit code", "INVALID_OTP");
      if (typeof requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw badRequest("request_id is invalid", "INVALID_REQUEST_ID");
      const validatedEmail = email(bookingEmail);
      if (validatedEmail !== req.body.email) throw badRequest("Booking email must match the verified email", "EMAIL_MISMATCH");
      const validatedPhone = widgetService.normalizePhoneNumber(bookingPhone);
      req.body = { ...req.body, phone_number: validatedPhone, email: validatedEmail, otp, request_id: requestId };
      next();
    } catch (validationError) { next(validationError); }
  });
};

router.get("/restaurants/:slug", slug, controller.restaurant);
router.get("/restaurants/:slug/slots", slug, validateAvailabilityQuery, controller.slots);
router.post("/restaurants/:slug/otp", slug, validateOtpRequest, controller.sendOtp);
router.post("/restaurants/:slug/bookings", slug, validateBooking, controller.book);

export default router;
