import { HttpError } from "../utils/httpError.js";

export const createVerifiedWidgetReservation = async ({
  requestId,
  tenantId,
  phoneNumber,
  email,
  otp,
  reservation,
  verifyPhone,
  onVerified = async () => {},
  createReservation,
}) => {
  const verified = await verifyPhone({
    requestId,
    tenantId,
    phoneNumber,
    email,
    code: otp,
  });
  if (verified !== true) {
    throw new HttpError(401, "Phone verification is required", "INVALID_OTP");
  }

  await onVerified();
  return createReservation({
    tenant_id: tenantId,
    reservation: {
      ...reservation,
      email,
      // This value is trusted only after verifyPhone confirms it for this flow.
      phone_number: phoneNumber,
    },
    source: "widget",
  });
};
