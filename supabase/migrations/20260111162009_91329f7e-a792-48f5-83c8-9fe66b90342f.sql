-- Drop and recreate track_order function to include rider_id
DROP FUNCTION IF EXISTS public.track_order(text, text);

CREATE FUNCTION public.track_order(order_id text, phone_number text)
RETURNS TABLE (
  id uuid,
  customer_name text,
  status text,
  created_at timestamptz,
  total_amount numeric,
  items jsonb,
  rider_id uuid,
  rider_name text,
  rider_phone text,
  rider_vehicle_type text,
  rider_assigned_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.customer_name,
    o.status,
    o.created_at,
    o.total_amount,
    o.items,
    o.assigned_rider_id as rider_id,
    r.name as rider_name,
    r.phone as rider_phone,
    r.vehicle_type as rider_vehicle_type,
    o.rider_assigned_at
  FROM orders o
  LEFT JOIN delivery_riders r ON o.assigned_rider_id = r.id
  WHERE o.id::text = track_order.order_id
    AND o.customer_phone = track_order.phone_number;
END;
$$;