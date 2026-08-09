# 🚀 Quick Migration Guide

## สิ่งที่แก้ไข
- ✅ เพิ่มฟิลด์ `unit_cost`, `unit_price`, `selling_price`, `totalCost` ใน Order
- ✅ เพิ่มฟิลด์ `promotion_quantity`, `promotion_price`, `has_promotion` ใน Order
- ✅ Order ใหม่จะเก็บ snapshot ของราคาและโปรโมชั่นขณะขายอัตโนมัติ
- ✅ กำไรจะคำนวณจากราคาขณะขาย ไม่ใช่ราคาปัจจุบัน
- ✅ สามารถวิเคราะห์ว่าโปรโมชั่นไหนขายดีที่สุด

## ทำตามนี้ (3 ขั้นตอน)

### 1️⃣ ติดตั้ง dependencies
```bash
npm install
```

### 2️⃣ รัน migration (เพิ่มคอลัมน์)
```bash
npm run prisma:migrate
# ตั้งชื่อ: add_cost_and_promotion_snapshot_to_order
```

### 3️⃣ Back-fill ข้อมูล Order เก่า
```bash
npm run migrate:backfill-cost
```

## เสร็จแล้ว! 🎉

ตอนนี้:
- Order เก่าจะมีข้อมูล cost และ promotion (ใช้ราคาปัจจุบันคำนวณย้อนหลัง)
- Order ใหม่จะเก็บราคาและโปรโมชั่นขณะขายอัตโนมัติ
- แก้ไขราคาหรือโปรโมชั่นเมื่อไหร่ก็ได้ กำไรของ Order เก่าจะไม่เปลี่ยน
- วิเคราะห์ได้ว่าโปรโมชั่นไหนทำกำไรได้มากที่สุด

## ตรวจสอบผล
```bash
npm run prisma:studio
```

เปิดตาราง Order ดูว่ามีค่า:
- `totalCost` ✓
- `has_promotion` ✓
- `promotion_quantity` และ `promotion_price` (ถ้ามีโปร) ✓

---

📖 ดูรายละเอียดเพิ่มเติมที่ [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)
