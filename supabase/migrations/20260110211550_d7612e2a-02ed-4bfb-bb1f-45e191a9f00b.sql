-- Add location columns to delivery_riders table
ALTER TABLE public.delivery_riders 
ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- Enable realtime for delivery_riders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_riders;