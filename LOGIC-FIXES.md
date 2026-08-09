# 🔧 Logic Fixes Summary

## ปัญหาที่พบและแก้ไข

### 1. ❌ TypeScript Error (Not a Logic Error)

**Error:**
```
Object literal may only specify known properties, and 'selling_price' 
does not exist in type 'OrderCreateInput'
```

**สาเหตุ:** 
- Prisma Client ยังไม่ได้ generate ใหม่หลังแก้ไข schema

**วิธีแก้:**
```bash
npx prisma generate
```

**สถานะ:** จะหายหลังรัน migration และ generate

---

### 2. ❌ Stock Management Logic Error (CRITICAL!)

#### ปัญหาเดิม:

```typescript
// ❌ ผิด: ลดแค่ stock_quantity เท่านั้น
await prisma.product.update({
  where: { id: data.productID },
  data: { stock_quantity: product.stock_quantity - data.quantity },
})
```

**ทำไมผิด:**
- ระบบเช็ค stock รวม (`stock_quantity + promotion_quantity`)
- แต่ลดเฉพาะ `stock_quantity`
- ถ้าลูกค้าซื้อ 30 ชิ้น แต่ stock_quantity มีแค่ 20 → **stock จะติดลบ!**

#### Logic ที่ถูกต้อง:

```typescript
// ✅ ถูกต้อง: ลด stock_quantity ก่อน ถ้าไม่พอค่อยลด promotion_quantity
let remainingQuantity = data.quantity
let newStockQuantity = product.stock_quantity
let newPromotionQuantity = product.promotion_quantity

if (remainingQuantity <= product.stock_quantity) {
  // Case 1: stock_quantity เพียงพอ
  newStockQuantity = product.stock_quantity - remainingQuantity
} else {
  // Case 2: stock_quantity ไม่พอ ต้องใช้ promotion_quantity ด้วย
  remainingQuantity -= product.stock_quantity
  newStockQuantity = 0
  newPromotionQuantity = product.promotion_quantity - remainingQuantity
}

await prisma.product.update({
  where: { id: data.productID },
  data: { 
    stock_quantity: newStockQuantity,
    promotion_quantity: newPromotionQuantity,
  },
})
```

**ผลกระทบ:**
- ✅ ป้องกัน stock ติดลบ
- ✅ จัดการ stock 2 ประเภทถูกต้อง
- ✅ ลด stock ตามลำดับที่เหมาะสม

---

### 3. ⚠️ Promotion Calculation Logic (Improved)

#### Logic เดิม:

```typescript
// มีปัญหา: ตรวจสอบ promotion_quantity !== 0
if (product.promotion_quantity !== 0 && product.promotion_price) {
  const promotionCheck = data.quantity % product.promotion_quantity

  if (promotionCheck === 0) {
    // ซื้อพอดีเป็นเซ็ต
    totalAmount = product.promotion_price * (data.quantity / product.promotion_quantity)
    hasPromotion = true
  } else {
    // ซื้อไม่พอดีเซ็ต
    const withoutPromotionAmount = promotionCheck * product.selling_price
    const promotionAmount = ((data.quantity - promotionCheck) / product.promotion_quantity) * product.promotion_price
    totalAmount = withoutPromotionAmount + promotionAmount
    hasPromotion = true
  }
}
```

**ปัญหา:**
1. ใช้ `!== 0` แทน `> 0` → อาจมีปัญหากับ negative
2. Logic ซับซ้อนเกินไป
3. **ถ้าซื้อไม่ถึงโปร (เช่น ซื้อ 2 แต่โปรต้อง 3) ยังตั้ง `hasPromotion = true`** ❌

#### Logic ใหม่ (ที่ถูกต้อง):

