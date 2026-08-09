# 📊 Order Fields Explained

## ภาพรวม Order Schema

Order ใหม่จะเก็บ **snapshot** ของราคาและโปรโมชั่น ณ เวลาที่ขาย เพื่อให้การคำนวณกำไรแม่นยำและไม่เปลี่ยนแปลงตามราคาสินค้าปัจจุบัน

## ฟิลด์ทั้งหมดใน Order

### 📦 ข้อมูลพื้นฐาน
```typescript
id              String          // UUID ของ Order
productID       String          // อ้างอิงไปยัง Product
quantity        Int             // จำนวนที่สั่งซื้อ
payment_method  PaymentMethod   // CASH | SCAN | THAI_HELP
createdAt       DateTime        // วันเวลาที่สร้าง Order
isDelivery      Boolean         // เป็นการจัดส่งหรือไม่
note            String?         // หมายเหตุเพิ่มเติม
```

### 💰 ราคาขณะขาย (Snapshot)
```typescript
unit_cost       Float?          // ราคาต้นทุนต่อหน่วย ณ เวลาขาย
unit_price      Float?          // ราคาขายต่อหน่วย (เฉลี่ยหลังใช้โปร)
selling_price   Float?          // ราคาขายปกติต่อหน่วย (ก่อนโปร)
totalCost       Float?          // ต้นทุนรวม = unit_cost × quantity
totalAmount     Float           // รายได้รวม (ยอดที่ลูกค้าจ่าย)
```

### 🎁 โปรโมชั่นขณะขาย (Snapshot)
```typescript
has_promotion       Boolean     // มีใช้โปรโมชั่นหรือไม่
promotion_quantity  Int?        // จำนวนที่ต้องซื้อเพื่อได้โปร (เช่น 3)
promotion_price     Float?      // ราคาโปรโมชั่น (เช่น 3 ชิ้น 100 บาท)
```

## ตัวอย่างการคำนวณ

### กรณีที่ 1: ขายปกติ (ไม่มีโปร)

**ข้อมูลสินค้า:**
- ต้นทุน: 50 บาท
- ขายปกติ: 100 บาท
- ไม่มีโปร

**ลูกค้าซื้อ: 5 ชิ้น**

```typescript
{
  quantity: 5,
  
  // ราคา
  unit_cost: 50,           // ต้นทุนต่อชิ้น
  unit_price: 100,         // ขายต่อชิ้น (เท่ากับ selling_price)
  selling_price: 100,      // ราคาปกติ
  totalCost: 250,          // 50 × 5
  totalAmount: 500,        // 100 × 5
  
  // โปร
  has_promotion: false,
  promotion_quantity: null,
  promotion_price: null
}

// กำไร = 500 - 250 = 250 บาท
```

### กรณีที่ 2: ขายโปร (ซื้อ 3 ได้ 100 บาท)

**ข้อมูลสินค้า:**
- ต้นทุน: 50 บาท
- ขายปกติ: 100 บาท/ชิ้น
- โปร: ซื้อ 3 ชิ้น ได้ 100 บาท

**ลูกค้าซื้อ: 6 ชิ้น (พอดี 2 เซ็ต)**

```typescript
{
  quantity: 6,
  
  // ราคา
  unit_cost: 50,           // ต้นทุนต่อชิ้น
  unit_price: 33.33,       // ขายเฉลี่ยต่อชิ้น (200/6)
  selling_price: 100,      // ราคาปกติ
  totalCost: 300,          // 50 × 6
  totalAmount: 200,        // 100 × 2 เซ็ต
  
  // โปร
  has_promotion: true,
  promotion_quantity: 3,
  promotion_price: 100
}

// กำไร = 200 - 300 = -100 บาท (ขาดทุน!)
// ⚠️ ต้นทุนสูงเกินไป หรือโปรแรงเกินไป
```

### กรณีที่ 3: ขายโปรแบบผสม

