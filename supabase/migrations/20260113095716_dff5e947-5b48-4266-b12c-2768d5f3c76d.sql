-- Add foreign key relationship between wishlist and products
-- Note: This references products.id which is UUID
ALTER TABLE public.wishlist
  ADD CONSTRAINT wishlist_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;