import * as availabilityService from "../services/availability.service.js";

export const getAvailability = async (req, res, next) => {
  try {
    const availability = await availabilityService.getAvailability({
      tenant_id: req.tenant_id,
      date: req.query.date,
      guests: req.query.guests,
      source: req.query.source,
    });

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (err) {
    next(err);
  }
};

export const getTimeSlots = async (req, res, next) => {
  try {
    const slots = await availabilityService.getTimeSlots({
      tenant_id: req.tenant_id,
      date: req.query.date,
      guests: req.query.guests,
      source: req.query.source,
    });

    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (err) {
    next(err);
  }
};
