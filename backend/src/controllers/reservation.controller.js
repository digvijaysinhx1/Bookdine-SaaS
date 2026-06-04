import * as reservationService from "../services/reservation.service.js";

export const createReservation = async (req, res, next) => {
  try {
    const result = await reservationService.createReservation(req.body);
    res.status(201).json({
      status: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getReservation = async (req, res, next) => {
  try {
    const reservation = await reservationService.getReservation();
    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (err) {
    next(err);
  }
};