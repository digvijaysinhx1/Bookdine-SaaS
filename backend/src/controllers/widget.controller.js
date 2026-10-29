import * as widgetService from "../services/widget.service.js";

export const restaurant = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await widgetService.getRestaurant(req.params.slug),
    });
  } catch (error) {
    next(error);
  }
};

export const slots = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await widgetService.getSlots({
        slug: req.params.slug,
        date: req.query.date,
        guests: Number(req.query.guests),
      }),
    });
  } catch (error) {
    next(error);
  }
};

export const sendOtp = async (req, res, next) => {
  try {
    const request = await widgetService.sendPhoneOtp({
      slug: req.params.slug,
      email: req.body.email,
      phoneNumber: req.body.phone_number,
      ipAddress: req.ip,
    });
    const data = {
      request_id: request.request_id,
      message: "Verification code sent to your phone",
    };
    if (
      request.development_otp &&
      process.env.OTP_DEV_MODE === "true" &&
      process.env.NODE_ENV === "development"
    ) {
      data.development_otp = request.development_otp;
    }
    res.status(202).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const book = async (req, res, next) => {
  try {
    const {
      email,
      phone_number: phoneNumber,
      otp,
      request_id: requestId,
      ...reservation
    } = req.body;
    const result = await widgetService.verifyAndBook({
      slug: req.params.slug,
      reservation,
      email,
      phoneNumber,
      otp,
      requestId,
    });
    res
      .status(201)
      .json({
        success: true,
        data: { ...result, booking_reference: String(result.id) },
      });
  } catch (error) {
    next(error);
  }
};
