import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import * as widget from "../../services/widgetService.js";

const localDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const prettyDate = (date) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export default function BookingWidget() {
  const { slug } = useParams();
  const today = useMemo(() => localDate(new Date()), []);
  const [restaurant, setRestaurant] = useState(null);
  const [date, setDate] = useState(today);
  const [guests, setGuests] = useState(2);
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    guest_name: "",
    phone_number: "",
    email: "",
    special_notes: "",
  });
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [clockNow, setClockNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    widget
      .getWidgetRestaurant(slug)
      .then(setRestaurant)
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!restaurant) return;
    setLoading(true);
    setSelected(null);
    setMessage("");
    widget
      .getWidgetSlots(slug, { date, guests })
      .then((data) => setSlots(data.slots.filter((slot) => slot.is_available)))
      .catch((e) => {
        setSlots([]);
        setMessage(e.message);
      })
      .finally(() => setLoading(false));
  }, [slug, restaurant, date, guests]);

  useEffect(() => {
    if (!otpSent) return undefined;
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [otpSent]);

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const requestCode = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const result = await widget.requestWidgetOtp(slug, {
        email: form.email,
        phone_number: form.phone_number,
      });
      setRequestId(result.request_id);
      setOtpSent(true);
      setResendAt(Date.now() + 60000);
      setMessage(
        result.development_otp
          ? `Development-only SMS OTP: ${result.development_otp}. This local code is not production verification.`
          : "A verification code was sent to your phone.",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSubmitting(false);
    }
  };
  const submitBooking = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const data = await widget.createWidgetBooking(slug, {
        ...form,
        guests,
        date,
        slot: selected.time,
        otp,
        request_id: requestId,
      });
      setBooking(data);
    } catch (e) {
      setMessage(e.message);
      if (e.code === "INVALID_OTP") setOtp("");
      if (e.code === "SLOT_UNAVAILABLE" || e.code === "INVALID_SLOT") {
        setSelected(null);
        try {
          const latest = await widget.getWidgetSlots(slug, { date, guests });
          setSlots(latest.slots.filter((slot) => slot.is_available));
        } catch {
          setSlots([]);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !restaurant)
    return (
      <main className="mx-auto max-w-lg p-6 text-center">
        Loading restaurant…
      </main>
    );
  if (!restaurant)
    return (
      <main className="mx-auto max-w-lg p-6 text-center text-red-700">
        {message || "Restaurant not found."}
      </main>
    );
  if (booking)
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
            Reservation confirmed
          </p>
          <h1 className="mt-2 text-2xl font-bold">
            You’re booked at {restaurant.name}
          </h1>
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm">
            <dt className="text-slate-500">Reference</dt>
            <dd className="font-semibold">{booking.booking_reference}</dd>
            <dt className="text-slate-500">Date</dt>
            <dd>{prettyDate(booking.date)}</dd>
            <dt className="text-slate-500">Time</dt>
            <dd>
              {booking.slot} – {booking.reservation_end.slice(11, 16)}
            </dd>
            <dt className="text-slate-500">Guests</dt>
            <dd>{booking.guests}</dd>
          </dl>
          <p className="mt-6 text-sm text-slate-600">
            Changes or cancellations are available through the restaurant.
            Cancellations close one hour before your reservation.
          </p>
        </section>
      </main>
    );

  return (
    <main className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="bg-slate-900 px-6 py-7 text-white">
          <p className="text-sm text-slate-300">Reserve a table</p>
          <h1 className="mt-1 text-2xl font-bold">{restaurant.name}</h1>
          <p className="mt-2 text-sm text-slate-300">
            {restaurant.opening_time.slice(0, 5)} –{" "}
            {restaurant.closing_time.slice(0, 5)} · 90 minute seating
          </p>
        </header>
        <form
          onSubmit={otpSent ? submitBooking : requestCode}
          className="space-y-5 p-5 sm:p-7"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Date
              <input
                type="date"
                required
                min={today}
                max={localDate(new Date(Date.now() + 30 * 86400000))}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
            <label className="text-sm font-medium">
              Guests
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5"
              >
                {Array.from({ length: restaurant.maximum_guests }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Available times</p>
            {loading ? (
              <p className="text-sm text-slate-500">Checking availability…</p>
            ) : slots.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    type="button"
                    key={slot.time}
                    onClick={() => setSelected(slot)}
                    className={`rounded-lg border px-2 py-2.5 text-sm ${selected?.time === slot.time ? "border-green-700 bg-green-50 text-green-800" : "border-slate-300 hover:border-green-600"}`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                No available times for this date and party size.
              </p>
            )}
            {selected && (
              <p className="mt-2 text-sm text-slate-600">
                Selected: {selected.start_time}–{selected.end_time}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Your name
              <input
                required
                maxLength="120"
                value={form.guest_name}
                onChange={update("guest_name")}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
            <label className="text-sm font-medium">
              Phone
              <input
                required
                maxLength="30"
                type="tel"
                autoComplete="tel"
                placeholder="+14155552671"
                value={form.phone_number}
                onChange={(e) => {
                  update("phone_number")(e);
                  setOtpSent(false);
                }}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
              <span className="text-xs text-slate-500">
                Use international E.164 format, including + and country code.
              </span>
            </label>
          </div>
          <label className="block text-sm font-medium">
            Email
            <input
              required
              maxLength="255"
              type="email"
              value={form.email}
              onChange={(e) => {
                update("email")(e);
                setOtpSent(false);
              }}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5"
            />
          </label>
          <label className="block text-sm font-medium">
            Special notes{" "}
            <span className="font-normal text-slate-500">(optional)</span>
            <textarea
              maxLength="1000"
              rows="2"
              value={form.special_notes}
              onChange={update("special_notes")}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5"
            />
          </label>
          {otpSent && (
            <label className="block text-sm font-medium">
              SMS verification code
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
          )}
          {message && (
            <p
              role="status"
              className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700"
            >
              {message}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              disabled={!selected || loading || submitting}
              className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {submitting
                ? "Please wait…"
                : otpSent
                  ? "Verify & reserve"
                  : "Send Verification code"}
            </button>
            {otpSent && (
              <button
                type="button"
                disabled={clockNow < resendAt || submitting}
                onClick={requestCode}
                className="rounded-lg border px-4 py-3 text-sm disabled:opacity-50"
              >
                {clockNow < resendAt
                  ? `Resend in ${Math.ceil((resendAt - clockNow) / 1000)}s`
                  : "Resend code"}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Bookings are available up to 30 days ahead. Cancellations close one
            hour before the reservation.
          </p>
        </form>
      </section>
    </main>
  );
}
