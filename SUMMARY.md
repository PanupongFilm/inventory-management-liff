# ✅ สรุปการแก้ไข Order System

## ปัญหาเดิม

Order เก็บแค่ `totalAmount` (รายได้) ทำให้:
- ❌ คำนวณกำไรผิดถ้าแก้ไขราคาสินค้า
- ❌ ไม่รู้ว่า Order เก่าใช้โปรโมชั่นอะไร
- ❌ ไม่สามารถวิเคราะห์ประสิทธิภาพโปรโมชั่น

## การแก้ไข

### 1. Schema Changes (Order model)

**เพิ่ม Price Snapshot:**
```prisma
unit_cost       Float?   // ต้นทุนต่อหน่วย ณ เวลาขาย
unit_price      Float?   // ขายต่อหน่วย (เฉลี่ยหลังโปร)
selling_price   Float?   // ขายปกติ (ก่อนโปร)
totalCost       Float?   // ต้นทุนรวม
```

**เพิ่ม Promotion Snapshot:**
```prisma
has_promotion       Boolean  // มีใช้โปรหรือไม่
promotion_quantity  Int?     // เช่น ซื้อ 3
promotion_price     Float?   // เช่น 100 บาท
```

### 2. Service Changes

**Order Service (`createOrder`):**
- เก็บ snapshot ของ `unit_cost`, `unit_price`, `selling_price`
- เก็บ snapshot ของ `promotion_quantity`, `promotion_price`
- ตั้ง `has_promotion = true` ถ้ามีโปร
- คำนวณ `totalCost = unit_cost × quantity`

**Analytics Service:**
- ใช้ `order.totalCost` แทน `product.purchase_price × quantity`
- Fallback ไปใช้ราคาปัจจุบันถ้า Order เก่าไม่มี `totalCost`

### 3. Migration Tools

**Files:**
- `scripts/backfill-order-cost.ts` - TypeScript script
- `prisma/migrations/backfill-order-cost.sql` - SQL script
- `MIGRATION-GUIDE.md` - คู่มือละเอียด
- `QUICK-MIGRATE.md` - คู่มือสั้น
- `ORDER-FIELDS-EXPLAINED.md` - อธิบายฟิลด์

**Commands:**
```bash
npm install                          # 1. ติดตั้ง tsx
npm run prisma:migrate               # 2. สร้างคอลัมน์
npm run migrate:backfill-cost        # 3. Back-fill Order เก่า
```

## ผลลัพธ์

### ✅ Order ใหม่ (ตั้งแต่วันนี้)
- เก็บราคาและโปรขณะขาย → **กำไรถูกต้อง 100%**
- แก้ไขราคาในอนาคต → **ไม่กระทบ Order เก่า**
- วิเคราะห์โปรโมชั่นได้

### ⚠️ Order เก่า (7 วัน)
- Back-fill โดยใช้ราคา**ปัจจุบัน**
- อาจไม่แม่นยำ 100% ถ้าเคยแก้ไขราคา
- แต่ดีกว่าไม่มีเลย

## ประโยชน์ที่ได้

### 1. กำไรแม่นยำ
```typescript
// คำนวณกำไรต่อ Order
const profit = order.totalAmount - order.totalCost
```

### 2. วิเคราะห์โปรโมชั่น
```sql
-- โปรไหนทำกำไรได้มากที่สุด
SELECT 
  CONCAT(promotion_quantity, ' ชิ้น ฿', promotion_price) as promo,
  SUM("totalAmount" - "totalCost") as profit
FROM "Order"
WHERE has_promotion = TRUE
GROUP BY promotion_quantity, promotion_price
ORDER BY profit DESC;
```

### 3. เปรียบเทียบกำไร
```sql
-- ขายปกติ vs ขายโปร
SELECT 
  has_promotion,
  AVG("totalAmount" - "totalCost") as avg_profit
FROM "Order"
GROUP BY has_promotion;
```

### 4. Audit Trail
- ดูย้อนหลังได้ว่า Order นี้ขายด้วยราคาเท่าไหร่
- ดูได้ว่าใช้โปรโมชั่นอะไร
- ตรวจสอบประวัติการขายได้แม่นยำ

## ตัวอย่างข้อมูลใน Order

### ขายปกติ (ไม่มีโปร)
```json
{
  "quantity": 5,
  "unit_cost": 50,
  "unit_price": 100,
  "selling_price": 100,
  "has_promotion": false,
  "promotion_quantity": null,
  "promotion_price": null,
  "totalCost": 250,
  "totalAmount": 500
}
// กำไร = 500 - 250 = 250 บาท
```

### ขายโปร (ซื้อ 3 ได้ 120)
```json
{
  "quantity": 6,
  "unit_cost": 20,
  "unit_price": 40,      // 240/6
  "selling_price": 50,
  "has_promotion": true,
  "promotion_quantity": 3,
  "promotion_price": 120,
  "totalCost": 120,      // 20 × 6
  "totalAmount": 240     // 120 × 2
}
// กำไร = 240 - 120 = 120 บาท
```

## Next Steps

1. รัน migration
2. Back-fill Order เก่า
3. ตรวจสอบผลด้วย Prisma Studio
4. เริ่มสร้าง Order ใหม่ → ข้อมูลจะถูกต้อง 100%

## ไฟล์ที่เกี่ยวข้อง

```
prisma/
  schema.prisma                        # ✏️ แก้ไข Order model
  migrations/
    backfill-order-cost.sql           # 📄 SQL script

app/api/
  order/service.ts                    # ✏️ แก้ไข createOrder
  analytic/service.ts                 # ✏️ แก้ไข cost calculation

scripts/
  backfill-order-cost.ts              # 🔧 Migration script

docs/
  MIGRATION-GUIDE.md                  # 📖 คู่มือละเอียด
  QUICK-MIGRATE.md                    # ⚡ คู่มือสั้น
  ORDER-FIELDS-EXPLAINED.md           # 📚 อธิบายฟิลด์
  SUMMARY.md                          # 📋 ไฟล์นี้
```

---

✨ **ระบบพร้อมใช้งาน! กำไรแม่นยำ วิเคราะห์โปรโมชั่นได้**
