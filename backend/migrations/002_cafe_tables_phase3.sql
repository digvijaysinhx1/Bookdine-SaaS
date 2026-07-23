ALTER TABLE public.cafe_tables
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.cafe_tables
ALTER COLUMN is_active SET DEFAULT true;

UPDATE public.cafe_tables
SET is_active = true
WHERE is_active IS NULL;

UPDATE public.cafe_tables
SET updated_at = now()
WHERE updated_at IS NULL;

ALTER TABLE public.cafe_tables
ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE public.cafe_tables
ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.cafe_tables
DROP CONSTRAINT IF EXISTS cafe_tables_location_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cafe_tables_table_number_not_empty'
      AND conrelid = 'public.cafe_tables'::regclass
  ) THEN
    ALTER TABLE public.cafe_tables
    ADD CONSTRAINT cafe_tables_table_number_not_empty
    CHECK (length(btrim(table_number)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cafe_tables_capacity_positive'
      AND conrelid = 'public.cafe_tables'::regclass
  ) THEN
    ALTER TABLE public.cafe_tables
    ADD CONSTRAINT cafe_tables_capacity_positive
    CHECK (capacity > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cafe_tables_location_not_empty'
      AND conrelid = 'public.cafe_tables'::regclass
  ) THEN
    ALTER TABLE public.cafe_tables
    ADD CONSTRAINT cafe_tables_location_not_empty
    CHECK (length(btrim(location)) > 0);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS cafe_tables_unique_table_number
ON public.cafe_tables (tenant_id, lower(table_number));

CREATE OR REPLACE FUNCTION public.set_cafe_tables_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_cafe_tables_updated_at ON public.cafe_tables;

CREATE TRIGGER set_cafe_tables_updated_at
BEFORE UPDATE ON public.cafe_tables
FOR EACH ROW
EXECUTE FUNCTION public.set_cafe_tables_updated_at();
