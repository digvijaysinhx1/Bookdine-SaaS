import * as reservationService from "../services/reservation.service.js";

export const createReservation = async (req, res, next) => {
  try {
    const result = await reservationService.createReservation({
      tenant_id: req.tenant_id,
      user_id: req.user?.id,
      reservation: req.body,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getReservations = async (req, res, next) => {
  try {
    const reservations = await reservationService.getReservations({
      tenant_id: req.tenant_id,
      filters: req.query,
    });

    res.status(200).json({
      success: true,
      data: reservations,
    });
  } catch (err) {
    next(err);
  }
};

export const getReservation = async (req, res, next) => {
  try {
    const reservation = await reservationService.getReservation({
      tenant_id: req.tenant_id,
      id: req.params.id,
    });

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (err) {
    next(err);
  }
};

export const updateReservationStatus = async (req, res, next) => {
  try {
    const reservation = await reservationService.updateReservationStatus({
      tenant_id: req.tenant_id,
      id: req.params.id,
      status: req.body.status,
    });

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await reservationService.cancelReservation({
      tenant_id: req.tenant_id,
      id: req.params.id,
    });

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (err) {
    next(err);
  }
};
