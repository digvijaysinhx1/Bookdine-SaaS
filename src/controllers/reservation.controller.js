const reservationService = require("../services/reservation.service");
const getReservation = require("../services/reservation.service")

exports.createReservation = async (req, res, next) => {
  try {
    const result = await reservationService.createReservation(req.body);
    res.status(201).json({
        status:true,
        data:result
    });
  } catch (err) {
    next(err);
  }
};

exports.getReservation = async(req, res, next) =>{
    try {
        const reservation = await reservationService.getReservation()
        res.status(200).json({
            success:true,
            data: reservation
        })
    } catch (error) {
        next(err)
    }
}