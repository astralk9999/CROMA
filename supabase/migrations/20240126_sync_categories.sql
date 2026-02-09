-- Migration: Sync category UUIDs based on existing text labels
-- Part 1: Ensure existing products have the correct category_id based on the names in categories table
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(p.category) = LOWER(c.name)
AND p.category_id IS NULL;

-- Part 2: Handle products where category name doesn't match exactly (optional check)
-- This might need manual intervention if labels are messy, 
-- but for now we assume labels match category names.

-- Part 3: (Self-Correction) Verify if any categories are missing
-- If labels don't match, you might see NULL category_id in products table.

-- Part 4: Optional cleanup (Caution: and check if layout needs the text field)
-- For now, we KEEP the text field to prevent UI breakage before code updates.
