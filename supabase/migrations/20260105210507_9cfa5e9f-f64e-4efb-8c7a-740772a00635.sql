-- Add images array column to products table for multiple product images
ALTER TABLE public.products 
ADD COLUMN images text[] DEFAULT '{}'::text[];

-- Migrate existing image_url to images array if it exists
UPDATE public.products 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_url != '' AND (images IS NULL OR images = '{}');