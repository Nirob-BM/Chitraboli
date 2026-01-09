-- Create delivery riders table
CREATE TABLE public.delivery_riders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  vehicle_type TEXT DEFAULT 'motorcycle',
  license_number TEXT,
  is_active BOOLEAN DEFAULT true,
  current_status TEXT DEFAULT 'available',
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on delivery_riders
ALTER TABLE public.delivery_riders ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery_riders
CREATE POLICY "Admins can view delivery riders"
ON public.delivery_riders FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage delivery riders"
ON public.delivery_riders FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add rider assignment columns to orders table
ALTER TABLE public.orders 
ADD COLUMN assigned_rider_id UUID REFERENCES public.delivery_riders(id),
ADD COLUMN rider_assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN delivery_notes TEXT;

-- Create rider delivery history table for tracking
CREATE TABLE public.rider_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID NOT NULL REFERENCES public.delivery_riders(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'assigned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rider_deliveries
ALTER TABLE public.rider_deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies for rider_deliveries
CREATE POLICY "Admins can view rider deliveries"
ON public.rider_deliveries FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage rider deliveries"
ON public.rider_deliveries FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for delivery_riders
CREATE TRIGGER update_delivery_riders_updated_at
BEFORE UPDATE ON public.delivery_riders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();