**ข้อมูลสินค้า:**
- ต้นทุน: 20 บาท
- ขายปกติ: 50 บาท/ชิ้น
- โปร: ซื้อ 3 ชิ้น ได้ 120 บาท

**ลูกค้าซื้อ: 7 ชิ้น (2 เซ็ต + 1 ชิ้นปกติ)**

```typescript
{
  quantity: 7,
  
  // ราคา
  unit_cost: 20,           // ต้นทุนต่อชิ้น
  unit_price: 41.43,       // ขายเฉลี่ยต่อชิ้น (290/7)
  selling_price: 50,       // ราคาปกติ
  totalCost: 140,          // 20 × 7
  totalAmount: 290,        // (120 × 2) + (50 × 1)
  
  // โปร
  has_promotion: true,     // มีใช้โปร (แม้จะไม่ทั้งหมด)
  promotion_quantity: 3,
  promotion_price: 120
}

// กำไร = 290 - 140 = 150 บาท
// Breakdown:
//   - 6 ชิ้นแรก (โปร): กำไร = 240 - 120 = 120 บาท
//   - 1 ชิ้นปกติ: กำไร = 50 - 20 = 30 บาท
```

## คำถามที่พบบ่อย

### Q: ทำไมต้องเก็บทั้ง `unit_price` และ `selling_price`?

**A:** เพื่อแยกแยะว่าลูกค้าจ่ายเท่าไหร่ vs ราคาปกติคืออะไร

- `selling_price` = ราคาปกติ (ไม่เปลี่ยน)
- `unit_price` = ราคาที่ลูกค้าจ่ายจริงเฉลี่ยต่อชิ้น (เปลี่ยนถ้ามีโปร)
- ถ้าไม่มีโปร: `unit_price === selling_price`

### Q: ทำไม `unit_cost`, `unit_price` เป็น Float?

**A:** เพราะ:
- ต้นทุนอาจไม่ใช่เลขกลม (เช่น 33.50 บาท)
- ราคาเฉลี่ยหลังใช้โปรอาจไม่ลงตัว (เช่น 33.33 บาท)

### Q: ทำไมฟิลด์เหล่านี้เป็น Optional (`?`)?

**A:** เพื่อรองรับ Order เก่าที่สร้างก่อนการ migrate
- Order เก่า: ฟิลด์เหล่านี้จะเป็น `null`
- Order ใหม่: จะมีค่าครบทุกฟิลด์

### Q: ถ้า `has_promotion = true` แต่ซื้อไม่ครบเซ็ต?

**A:** `has_promotion = true` หมายถึง "สินค้ามีโปรอยู่ขณะขาย"
- แม้ลูกค้าจะซื้อ 7 ชิ้น (2 เซ็ต + 1 ชิ้นปกติ)
- เราก็ยังเก็บ `has_promotion = true`
- เพราะราคาบางส่วนได้รับผลกระทบจากโปร

## การใช้งาน

### คำนวณกำไรต่อ Order
```typescript
const profit = order.totalAmount - (order.totalCost || 0)
```

### คำนวณส่วนลดจากโปร
```typescript
const discount = order.has_promotion 
  ? (order.selling_price * order.quantity) - order.totalAmount
  : 0
```

### คำนวณอัตรากำไร (%)
```typescript
const profitMargin = order.totalCost > 0
  ? ((order.totalAmount - order.totalCost) / order.totalCost) * 100
  : 0
```

### แสดงข้อมูลโปรโมชั่น
```typescript
const promoText = order.has_promotion
  ? `ซื้อ ${order.promotion_quantity} ชิ้น ฿${order.promotion_price}`
  : 'ไม่มีโปร'
```

## สรุป

✅ **ราคาและโปรโมชั่นจะถูก snapshot ขณะสร้าง Order**
✅ **แก้ไขราคาหรือโปรในอนาคตไม่กระทบกับ Order เก่า**
✅ **สามารถวิเคราะห์ประสิทธิภาพของแต่ละโปรโมชั่นได้**
✅ **การคำนวณกำไรแม่นยำและน่าเชื่อถือ**
