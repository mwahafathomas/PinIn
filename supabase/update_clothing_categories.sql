-- ==============================================================================
-- UPDATE CATEGORIES TO CLOTHING (LADIES & MEN) + SHOE SIZE COLUMN ON LISTINGS
-- Keeps current listings and supplier products/SKUs completely safe and untouched!
-- ==============================================================================

-- 1. Remove old categories from the categories table
DELETE FROM public.categories;

-- 2. Insert updated clothing categories (Ladies and Men)
INSERT INTO public.categories (id, group_id, group_number, group_title, item_name, display_order) VALUES
-- Ladies Categories
('cat_ladies_0', 'ladies', 1, 'ladies', 'just dropped', 0),
('cat_ladies_1', 'ladies', 1, 'ladies', 'Tees, shirts', 1),
('cat_ladies_2', 'ladies', 1, 'ladies', 'Trousers', 2),
('cat_ladies_3', 'ladies', 1, 'ladies', 'Jeans', 3),
('cat_ladies_4', 'ladies', 1, 'ladies', 'Jackets, hoodies', 4),
('cat_ladies_5', 'ladies', 1, 'ladies', 'Dresses', 5),
('cat_ladies_6', 'ladies', 1, 'ladies', 'Skirts', 6),
('cat_ladies_7', 'ladies', 1, 'ladies', 'Accessories', 7),
('cat_ladies_8', 'ladies', 1, 'ladies', 'Shoes', 8),

-- Men Categories
('cat_men_0', 'men', 2, 'men', 'just dropped', 0),
('cat_men_1', 'men', 2, 'men', 'tees, shirts', 1),
('cat_men_2', 'men', 2, 'men', 'Jeans', 2),
('cat_men_3', 'men', 2, 'men', 'Trousers', 3),
('cat_men_4', 'men', 2, 'men', 'Jackets, hoodies, sweaters', 4),
('cat_men_5', 'men', 2, 'men', 'Accessories', 5),
('cat_men_6', 'men', 2, 'men', 'Shoes', 6);

-- 3. Add shoe_size column to listings table (for shoe sizes 3 to 9)
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS shoe_size text;

-- 4. Add image_url column to categories table (for category images)
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS image_url text;
