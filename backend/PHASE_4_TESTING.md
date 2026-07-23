# Bookdine Phase 4 Testing

Phase 4 covers backend-only availability testing for:

- `GET /api/availability`
- `GET /api/time-slots`

Do not test frontend, reservation creation, widgets, notifications, payments, or future booking flows as part of Phase 4.

## Files

- `backend/postman/Bookdine_Phase4.postman_collection.json`
- `backend/postman/Bookdine_Phase4.postman_environment.json`

## Import

1. Open Postman.
2. Import `Bookdine_Phase4.postman_collection.json`.
3. Import `Bookdine_Phase4.postman_environment.json`.
4. Select the `Bookdine Phase 4 - Availability Environment`.
5. Set the environment values for your local data.

## Environment Values

Required:

- `baseUrl`: backend URL, usually `http://localhost:3000`.
- `adminEmail`: restaurant admin email.
- `adminPassword`: restaurant admin password.
- `restaurantBTenantId`: a different tenant id used for isolation tests.
- `expiredToken`: a known expired JWT.

Business-logic data values:

- `validGuests`: normal party size, default `2`.
- `maxValidGuests`: maximum valid Bookdine party size, default `15`.
- `invalidGuests`: invalid party size, default `16`.
- `noSuitableTableGuests`: party size that has no single suitable active table in the seeded restaurant.
- `closedReservationDate`: a date configured in `restaurant_closed_dates`.
- `weeklyOpenDate`: a date whose weekday is configured open.
- `weeklyClosedDate`: a date whose weekday is configured closed.
- `differentTimingDate`: a date whose weekday uses different opening and closing hours.
- `fullyBookedDate`: a date where all suitable tables are occupied for all slots.

The collection automatically calculates:

- `phase4Today`
- `phase4Plus30`
- `phase4Plus31`

## Run Order

1. Start the backend:

```bash
cd backend
npm start
```

2. Run `LOGIN - Successful Login`.
3. Confirm `accessToken` is populated.
4. Run the remaining folders:

- `02 - GET /api/availability`
- `03 - GET /api/time-slots`
- `04 - Security And Validation`

## Expected Response Shapes

Successful availability response:

```json
{
  "success": true,
  "data": {
    "date": "2026-07-24",
    "guests": 2,
    "is_available": true,
    "available_tables_count": 4,
    "total_available_slots": 20,
    "total_slots": 20,
    "reservation_duration_minutes": 90,
    "slot_interval_minutes": 30,
    "booking_window_days": 30,
    "maximum_guests": 15
  }
}
```

Successful time-slots response:

```json
{
  "success": true,
  "data": {
    "date": "2026-07-24",
    "guests": 2,
    "reservation_duration_minutes": 90,
    "slot_interval_minutes": 30,
    "slots": [
      {
        "time": "12:00",
        "start_time": "12:00",
        "end_time": "13:30",
        "is_available": true,
        "available_tables_count": 4
      }
    ]
  }
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "TOKEN_REQUIRED",
    "message": "Bearer access token is required"
  }
}
```

## Business Logic Checklist

- Same day bookings: past slots are not returned.
- Booking window: today and plus 30 days are valid; plus 31 days is invalid.
- Maximum guests: 1 through 15 are valid when restaurant settings and tables allow them; 16 or more is invalid.
- Fully booked restaurants: API returns no available slots for a seeded fully booked date.
- No available tables: API rejects or reports no availability when no single suitable active table exists.
- Auto table assignment: smallest suitable table is preferred by availability calculation.
- No table combinations: two 2-seat tables must not satisfy a 4-guest request.
- Weekly closures: closed weekday returns no slots.
- Different timings: each weekday uses its configured opening and closing time.
- Last slot validation: a slot is valid only when `start + 90 minutes` is not after closing time.
- Past time slots: same-day responses exclude slots earlier than the current time.
- Closed reservation dates: configured closed dates return the closed-date error.
- Unauthorized access: missing, invalid, and expired tokens fail.
- Tenant isolation: cross-tenant query or header access returns `TENANT_FORBIDDEN`.

## Seed Data Notes

Some tests are data-dependent. Before running the full collection, seed or configure:

- At least one active table that can seat `validGuests`.
- At least one date with overlapping active reservations for fully booked behavior.
- A closed reservation date matching `closedReservationDate`.
- Weekly timing rows for open, closed, and different-hours days.
- A separate tenant id for `restaurantBTenantId`.

## Testing Architecture Suggestions

- Keep a dedicated Phase 4 seed script or SQL fixture for deterministic availability tests.
- Add a Newman command later so this collection can run in CI.
- Keep data-dependent tests in their own folder so smoke tests can run without heavy fixture setup.
