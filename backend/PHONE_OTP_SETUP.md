# Widget phone OTP and booking links

## Local development

Set `NODE_ENV=development` and `OTP_DEV_MODE=true` in `backend/.env`, then restart the backend. This explicitly enables the local mock OTP; the endpoint returns `development_otp` only in that mode. It does not send SMS and must not be enabled in production. Local OTP values are held as keyed hashes in process memory for 10 minutes, with a 60-second resend cooldown and five attempts. A backend restart clears local verification state.

Use an E.164 phone number such as `+14155552671`. The customer email remains a required booking detail and is bound to the pending OTP flow. No booking claim or reservation is written when the OTP is requested. The reservation is created by the existing reservation service only after successful phone verification.

## Production OTP

Production OTP uses Twilio Verify for SMS delivery/code checking and Upstash Redis for temporary request state, cooldowns, rate limits, attempt counters, verification locking, single-use state, and short-lived booking idempotency. OTP codes are generated and checked by Twilio; plaintext codes are never stored in Redis or returned by the production API. Redis/provider failures fail closed. Completed reservations remain in Supabase; Redis only caches their IDs briefly to make retries idempotent.

Set these variables only in the backend environment:

```dotenv
TWILIO_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH=replace-with-a-Twilio-auth-token
UPSTASH_REDIS_REST_URL=https://example.upstash.io
UPSTASH_REDIS_REST_TOKEN=replace-with-an-Upstash-token
```

Create a Twilio Verify Service and an Upstash Redis database, then supply their real values through the deployment secret manager. Do not put these values in Vite/frontend environment variables. The app enforces a 60-second per-phone resend cooldown, five SMS requests per phone per hour, twenty per IP per hour, and five verification attempts per request. Redis keys expire; reservations remain in Supabase as the source of truth.

## Public booking URL and embedding

Set `PUBLIC_APP_URL` in the backend to the public frontend origin, for example:

```dotenv
PUBLIC_APP_URL=https://bookdine.example.com
```

The settings page builds the absolute link using the implemented `/book/:slug` route. In local Vite development, it uses the current frontend origin if `PUBLIC_APP_URL` is not set. Production settings show a configuration message and disable link copying when the backend has no public URL.

The settings page also provides an iframe snippet for a cafe website. The frontend deployment's Content-Security-Policy should set `frame-ancestors` to the approved cafe website origins; this project does not add a global frame policy or serve the frontend itself, so configure that policy in the frontend hosting platform. Do not enable `X-Frame-Options: DENY` on the widget page if it must be embedded.

## Database

No OTP or booking-claim table is used by the current widget flow. This removes the `public.widget_booking_claims` schema-cache dependency. Apply `007_tenant_slugs.sql` if the tenant slug repair/unique index has not already been run. The existing reservation service continues to write reservations and assign tables in Supabase.
