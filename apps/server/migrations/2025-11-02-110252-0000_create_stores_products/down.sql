-- This file should undo anything in `up.sql`

-- Drop indexes first (in reverse order of creation)
DROP INDEX IF EXISTS idx_store_products_product_id;
DROP INDEX IF EXISTS idx_store_products_store_id;

-- Drop junction table (must drop before parent tables due to foreign keys)
DROP TABLE IF EXISTS store_products;

-- Drop products table
DROP TABLE IF EXISTS products;

-- Drop spatial index for stores
DROP INDEX IF EXISTS stores_gix;

-- Drop stores table
DROP TABLE IF EXISTS stores;
