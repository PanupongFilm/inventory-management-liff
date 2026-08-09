# คู่มือ Migration: เพิ่ม Cost และ Promotion Snapshot ให้ Order

## ปัญหาที่แก้ไข

เดิม Order เก็บเฉพาะ `totalAmount` (รายได้) แต่ไม่เก็บ:
- ❌ ราคาต้นทุนขณะขาย
- ❌ ราคาขายปกติขณะขาย
- ❌ โปรโมชั่นที่ใช้ขณะขาย

ทำให้:
- ถ้าแก้ไขราคาต้นทุนสินค้า → การคำนวณกำไรของ Order เก่าจะผิดพลาด
- ถ้าแก้ไขหรือยกเลิกโปรโมชั่น → ไม่รู้ว่า Order เก่าใช้โปรอะไร
- ไม่สามารถวิเคราะห์ประสิทธิภาพของแต่ละโปรโมชั่นได้

## การแก้ไข

เพิ่มฟิลด์ใหม่ใน Order:
- `unit_cost` - ราคาต้นทุนต่อหน่วยขณะขาย
- `unit_price` - ราคาขายต่อหน่วยขณะขาย (เฉลี่ยหลังใช้โปร)
- `selling_price` - ราคาขายปกติขณะขาย (ก่อนโปร)
- `promotion_quantity` - จำนวนที่ต้องซื้อเพื่อได้โปร (เช่น 3)
- `promotion_price` - ราคาโปรโมชั่น (เช่น 3 ชิ้น 100 บาท)
- `has_promotion` - มีใช้โปรหรือไม่
- `totalCost` - ต้นทุนรวม

## ขั้นตอนการ Migrate

### 1. รัน Migration (เพิ่มคอลัมน์ใหม่)

```bash
npx prisma migrate dev --name add_cost_and_promotion_snapshot_to_order
```

### 2. Back-fill ข้อมูล Order เก่า

```bash
npx tsx scripts/backfill-order-cost.ts
```

หรือใช้ SQL โดยตรง:

```bash
# ดูข้อมูลก่อน
npx prisma db execute --file prisma/migrations/backfill-order-cost.sql --preview

# รันจริง
npx prisma db execute --file prisma/migrations/backfill-order-cost.sql
```

### 3. ตรวจสอบผลลัพธ์

```bash
npx prisma studio
```

เปิดตาราง Order แล้วดูว่าฟิลด์ `unit_cost`, `unit_price`, `selling_price`, `promotion_*`, `totalCost` มีค่าครบหรือไม่

## ข้อควรระวัง

⚠️ **สำหรับ Order เก่า (7 วันที่ผ่านมา):**
- จะใช้ราคาต้นทุน**ปัจจุบัน**ของ Product มาคำนวณย้อนหลัง
- จะใช้โปรโมชั่น**ปัจจุบัน**ของ Product มากำหนดว่ามีโปรหรือไม่
- ถ้าคุณเคยแก้ไขราคาหรือโปรโมชั่นในช่วง 7 วันที่ผ่านมา → ข้อมูลอาจไม่ตรงกับความเป็นจริง 100%
- **แต่ไม่มีทางเลือกอื่น** เพราะเราไม่ได้เก็บข้อมูลเดิมไว้

✅ **สำหรับ Order ใหม่ (ตั้งแต่วันนี้):**
- จะเก็บ snapshot ของราคาและโปรโมชั่นขณะขายไว้
- ตัวเลขกำไรจะถูกต้อง 100% ตลอดไป
- สามารถวิเคราะห์ประสิทธิภาพของแต่ละโปรโมชั่นได้

## ตรวจสอบความถูกต้อง

### ตรวจสอบ Order ที่มี totalCost แล้ว

```sql
SELECT 
  COUNT(*) as total_orders,
  SUM(CASE WHEN "totalCost" IS NOT NULL THEN 1 ELSE 0 END) as with_cost,
  SUM(CASE WHEN "totalCost" IS NULL THEN 1 ELSE 0 END) as without_cost
FROM "Order";
```

### ตรวจสอบกำไรและโปรโมชั่นของ Order ล่าสุด

```sql
SELECT 
  o.id,
  o."createdAt",
  p.name as product_name,
  o.quantity,
  o.unit_cost,
  o.unit_price,
  o.selling_price,
  o.has_promotion,
  CASE 
    WHEN o.has_promotion THEN 
      CONCAT(o.promotion_quantity, ' ชิ้น ฿', o.promotion_price)
    ELSE 'ไม่มีโปร'
  END as promotion_info,
  o."totalCost",
  o."totalAmount",
  (o."totalAmount" - o."totalCost") as profit
FROM "Order" o
JOIN "Product" p ON o."productID" = p.id
ORDER BY o."createdAt" DESC
LIMIT 10;
```

## หลังจาก Migrate

- Order ใหม่จะเก็บราคาต้นทุน, ราคาขาย, และโปรโมชั่นขณะทำ Order อัตโนมัติ
- แม้คุณจะแก้ไขราคาสินค้าหรือโปรโมชั่นในอนาคต กำไรของ Order เก่าก็จะไม่เปลี่ยนแปลง
- สามารถวิเคราะห์ว่าโปรโมชั่นไหนมีประสิทธิภาพดีที่สุด
- รายงานกำไรจะแม่นยำกว่าเดิมมาก

## ประโยชน์ที่ได้

### 1. วิเคราะห์โปรโมชั่น
```sql
-- ดูว่าโปรไหนขายดีที่สุด
SELECT 
  CONCAT(promotion_quantity, ' ชิ้น ฿', promotion_price) as promotion,
  COUNT(*) as order_count,
  SUM(quantity) as total_quantity,
  SUM("totalAmount") as total_revenue,
  SUM("totalAmount" - "totalCost") as total_profit
FROM "Order"
WHERE has_promotion = TRUE
GROUP BY promotion_quantity, promotion_price
ORDER BY total_profit DESC;
```

### 2. เปรียบเทียบกำไรระหว่างขายปกติกับขายโปร
```sql
SELECT 
  has_promotion,
  COUNT(*) as order_count,
  AVG("totalAmount" - "totalCost") as avg_profit_per_order,
  SUM("totalAmount" - "totalCost") as total_profit
FROM "Order"
GROUP BY has_promotion;
```

## Rollback (ถ้าจำเป็น)

```bash
npx prisma migrate reset
# จากนั้นรัน migrate ใหม่
npx prisma migrate deploy
```

⚠️ **ข้อควรระวัง**: `migrate reset` จะลบข้อมูลทั้งหมด! ใช้เฉพาะ development เท่านั้น
