ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE candidate text;
BEGIN
  IF NEW.order_number IS NOT NULL AND NEW.order_number <> '' THEN RETURN NEW; END IF;
  LOOP
    candidate := 'CHB-' || to_char(COALESCE(NEW.created_at, now()) AT TIME ZONE 'Asia/Dhaka', 'YYMMDD') || '-' ||
      upper(substr(md5(gen_random_uuid()::text), 1, 5));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = candidate);
  END LOOP;
  NEW.order_number := candidate;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
CREATE TRIGGER trg_set_order_number BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

UPDATE public.orders SET order_number = 'CHB-' || to_char(created_at AT TIME ZONE 'Asia/Dhaka', 'YYMMDD') || '-' || upper(substr(replace(id::text,'-',''), 1, 5))
WHERE order_number IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON public.orders(order_number);