/**
 * Script สำหรับ back-fill ข้อมูล cost snapshot ให้กับ Order เก่า
 * 
 * วิธีใช้:
 * npx tsx scripts/backfill-order-cost.ts
 * 
 * หมายเหตุ:
 * - Order เก่าจะใช้ราคาและโปรโมชั่นปัจจุบันของ Product มาคำนวณ (เป็นการประมาณ)
 * - Order ใหม่จะมีข้อมูลที่ถูกต้อง 100%
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfillOrderCost() {
  console.log('🔍 กำลังค้นหา Order ที่ยังไม่มีข้อมูล cost snapshot...')

  const ordersWithoutCost = await prisma.order.findMany({
    where: {
      totalCost: null,
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  console.log(`📊 พบ Order ที่ต้อง back-fill: ${ordersWithoutCost.length} รายการ`)

  if (ordersWithoutCost.length === 0) {
    console.log('✅ ไม่มี Order ที่ต้อง back-fill')
    return
  }

  console.log('\n⚠️  หมายเหตุสำคัญ:')
  console.log('   - Order เก่าจะใช้ราคาและโปรโมชั่นปัจจุบันของ Product มาคำนวณ')
  console.log('   - ถ้าคุณเคยแก้ไขราคาหรือโปรโมชั่น ตัวเลขอาจไม่ตรงกับความเป็นจริง 100%')
  console.log('   - Order ใหม่ตั้งแต่วันนี้จะมีข้อมูลที่ถูกต้อง\n')

  let updated = 0
  let errors = 0

  for (const order of ordersWithoutCost) {
    try {
      const product = order.product
      let totalAmount = order.totalAmount // ใช้ totalAmount เดิม
      let unitPrice = totalAmount / order.quantity
      let hasPromotion = false

      // คำนวณใหม่ว่าควรมีโปรหรือไม่ (ตามโปรปัจจุบัน)
      if (product.promotion_quantity !== 0 && product.promotion_price) {
        const promotionCheck = order.quantity % product.promotion_quantity
        
        if (promotionCheck === 0 || promotionCheck > 0) {
          hasPromotion = true
        }
      }

      const unitCost = product.purchase_price
      const totalCost = unitCost * order.quantity

      await prisma.order.update({
        where: { id: order.id },
        data: {
          unit_cost: unitCost,
          unit_price: unitPrice,
          selling_price: product.selling_price,
          promotion_quantity: hasPromotion ? product.promotion_quantity : null,
          promotion_price: hasPromotion ? product.promotion_price : null,
          has_promotion: hasPromotion,
          totalCost: totalCost,
        },
      })

      updated++

      if (updated % 100 === 0) {
        console.log(`   อัพเดทแล้ว: ${updated}/${ordersWithoutCost.length}`)
      }
    } catch (error) {
      console.error(`❌ Error updating order ${order.id}:`, error)
      errors++
    }
  }

  console.log('\n✅ Back-fill เสร็จสิ้น!')
  console.log(`   - สำเร็จ: ${updated} รายการ`)
  if (errors > 0) {
    console.log(`   - ล้มเหลว: ${errors} รายการ`)
  }

  // แสดงตัวอย่างข้อมูลที่อัพเดท
  console.log('\n📋 ตัวอย่างข้อมูลที่อัพเดท (5 รายการล่าสุด):')
  const samples = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  })

  samples.forEach((order) => {
    const profit = order.totalAmount - (order.totalCost || 0)
    const promoText = order.has_promotion 
      ? `(โปร: ${order.promotion_quantity} ชิ้น ฿${order.promotion_price})` 
      : ''
    
    console.log(`\n   Order: ${order.id.substring(0, 8)}...`)
    console.log(`   สินค้า: ${order.product.name}`)
    console.log(`   จำนวน: ${order.quantity} x ฿${order.unit_price?.toFixed(2) || 'N/A'} ${promoText}`)
    console.log(`   ราคาปกติ: ฿${order.selling_price?.toFixed(2) || 'N/A'}/ชิ้น`)
    console.log(`   ต้นทุน: ฿${order.totalCost?.toFixed(2) || 'N/A'} (${order.unit_cost?.toFixed(2) || 'N/A'}/ชิ้น)`)
    console.log(`   รายได้: ฿${order.totalAmount.toFixed(2)}`)
    console.log(`   กำไร: ฿${profit.toFixed(2)}`)
  })
}

async function main() {
  try {
    await backfillOrderCost()
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
