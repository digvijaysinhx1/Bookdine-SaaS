import express from "express";
import * as availabilityController from "../controllers/availability.controller.js";
import { validateAvailabilityQuery } from "../validators/availability.validator.js";

const router = express.Router();

router.get("/availability", validateAvailabilityQuery, availabilityController.getAvailability);
router.get("/time-slots", validateAvailabilityQuery, availabilityController.getTimeSlots);

export default router;
