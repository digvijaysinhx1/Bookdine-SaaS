export const buildReservationInsertPayload = ({
  tableId,
  userId,
  reservation,
  source,
  endTime,
}) => ({
  table_id: tableId,
  customer_name: reservation.guest_name,
  customer_phone: reservation.phone_number,
  customer_email: reservation.email,
  guests: reservation.guests,
  reservation_date: reservation.date,
  start_time: reservation.slot,
  end_time: endTime,
  // Match the database constraint values for public and manual bookings.
  source: source === "widget" ? "online" : "walk_in",
  status: "confirmed",
  special_note: reservation.special_notes,
  created_by: userId || null,
});