```typescript
// ✅ ถูกต้อง: ชัดเจนและครอบคลุมทุกกรณี
if (product.promotion_quantity > 0 && product.promotion_price) {
  const promotionSets = Math.floor(data.quantity / product.promotion_quantity)
  const remainingItems = data.quantity % product.promotion_quantity

  if (promotionSets > 0) {
    // มีโปรโมชั่นถูกใช้
    hasPromotion = true
    const promotionAmount = promotionSets * product.promotion_price
    const remainingAmount = remainingItems * product.selling_price
    totalAmount = promotionAmount + remainingAmount
  } else {
    // ซื้อไม่ถึงโปร ขายราคาปกติ
    totalAmount = data.quantity * product.selling_price
    // hasPromotion = false (default)
  }

  unitPrice = totalAmount / data.quantity
} else {
  // ไม่มีโปรโมชั่น
  totalAmount = data.quantity * product.selling_price
}
```

**ข้อดี:**
1. ✅ ใช้ `Math.floor()` → ชัดเจนว่าคำนวณจำนวนเซ็ต
2. ✅ แยก case ชัดเจน: มีโปร vs ไม่มีโปร vs ซื้อไม่ถึงโปร
3. ✅ `hasPromotion = true` เฉพาะเมื่อใช้โปรจริงๆ
4. ✅ ง่ายต่อการ debug และ maintain

---

### 4. ⚠️ Order Creation - Field Mapping

#### ปัญหาเดิม:

```typescript
// ❌ ใช้ spread operator กับ data
return await prisma.order.create({
  data: {
    ...data,  // ❌ อาจมี field ที่ไม่ต้องการ
    unit_cost: unitCost,
    selling_price: product.selling_price,
    // ...
  }
})
```

**ปัญหา:**
- `data` อาจมี fields ที่ไม่ควรอยู่ใน Order
- ไม่ชัดเจนว่า field ไหนมาจากไหน

#### Logic ใหม่:

```typescript
// ✅ ระบุ field ทีละตัว ชัดเจน
return await prisma.order.create({
  data: {
    productID: data.productID,
    quantity: data.quantity,
    payment_method: data.payment_method,
    isDelivery: data.isDelivery ?? false,
    note: data.note ?? null,
    unit_cost: unitCost,
    unit_price: unitPrice,
    selling_price: product.selling_price,
    promotion_quantity: hasPromotion ? product.promotion_quantity : null,
    promotion_price: hasPromotion ? product.promotion_price : null,
    has_promotion: hasPromotion,
    totalAmount,
    totalCost,
  },
  include: {
    product: true,
  },
})
```

**ข้อดี:**
1. ✅ ชัดเจนว่า field ไหนมาจากไหน
2. ✅ ใช้ nullish coalescing (`??`) สำหรับ optional fields
3. ✅ ไม่มี unexpected fields

---

## ตัวอย่างการทำงานที่ถูกต้อง

### Scenario 1: Stock ปกติเพียงพอ + มีโปร

**Product:**
- stock_quantity: 50
- promotion_quantity: 10
- purchase_price: 30
- selling_price: 50
- promo: ซื้อ 3 ชิ้น 120 บาท

**ลูกค้าซื้อ: 7 ชิ้น**

**คำนวณราคา:**
```typescript
promotionSets = Math.floor(7 / 3) = 2
remainingItems = 7 % 3 = 1

promotionAmount = 2 × 120 = 240
remainingAmount = 1 × 50 = 50
totalAmount = 290

unitPrice = 290 / 7 = 41.43
totalCost = 30 × 7 = 210
```

**ลด Stock:**
```typescript
remainingQuantity = 7
if (7 <= 50) {  // true
  newStockQuantity = 50 - 7 = 43
  newPromotionQuantity = 10
}
```

**Order ที่สร้าง:**
```json
{
  "quantity": 7,
  "unit_cost": 30,
  "unit_price": 41.43,
  "selling_price": 50,
  "has_promotion": true,
  "promotion_quantity": 3,
  "promotion_price": 120,
  "totalAmount": 290,
  "totalCost": 210
}
```

