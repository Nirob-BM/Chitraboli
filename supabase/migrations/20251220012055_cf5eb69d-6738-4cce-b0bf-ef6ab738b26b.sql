-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create products table for dynamic product management
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'Uncategorized',
    description TEXT,
    featured BOOLEAN DEFAULT false,
    in_stock BOOLEAN DEFAULT true,
    facebook_post_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable
CREATE POLICY "Products are publicly readable"
ON public.products
FOR SELECT
USING (true);

-- Only admins can insert products
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update products
CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete products
CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);

-- Storage policies for product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'products' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'products' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'products' AND has_role(auth.uid(), 'admin'::app_role));

-- Insert some initial products based on existing data
INSERT INTO public.products (name, price, image_url, category, description, featured) VALUES
('Silver Ring', 3200, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600', 'Rings', 'Elegant silver ring with gemstone detailing', true),
('Gold Necklace', 12500, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', 'Necklaces', 'Stunning gold pendant necklace with teardrop design', true),
('Elegant Earrings', 2800, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600', 'Earrings', 'Handcrafted earrings with intricate gemstone work', true),
('Traditional Bangles', 4500, 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600', 'Bangles', 'Set of handmade gold bangles with traditional design', true),
('Pearl Drop Earrings', 1800, 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600', 'Earrings', 'Delicate pearl drop earrings for everyday elegance', false),
('Rose Gold Ring', 4200, 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600', 'Rings', 'Beautiful rose gold ring with modern design', false),
('Statement Necklace', 8500, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600', 'Necklaces', 'Bold statement piece for special occasions', false),
('Crystal Bangles Set', 3800, 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600', 'Bangles', 'Sparkling crystal bangle set', false);

-- Enable realtime for products
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;