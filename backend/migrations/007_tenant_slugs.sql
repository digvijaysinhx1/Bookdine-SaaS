-- Reuse tenants.slug. Convert a UUID slug left by the first widget migration
-- to text, then normalize values before adding case-insensitive uniqueness.
DO $$
DECLARE slug_type text;
BEGIN
  SELECT data_type INTO slug_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'slug';

  IF slug_type IS NULL THEN
    RAISE EXCEPTION 'public.tenants.slug must exist before applying the slug migration';
  END IF;

  IF slug_type = 'uuid' THEN
    DROP INDEX IF EXISTS public.tenants_slug_unique;
    ALTER TABLE public.tenants ALTER COLUMN slug TYPE text USING slug::text;
  END IF;
END $$;

WITH candidates AS (
  SELECT id,
    coalesce(
      nullif(rtrim(left(trim(both '-' from regexp_replace(
        lower(coalesce(nullif(btrim(slug), ''), name, 'restaurant')),
        '[^a-z0-9]+', '-', 'g'
      )), 80), '-'), ''),
      'restaurant'
    ) AS candidate
  FROM public.tenants
), ranked AS (
  SELECT id, candidate,
    row_number() OVER (PARTITION BY candidate ORDER BY id) AS duplicate_rank
  FROM candidates
), repairs AS (
  SELECT id,
    CASE WHEN duplicate_rank > 1 THEN candidate || '-' || id::text ELSE candidate END AS slug
  FROM ranked
)
UPDATE public.tenants t
SET slug = repairs.slug
FROM repairs
WHERE t.id = repairs.id
  AND t.slug IS DISTINCT FROM repairs.slug;

DROP INDEX IF EXISTS public.tenants_slug_unique;
CREATE UNIQUE INDEX tenants_slug_unique
  ON public.tenants (lower(slug));
