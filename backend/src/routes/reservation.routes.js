import express from "express";
import * as reservationController from "../controllers/reservation.controller.js";

const router = express.Router();

router.post("/", reservationController.createReservation);
router.get("/", reservationController.getReservation);

export default router;