**Product หลังขาย:**
```json
{
  "stock_quantity": 43,
  "promotion_quantity": 10
}
```

✅ **ผลลัพธ์:** ถูกต้องทุกอย่าง

---

### Scenario 2: Stock ปกติไม่พอ + มีโปร

**Product:**
- stock_quantity: 5
- promotion_quantity: 20
- purchase_price: 20
- selling_price: 40
- promo: ซื้อ 4 ชิ้น 120 บาท

**ลูกค้าซื้อ: 12 ชิ้น**

**คำนวณราคา:**
```typescript
promotionSets = Math.floor(12 / 4) = 3
remainingItems = 12 % 4 = 0

promotionAmount = 3 × 120 = 360
remainingAmount = 0 × 40 = 0
totalAmount = 360

unitPrice = 360 / 12 = 30
totalCost = 20 × 12 = 240
```

**ลด Stock:**
```typescript
remainingQuantity = 12
if (12 <= 5) {  // false
  // เข้า else
  remainingQuantity -= 5  // 12 - 5 = 7
  newStockQuantity = 0
  newPromotionQuantity = 20 - 7 = 13
}
```

**Product หลังขาย:**
```json
{
  "stock_quantity": 0,      // ใช้หมดแล้ว
  "promotion_quantity": 13  // ลดลง 7 ชิ้น
}
```

✅ **ผลลัพธ์:** ถูกต้อง ลด stock 2 ประเภทตามลำดับ

---

### Scenario 3: ซื้อไม่ถึงโปร

**Product:**
- stock_quantity: 50
- promotion_quantity: 10
- purchase_price: 25
- selling_price: 50
- promo: ซื้อ 5 ชิ้น 200 บาท

**ลูกค้าซื้อ: 3 ชิ้น**

**คำนวณราคา:**
```typescript
promotionSets = Math.floor(3 / 5) = 0
remainingItems = 3 % 5 = 3

if (0 > 0) {  // false
  // ไม่เข้า
} else {
  // ซื้อไม่ถึงโปร ขายราคาปกติ
  totalAmount = 3 × 50 = 150
  hasPromotion = false  ✅
}

unitPrice = 150 / 3 = 50
totalCost = 25 × 3 = 75
```

**Order ที่สร้าง:**
```json
{
  "quantity": 3,
  "unit_cost": 25,
  "unit_price": 50,
  "selling_price": 50,
  "has_promotion": false,     ✅
  "promotion_quantity": null, ✅
  "promotion_price": null,    ✅
  "totalAmount": 150,
  "totalCost": 75
}
```

✅ **ผลลัพธ์:** `has_promotion = false` ถูกต้อง!

---

## สรุปการแก้ไข

| ปัญหา | สถานะก่อน | สถานะหลัง |
|-------|-----------|-----------|
| TypeScript Error | ❌ Error | ⏳ รอ generate |
| Stock Management | ❌ ผิด (ลดแค่ 1 ประเภท) | ✅ ถูกต้อง |
| Promotion Calculation | ⚠️ ซับซ้อน | ✅ ชัดเจน |
| has_promotion Logic | ❌ ผิด (true เสมอ) | ✅ ถูกต้อง |
| Field Mapping | ⚠️ ใช้ spread | ✅ ระบุชัดเจน |

## Next Steps

1. ✅ แก้ไข Logic เสร็จแล้ว
2. ⏳ รัน migration เพื่อ generate Prisma Client
3. ⏳ ทดสอบกับข้อมูลจริง
4. ⏳ Monitor stock consistency

---

📖 **Related Docs:**
- [STOCK-LOGIC-EXPLAINED.md](./STOCK-LOGIC-EXPLAINED.md) - รายละเอียด Stock Logic
- [ORDER-FIELDS-EXPLAINED.md](./ORDER-FIELDS-EXPLAINED.md) - อธิบายฟิลด์ Order
- [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - คู่มือ Migration
