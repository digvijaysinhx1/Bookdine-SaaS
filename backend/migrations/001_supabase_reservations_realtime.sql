-- Run this in Supabase SQL Editor after confirming your reservations table
-- uses tenant_id, date, time and status columns.

CREATE UNIQUE INDEX IF NOT EXISTS reservations_unique_active_slot
ON public.reservations (tenant_id, date, time)
WHERE status IN ('PENDING', 'CONFIRMED');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  END IF;
END $$;
