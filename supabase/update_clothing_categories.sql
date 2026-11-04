-- ==============================================================================
-- UPDATE CATEGORIES TO CLOTHING (WOMEN & MEN)
-- Keeps current listings and supplier products/SKUs completely safe and untouched!
-- ==============================================================================

-- 1. Remove only the old furniture categories from the categories table
DELETE FROM public.categories;

-- 2. Insert new clothing categories (Women and Men)
INSERT INTO public.categories (id, group_id, group_number, group_title, item_name, display_order) VALUES
-- Women Categories
('cat_women_1', 'women', 1, 'women', 'Tees, shirts', 1),
('cat_women_2', 'women', 1, 'women', 'Trousers', 2),
('cat_women_3', 'women', 1, 'women', 'Jeans', 3),
('cat_women_4', 'women', 1, 'women', 'Jackets, hoodies', 4),
('cat_women_5', 'women', 1, 'women', 'Dresses', 5),
('cat_women_6', 'women', 1, 'women', 'Skirts', 6),

-- Men Categories
('cat_men_1', 'men', 2, 'men', 'tees, shirts', 1),
('cat_men_2', 'men', 2, 'men', 'Jeans', 2),
('cat_men_3', 'men', 2, 'men', 'Trousers', 3),
('cat_men_4', 'men', 2, 'men', 'Jackets, hoodies', 4);
