# 📦 Stock Management Logic

## ภาพรวมระบบ Stock

Product มี stock 2 ประเภท:
1. **`stock_quantity`** - สต็อกปกติ
2. **`promotion_quantity`** - สต็อกโปรโมชั่น

## Logic การตรวจสอบ Stock

### เช็ค Stock รวม
```typescript
const totalStock = product.stock_quantity + product.promotion_quantity
if (data.quantity > totalStock) {
  throw new Error('Insufficient stock')
}
```

✅ **ถูกต้อง**: เช็ครวม stock ทั้ง 2 ประเภท

## Logic การลด Stock (createOrder)

### กลยุทธ์: ลดจาก stock_quantity ก่อน

```typescript
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
```

## ตัวอย่างการทำงาน

### Case 1: Stock ปกติเพียงพอ

**สถานะเริ่มต้น:**
- stock_quantity: 50
- promotion_quantity: 10
- ลูกค้าซื้อ: 30 ชิ้น

**ผลลัพธ์:**
```typescript
newStockQuantity = 50 - 30 = 20
newPromotionQuantity = 10 (ไม่เปลี่ยน)
```

✅ ลดจาก stock ปกติ, stock โปรยังเหลือเท่าเดิม

### Case 2: Stock ปกติไม่พอ ต้องใช้ Stock โปรด้วย

**สถานะเริ่มต้น:**
- stock_quantity: 20
- promotion_quantity: 30
- ลูกค้าซื้อ: 35 ชิ้น

**การคำนวณ:**
1. ลด stock_quantity ก่อน: 20 ชิ้น → เหลือ 0
2. ยังต้องการอีก: 35 - 20 = 15 ชิ้น
3. ลด promotion_quantity: 30 - 15 = 15

**ผลลัพธ์:**
```typescript
newStockQuantity = 0
newPromotionQuantity = 15
```

✅ ใช้ stock ปกติหมด แล้วใช้ stock โปรต่อ

### Case 3: Stock ไม่พอ

**สถานะเริ่มต้น:**
- stock_quantity: 10
- promotion_quantity: 5
- ลูกค้าซื้อ: 20 ชิ้น

**การตรวจสอบ:**
```typescript
totalStock = 10 + 5 = 15
if (20 > 15) {
  throw new Error('Insufficient stock. Available: 15, Requested: 20')
}
```

❌ ขายไม่ได้ เพราะ stock รวมไม่พอ

## Logic การคืน Stock (deleteOrder)

### กลยุทธ์: คืนไปที่ stock_quantity

เมื่อลบ Order, stock จะถูกคืนไปที่ `stock_quantity`:

```typescript
await prisma.product.update({
  where: { id: order.productID },
  data: { 
    stock_quantity: order.product.stock_quantity + order.quantity 
  },
})
```

### ตัวอย่าง

**ก่อนลบ Order:**
- stock_quantity: 20
- promotion_quantity: 10
- Order ที่จะลบ: 15 ชิ้น

**หลังลบ Order:**
```typescript
newStockQuantity = 20 + 15 = 35
newPromotionQuantity = 10 (ไม่เปลี่ยน)
```

✅ คืน stock กลับมาที่ stock_quantity

## การคำนวณโปรโมชั่น

### Logic การคำนวณราคา

```typescript
if (product.promotion_quantity > 0 && product.promotion_price) {
  const promotionSets = Math.floor(data.quantity / product.promotion_quantity)
  const remainingItems = data.quantity % product.promotion_quantity

  if (promotionSets > 0) {
    hasPromotion = true
    const promotionAmount = promotionSets * product.promotion_price
    const remainingAmount = remainingItems * product.selling_price
    totalAmount = promotionAmount + remainingAmount
  } else {
    totalAmount = data.quantity * product.selling_price
  }
}
```

### ตัวอย่างการคำนวณ

**โปรโมชั่น: ซื้อ 3 ชิ้น ได้ 100 บาท**
**ราคาปกติ: 50 บาท/ชิ้น**

#### Case 1: ซื้อ 6 ชิ้น (พอดี 2 เซ็ต)
```typescript
promotionSets = Math.floor(6 / 3) = 2
remainingItems = 6 % 3 = 0

promotionAmount = 2 × 100 = 200
remainingAmount = 0 × 50 = 0
totalAmount = 200

unitPrice = 200 / 6 = 33.33 บาท/ชิ้น
```

#### Case 2: ซื้อ 7 ชิ้น (2 เซ็ต + 1 ชิ้นปกติ)
```typescript
promotionSets = Math.floor(7 / 3) = 2
remainingItems = 7 % 3 = 1

promotionAmount = 2 × 100 = 200
remainingAmount = 1 × 50 = 50
totalAmount = 250

unitPrice = 250 / 7 = 35.71 บาท/ชิ้น
```

#### Case 3: ซื้อ 2 ชิ้น (ไม่ถึงโปร)
```typescript
promotionSets = Math.floor(2 / 3) = 0
remainingItems = 2 % 3 = 2

// ไม่มีโปร (promotionSets = 0)
totalAmount = 2 × 50 = 100
hasPromotion = false

unitPrice = 100 / 2 = 50 บาท/ชิ้น
```

## สรุป Logic

### การลด Stock:
1. ✅ เช็ค total stock ก่อน (stock_quantity + promotion_quantity)
2. ✅ ลดจาก stock_quantity ก่อนเสมอ
3. ✅ ถ้าไม่พอ ค่อยลด promotion_quantity
4. ✅ ป้องกันไม่ให้ stock ติดลบ

### การคำนวณโปร:
1. ✅ คำนวณจำนวนเซ็ตโปร: `Math.floor(quantity / promo_qty)`
2. ✅ คำนวณสินค้าเหลือ: `quantity % promo_qty`
3. ✅ ราคา = (เซ็ตโปร × ราคาโปร) + (เหลือ × ราคาปกติ)
4. ✅ ถ้าซื้อไม่ถึงโปร → ขายราคาปกติทั้งหมด

### การคืน Stock:
1. ✅ คืนกลับไปที่ stock_quantity
2. ✅ promotion_quantity ไม่เปลี่ยนแปลง

## ข้อควรระวัง

⚠️ **Race Condition**: 
- ถ้ามีคนสั่งซื้อพร้อมกัน อาจเกิด stock ติดลบ
- ควรใช้ Transaction หรือ Lock

⚠️ **การคืน Stock**:
- ปัจจุบันคืนไปที่ stock_quantity เท่านั้น
- ไม่ได้ track ว่าเดิมลดมาจาก stock ไหน
- อาจต้องเก็บข้อมูล stock source ถ้าต้องการ precision สูง

⚠️ **Promotion Quantity**:
- `promotion_quantity` ใน Product = จำนวนต่อเซ็ตโปร (เช่น 3)
- `promotion_quantity` ใน Order = snapshot ของโปร ณ เวลาขาย
- อย่าสับสน!
