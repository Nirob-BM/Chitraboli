ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_key uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_token_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_key_unique ON public.orders(checkout_key) WHERE checkout_key IS NOT NULL;
CREATE TABLE public.cart_merge_receipts (user_id uuid NOT NULL, merge_key uuid NOT NULL, PRIMARY KEY(user_id,merge_key));
GRANT SELECT ON public.cart_merge_receipts TO authenticated;
GRANT ALL ON public.cart_merge_receipts TO service_role;
ALTER TABLE public.cart_merge_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_merge_receipts ON public.cart_merge_receipts FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.merge_guest_cart(_merge_key uuid, _items jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); item jsonb; existing uuid; existing_qty integer;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(uid::text));
 IF EXISTS(SELECT 1 FROM public.cart_merge_receipts WHERE user_id=uid AND merge_key=_merge_key) THEN RETURN; END IF;
 IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items)>100 THEN RAISE EXCEPTION 'Invalid cart'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(_items) LOOP
  IF (item->>'quantity')::integer < 1 OR (item->>'quantity')::integer > 999 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  SELECT id INTO existing FROM public.cart_items WHERE user_id=uid AND product_id=item->>'product_id' ORDER BY created_at LIMIT 1;
  IF existing IS NOT NULL THEN
   SELECT sum(quantity)::integer INTO existing_qty FROM public.cart_items WHERE user_id=uid AND product_id=item->>'product_id';
   DELETE FROM public.cart_items WHERE user_id=uid AND product_id=item->>'product_id' AND id<>existing;
   UPDATE public.cart_items SET quantity=existing_qty+(item->>'quantity')::integer WHERE id=existing;
  ELSE
   INSERT INTO public.cart_items(user_id,session_id,product_id,product_name,product_price,product_image,quantity) VALUES(uid,uid::text,item->>'product_id',item->>'product_name',(item->>'product_price')::numeric,item->>'product_image',(item->>'quantity')::integer);
  END IF;
 END LOOP;
 INSERT INTO public.cart_merge_receipts VALUES(uid,_merge_key);
END $$;
REVOKE ALL ON FUNCTION public.merge_guest_cart(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.merge_guest_cart(uuid,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.reserve_order_stock() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item record; available integer; stocked boolean;
BEGIN
 FOR item IN SELECT (value->>'product_id')::uuid AS product_id,sum((value->>'quantity')::integer)::integer AS quantity FROM jsonb_array_elements(NEW.items) GROUP BY (value->>'product_id')::uuid ORDER BY (value->>'product_id')::uuid LOOP
  SELECT stock_quantity,in_stock INTO available,stocked FROM public.products WHERE id=item.product_id FOR UPDATE;
  IF NOT FOUND OR stocked IS FALSE OR (available IS NOT NULL AND available<item.quantity) THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
  IF available IS NOT NULL THEN UPDATE public.products SET stock_quantity=available-item.quantity,in_stock=(available-item.quantity>0) WHERE id=item.product_id; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER reserve_order_stock BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.reserve_order_stock();