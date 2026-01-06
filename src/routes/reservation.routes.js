const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservation.controller");

router.post("/", reservationController.createReservation);
router.get("/", reservationController.getReservation)

module.exports = router;