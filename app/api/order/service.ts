import { prisma } from '@/lib/prisma'
import { CreateOrderRequest, OrderQuery } from './type'

export class OrderService {

  static async getAllOrders(query?: OrderQuery) {
    const where: any = {}

    if (query?.startDate) {
      where.createdAt = { gte: new Date(query.startDate) }
    }

    if (query?.endDate) {
      if (where.createdAt) {
        where.createdAt.lte = new Date(query.endDate)
      } else {
        where.createdAt = { lte: new Date(query.endDate) }
      }
    }

    return await prisma.order.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  static async getOrderById(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
      },
    })
  }

  static async getOrdersByProductId(productID: string) {
    return await prisma.order.findMany({
      where: { productID },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  static async createOrder(data: CreateOrderRequest) {
    const product = await prisma.product.findUnique({
      where: { id: data.productID },
    })

    if (!product) {
      throw new Error(`Product with ID "${data.productID}" not found`)
    }

    // ตรวจสอบ stock รวมทั้ง stock_quantity และ promotion_quantity
    const totalStock = product.stock_quantity + product.promotion_quantity
    if (data.quantity > totalStock) {
      throw new Error(
        `Insufficient stock. Available: ${totalStock}, Requested: ${data.quantity}`
      )
    }

    let totalAmount = 0
    let unitPrice = product.selling_price
    let hasPromotion = false

    // คำนวณราคาตามโปรโมชั่น (ถ้ามี)
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
      }

      // คำนวณราคาขายเฉลี่ยต่อหน่วย (หลังใช้โปร)
      unitPrice = totalAmount / data.quantity

    } else {
      // ไม่มีโปรโมชั่น
      totalAmount = data.quantity * product.selling_price
    }

    // เก็บ snapshot ของราคาและโปรโมชั่นขณะขาย
    const unitCost = product.purchase_price
    const totalCost = unitCost * data.quantity

    // ลด stock โดยลด stock_quantity ก่อน ถ้าไม่พอค่อยลด promotion_quantity
    let remainingQuantity = data.quantity
    let newStockQuantity = product.stock_quantity
    let newPromotionQuantity = product.promotion_quantity

    if (remainingQuantity <= product.stock_quantity) {
      // stock_quantity เพียงพอ
      newStockQuantity = product.stock_quantity - remainingQuantity
    } else {
      // stock_quantity ไม่พอ ต้องใช้ promotion_quantity ด้วย
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
  }

  static async deleteOrder(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
      },
    })

    if (!order) {
      throw new Error(`Order with ID "${id}" not found`)
    }

    // คืน stock โดยเพิ่มกลับไปที่ stock_quantity
    // (สมมติว่าคืนไปที่ stock_quantity ไม่ใช่ promotion_quantity)
    await prisma.product.update({
      where: { id: order.productID },
      data: { 
        stock_quantity: order.product.stock_quantity + order.quantity 
      },
    })

    return await prisma.order.delete({
      where: { id },
      include: {
        product: true,
      },
    })
  }
}
