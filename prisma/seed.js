const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ลบข้อมูลเก่า (optional)
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()

  console.log('🗑️  Cleared existing data')

  // สร้าง Products
  const product1 = await prisma.product.create({
    data: {
      name: 'Ocean',
      purchase_price: 80,
      selling_price: 150,
      stock_quantity: 100,
      promotion_quantity: 20,
      promotion_price: 120,
    },
  })

  const product2 = await prisma.product.create({
    data: {
      name: 'Plus',
      purchase_price: 120,
      selling_price: 200,
      stock_quantity: 50,
      promotion_quantity: 10,
      promotion_price: 160,
    },
  })

  console.log('✅ Created products:')
  console.log(`   - ${product1.name} (ID: ${product1.id})`)
  console.log(`   - ${product2.name} (ID: ${product2.id})`)

  // สร้าง Orders
  const order1 = await prisma.order.create({
    data: {
      productID: product1.id,
      quantity: 5,
      payment_method: 'CASH',
      isDelivery: false,
      note: 'ลูกค้าใหม่',
    },
  })

  const order2 = await prisma.order.create({
    data: {
      productID: product2.id,
      quantity: 2,
      payment_method: 'SCAN',
      isDelivery: true,
      note: 'จัดส่งตามที่อยู่ที่ให้ไว้',
    },
  })

  const order3 = await prisma.order.create({
    data: {
      productID: product1.id,
      quantity: 10,
      payment_method: 'THAI_HELP',
      isDelivery: false,
      note: null,
    },
  })

  console.log('✅ Created orders:')
  console.log(`   - Order 1: ${order1.quantity} x Ocean (Payment: ${order1.payment_method})`)
  console.log(`   - Order 2: ${order2.quantity} x Plus (Payment: ${order2.payment_method})`)
  console.log(`   - Order 3: ${order3.quantity} x Ocean (Payment: ${order3.payment_method})`)

  console.log('✨ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
