-- Backfill script สำหรับ Order เก่าที่ไม่มี cost และ promotion snapshot
-- ใช้ราคาและโปรโมชั่นปัจจุบันของ Product มาคำนวณย้อนหลัง

-- อัพเดท unit_cost, unit_price, selling_price, promotion fields, totalCost สำหรับ Order เก่า
UPDATE "Order" o
SET 
  unit_cost = p.purchase_price,
  unit_price = o."totalAmount" / o.quantity,
  selling_price = p.selling_price,
  promotion_quantity = CASE 
    WHEN p.promotion_quantity > 0 AND p.promotion_price IS NOT NULL 
    THEN p.promotion_quantity 
    ELSE NULL 
  END,
  promotion_price = CASE 
    WHEN p.promotion_quantity > 0 AND p.promotion_price IS NOT NULL 
    THEN p.promotion_price 
    ELSE NULL 
  END,
  has_promotion = CASE 
    WHEN p.promotion_quantity > 0 AND p.promotion_price IS NOT NULL 
    THEN TRUE 
    ELSE FALSE 
  END,
  "totalCost" = p.purchase_price * o.quantity
FROM "Product" p
WHERE o."productID" = p.id
  AND o.unit_cost IS NULL;

-- ตรวจสอบผลลัพธ์
-- SELECT 
--   o.id,
--   o."createdAt",
--   o.quantity,
--   o."totalAmount",
--   o.unit_cost,
--   o.unit_price,
--   o.selling_price,
--   o.promotion_quantity,
--   o.promotion_price,
--   o.has_promotion,
--   o."totalCost",
--   (o."totalAmount" - o."totalCost") as profit,
--   p.name as product_name
-- FROM "Order" o
-- JOIN "Product" p ON o."productID" = p.id
-- ORDER BY o."createdAt" DESC
-- LIMIT 10;
