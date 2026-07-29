import { prisma } from '@/lib/prisma'
import { CreateOrderRequest } from './type'

export class OrderService {

  static async getAllOrders() {
    return await prisma.order.findMany({
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

    const totalStock = product.stock_quantity + product.promotion_quantity
    if (data.quantity > totalStock) {
      throw new Error(
        `Insufficient stock. Available: ${totalStock}, Requested: ${data.quantity}`
      )
    }

    let totalAmount = 0
    if (product.promotion_quantity !== 0 && product.promotion_price) {
      const promotionCheck = data.quantity % product.promotion_quantity

      if (promotionCheck === 0) {
        totalAmount = product.promotion_price * (data.quantity / product.promotion_quantity)
      } else {
        const promotionAmount = (data.quantity - promotionCheck) * product.promotion_price
        const withoutPromotionAmount = promotionCheck * product.selling_price
        totalAmount = promotionAmount + withoutPromotionAmount
      }
    } else {
      totalAmount = data.quantity * product.selling_price
    }

    await prisma.product.update({
      where: { id: data.productID },
      data: { stock_quantity: product.stock_quantity - data.quantity },
    })

    return await prisma.order.create({
      data: {
        ...data,
        totalAmount,
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

    await prisma.product.update({
      where: { id: order.productID },
      data: { stock_quantity: order.product.stock_quantity + order.quantity },
    })

    return await prisma.order.delete({
      where: { id },
      include: {
        product: true,
      },
    })
  }
}
