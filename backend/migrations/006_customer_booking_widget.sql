CREATE TABLE IF NOT EXISTS public.widget_booking_claims (
  id uuid PRIMARY KEY,
  tenant_id bigint NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete')),
  reservation_id bigint,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS widget_booking_claims_created_at_idx
  ON public.widget_booking_claims (created_at);

ALTER TABLE public.widget_booking_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.widget_booking_claims FROM anon, authenticated;
