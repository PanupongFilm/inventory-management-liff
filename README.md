# 📦 Inventory Management LIFF

ระบบจัดการสต็อกสินค้าและออร์เดอร์แบบ Real-time ที่ทำงานบน LINE Platform

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.20-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat-square&logo=postgresql)

---

## 🎯 ภาพรวมโปรเจค

ระบบนี้พัฒนาขึ้นเพื่อช่วยธุรกิจขนาดเล็กในการจัดการสต็อกสินค้าและออร์เดอร์ผ่าน LINE Application โดยใช้เทคโนโลジี LIFF (LINE Front-end Framework) ทำให้ผู้ใช้สามารถเข้าถึงระบบได้ง่ายผ่าน LINE แอปที่คุ้นเคย

### ✨ ฟีเจอร์หลัก

- 📊 **Dashboard Analytics** - ภาพรวมยอดขายแบบ Real-time พร้อม KPI และกราฟ
- 🛒 **Order Management** - สร้าง ดู และจัดการออร์เดอร์
- 📦 **Product Management** - จัดการสินค้า สต็อก และราคา
- 💰 **Promotion System** - ตั้งราคาพิเศษแบบ "3 แพ็ค 100 บาท"
- 📱 **Mobile-First Design** - Responsive UI/UX สำหรับ mobile
- 🔐 **LINE Integration** - Login ผ่าน LINE พร้อม profile

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.2** - React Framework with Turbopack
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library
- **@line/liff** - LINE integration

### Backend
- **Next.js API Routes** - RESTful API
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Production database
- **Zod** - Schema validation

### DevOps
- **Vercel** - Deployment platform
- **Docker** - Local development (PostgreSQL)

---

## 📋 Prerequisites

- Node.js 20+
- npm หรือ yarn
- PostgreSQL (local หรือ cloud)
- LINE Developers Account

---

## 🚀 การติดตั้งและรันโปรเจค

### 1. Clone Repository

```bash
git clone https://github.com/your-username/inventory-management-liff.git
cd inventory-management-liff
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` และกรอกข้อมูล:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/inventory"
DIRECT_URL="postgresql://user:password@localhost:5432/inventory"

# LINE LIFF
NEXT_PUBLIC_LIFF_ID="your-liff-id"
```

### 4. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed ข้อมูลตัวอย่าง (optional)
npm run db:seed
```

### 5. รันโปรเจค

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

เปิดเว็บที่: `http://localhost:3000`

---

## 📁 โครงสร้างโปรเจค

```
inventory-management-liff/
├── app/
│   ├── api/              # API Routes
│   │   ├── analytic/     # Analytics endpoint
│   │   ├── order/        # Order CRUD
│   │   └── product/      # Product CRUD
│   ├── components/       # Reusable components
│   │   └── ui/           # UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── order/            # Order pages
│   ├── product/          # Product pages
│   └── providers/        # Context providers
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration files
│   └── seed.js           # Seed data
└── public/               # Static assets
```

---

## 🗄️ Database Schema

### Product
- `id` - UUID (Primary Key)
- `name` - ชื่อสินค้า (Unique)
- `purchase_price` - ราคาต้นทุน
- `selling_price` - ราคาขาย
- `stock_quantity` - จำนวนคงเหลือ
- `promotion_quantity` - จำนวนแพ็คพิเศษ
- `promotion_price` - ราคาพิเศษ

### Order
- `id` - UUID (Primary Key)
- `productID` - Foreign Key → Product
- `quantity` - จำนวนที่สั่ง
- `payment_method` - CASH | SCAN | THAI_HELP
- `totalAmount` - ราคารวม
- `isDelivery` - ต้องการจัดส่งหรือไม่
- `note` - หมายเหตุ
- `createdAt` - วันที่สร้าง

---

## 🎨 Features Highlight

### 1. Dynamic Pricing System
ระบบคำนวณราคาอัตโนมัติ:
- ราคาปกติ: 35 บาท/แพ็ค
- ราคาพิเศษ: 3 แพ็ค 100 บาท
- คำนวณผสม: 4 แพ็ค = 100 + 35 = 135 บาท

### 2. Real-time Analytics
- Total Revenue & Profit
- Payment Method Breakdown
- Product Sales Ranking
- Stock Status Monitor

### 3. Responsive Design
- Mobile-first approach
- Touch-friendly UI
- Adaptive layouts (sm/md/lg)

---

## 📱 LINE LIFF Integration

### ตั้งค่า LIFF App

1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง Provider และ Channel ใหม่
3. เปิดใช้งาน LIFF
4. ตั้งค่า Endpoint URL: `https://your-domain.vercel.app`
5. คัดลอก LIFF ID มาใส่ใน `.env`

### การใช้งาน

```typescript
import { useLiffUser } from '@/app/hooks/use-liff-user'

function MyComponent() {
  const { isLoggedIn, displayName, pictureUrl } = useLiffUser()
  
  if (isLoggedIn) {
    return <p>สวัสดี {displayName}</p>
  }
}
```

---

## 🚢 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables on Vercel

ตั้งค่าใน Vercel Dashboard:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_LIFF_ID`

---

## 📊 API Endpoints

### Products
- `GET /api/product` - List all products
- `POST /api/product` - Create product
- `PATCH /api/product?id={id}` - Update product
- `DELETE /api/product?id={id}` - Delete product

### Orders
- `GET /api/order` - List all orders
- `POST /api/order` - Create order
- `DELETE /api/order?id={id}` - Delete order

### Analytics
- `GET /api/analytic?startDate={date}&endDate={date}` - Get sales analytics

---

## 🎓 สิ่งที่ได้เรียนรู้

### Technical Skills
- Next.js App Router และ Server Components
- TypeScript Type Safety
- Prisma ORM และ PostgreSQL
- RESTful API Design
- LINE LIFF SDK Integration

### Soft Skills
- การวิเคราะห์ requirement ของธุรกิจจริง
- UX Design สำหรับ mobile users
- Database schema design
- API error handling

---

## 🐛 Known Issues & Future Improvements

### To-Do
- [ ] เพิ่ม authentication และ authorization
- [ ] Export รายงานเป็น PDF/Excel
- [ ] Notification ผ่าน LINE Messaging API
- [ ] Multi-language support (EN/TH)
- [ ] Dark mode

---

## 👨‍💻 ผู้พัฒนา

**ชื่อ:** [ชื่อของคุณ]  
**Email:** your.email@example.com  
**GitHub:** [@yourusername](https://github.com/yourusername)  
**LinkedIn:** [Your Name](https://linkedin.com/in/yourprofile)

---

## 📄 License

MIT License - ดูรายละเอียดใน [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [LINE Developers](https://developers.line.biz/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

<div align="center">

**⭐ ถ้าชอบโปรเจคนี้ อย่าลืมกด Star นะครับ! ⭐**

Made with ❤️ and ☕

</div>
