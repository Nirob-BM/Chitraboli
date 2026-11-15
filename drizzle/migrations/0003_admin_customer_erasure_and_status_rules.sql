CREATE OR REPLACE FUNCTION public.order_status_transition_allowed(_from text, _to text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT _from IS NOT DISTINCT FROM _to OR CASE _from
    WHEN 'pending' THEN _to IN ('confirmed','processing','cancelled')
    WHEN 'confirmed' THEN _to IN ('processing','shipped','cancelled')
    WHEN 'processing' THEN _to IN ('shipped','cancelled')
    WHEN 'shipped' THEN _to IN ('delivered','returned')
    WHEN 'delivered' THEN _to IN ('returned')
    ELSE false END
$$;

CREATE OR REPLACE FUNCTION public.enforce_order_status_transition()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF NOT public.order_status_transition_allowed(OLD.status, NEW.status) THEN
    RAISE EXCEPTION 'An order cannot move from % to %', OLD.status, NEW.status USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_order_status_transition ON public.orders;
CREATE TRIGGER enforce_order_status_transition BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_status_transition();

CREATE OR REPLACE FUNCTION public.admin_erase_customer_data(_customer_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.customers%ROWTYPE;
  n_orders int := 0; n_notes int := 0; n_msgs int := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO c FROM public.customers WHERE id = _customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Customer not found' USING ERRCODE = 'P0002'; END IF;

  UPDATE public.orders SET
    customer_name = 'Deleted customer',
    customer_email = 'deleted-' || id::text || '@erased.invalid',
    customer_phone = '00000000000',
    customer_address = 'Removed on request',
    delivery_notes = NULL,
    payment_note = NULL
  WHERE (c.email IS NOT NULL AND lower(customer_email) = lower(c.email))
     OR (c.phone IS NOT NULL AND customer_phone = c.phone);
  GET DIAGNOSTICS n_orders = ROW_COUNT;

  DELETE FROM public.customer_notes
  WHERE (c.email IS NOT NULL AND lower(customer_email) = lower(c.email))
     OR (c.phone IS NOT NULL AND customer_phone = c.phone);
  GET DIAGNOSTICS n_notes = ROW_COUNT;

  DELETE FROM public.contact_messages WHERE c.email IS NOT NULL AND lower(email) = lower(c.email);
  GET DIAGNOSTICS n_msgs = ROW_COUNT;

  DELETE FROM public.customers WHERE id = _customer_id;

  INSERT INTO public.admin_activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'customer_data_erased', 'customer', _customer_id::text,
    jsonb_build_object('orders_anonymized', n_orders, 'notes_deleted', n_notes, 'messages_deleted', n_msgs));

  RETURN jsonb_build_object('orders_anonymized', n_orders, 'notes_deleted', n_notes, 'messages_deleted', n_msgs);
END $$;

REVOKE ALL ON FUNCTION public.admin_erase_customer_data(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_erase_customer_data(uuid) TO authenticated;