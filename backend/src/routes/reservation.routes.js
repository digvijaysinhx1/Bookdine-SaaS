import express from "express";
import * as reservationController from "../controllers/reservation.controller.js";
import {
  validateReservationCreate,
  validateReservationId,
  validateReservationStatus,
} from "../validators/reservation.validator.js";

const router = express.Router();

router.get("/", reservationController.getReservations);
router.get("/:id", validateReservationId, reservationController.getReservation);
router.post("/", validateReservationCreate, reservationController.createReservation);
router.put(
  "/:id/status",
  validateReservationId,
  validateReservationStatus,
  reservationController.updateReservationStatus
);
router.post(
  "/:id/cancel",
  validateReservationId,
  reservationController.cancelReservation
);

export default router;
