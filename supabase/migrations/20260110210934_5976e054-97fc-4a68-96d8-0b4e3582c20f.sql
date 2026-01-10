-- Drop the old function first
DROP FUNCTION IF EXISTS public.track_order(text, text);

-- Create new track_order function with rider info
CREATE OR REPLACE FUNCTION public.track_order(order_id text, phone_number text)
RETURNS TABLE(
  id uuid, 
  status text, 
  created_at timestamptz, 
  total_amount numeric, 
  items jsonb, 
  customer_name text,
  rider_name text,
  rider_phone text,
  rider_vehicle_type text,
  rider_assigned_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Validate inputs - require both values
  IF order_id IS NULL OR length(trim(order_id)) < 10 THEN
    RAISE EXCEPTION 'Valid order ID is required';
  END IF;
  
  IF phone_number IS NULL OR length(trim(phone_number)) < 10 THEN
    RAISE EXCEPTION 'Valid phone number (10+ digits) is required';
  END IF;

  -- Require BOTH order ID AND phone number match for security
  RETURN QUERY
  SELECT 
    o.id,
    o.status,
    o.created_at,
    o.total_amount,
    o.items,
    o.customer_name,
    dr.name as rider_name,
    dr.phone as rider_phone,
    dr.vehicle_type as rider_vehicle_type,
    o.rider_assigned_at
  FROM orders o
  LEFT JOIN delivery_riders dr ON o.assigned_rider_id = dr.id
  WHERE o.id::text = trim(track_order.order_id)
    AND o.customer_phone = trim(track_order.phone_number);
END;
$$;