import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { HttpError, buildDateRange } from '@/lib/http-error'
import { CreateOrderRequest, OrderQuery } from './type'

/**
 * Price an order using the product's bundle promotion.
 * `promotion_quantity` is the bundle size (e.g. 3) and `promotion_price` the
 * bundle price (e.g. 100). Leftover units are charged at `selling_price`.
 */
export function calculateOrderPrice(
  quantity: number,
  product: { selling_price: number; promotion_quantity: number; promotion_price: number | null }
) {
  const { selling_price, promotion_quantity, promotion_price } = product

  if (promotion_quantity > 0 && promotion_price) {
    const promotionSets = Math.floor(quantity / promotion_quantity)
    if (promotionSets > 0) {
      const remainingItems = quantity % promotion_quantity
      return {
        totalAmount: promotionSets * promotion_price + remainingItems * selling_price,
        hasPromotion: true,
      }
    }
  }

  return { totalAmount: quantity * selling_price, hasPromotion: false }
}

// The DB pool has a single connection over a high-latency link; give
// transactions room to wait for it instead of failing at Prisma's defaults
// (maxWait 2s / timeout 5s).
const TX_OPTIONS = { maxWait: 10_000, timeout: 15_000 }

const isNotFound = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'

export class OrderService {

  static async getAllOrders(query?: OrderQuery) {
    return prisma.order.findMany({
      where: { createdAt: buildDateRange(query?.startDate, query?.endDate) },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async getOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { product: true },
    })
  }

  static async getOrdersByProductId(productID: string) {
    return prisma.order.findMany({
      where: { productID },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async createOrder(data: CreateOrderRequest) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Atomic, conditional decrement in ONE round trip: matches only if the
        // product exists, is active, and still has enough stock at write time,
        // so concurrent orders can never drive stock negative.
        const product = await tx.product.update({
          where: {
            id: data.productID,
            isActive: true,
            stock_quantity: { gte: data.quantity },
          },
          data: { stock_quantity: { decrement: data.quantity } },
        })

        const { totalAmount, hasPromotion } = calculateOrderPrice(data.quantity, product)
        const unitCost = product.purchase_price

        // Snapshot prices so later product edits don't rewrite sales history
        return tx.order.create({
          data: {
            productID: product.id,
            quantity: data.quantity,
            payment_method: data.payment_method,
            isDelivery: data.isDelivery ?? false,
            note: data.note ?? null,
            unit_cost: unitCost,
            unit_price: totalAmount / data.quantity,
            selling_price: product.selling_price,
            promotion_quantity: hasPromotion ? product.promotion_quantity : null,
            promotion_price: hasPromotion ? product.promotion_price : null,
            has_promotion: hasPromotion,
            totalAmount,
            totalCost: unitCost * data.quantity,
          },
          include: { product: true },
        })
      }, TX_OPTIONS)
    } catch (error) {
      if (isNotFound(error)) {
        // The conditional update matched nothing — find out why
        throw await OrderService.explainRejectedOrder(data)
      }
      throw error
    }
  }

  private static async explainRejectedOrder(data: CreateOrderRequest) {
    const product = await prisma.product.findUnique({
      where: { id: data.productID },
      select: { name: true, isActive: true, stock_quantity: true },
    })
    if (!product) {
      return new HttpError(404, `Product with ID "${data.productID}" not found`)
    }
    if (!product.isActive) {
      return new HttpError(400, `Product "${product.name}" is not available for sale`)
    }
    return new HttpError(
      400,
      `Insufficient stock. Available: ${product.stock_quantity}, Requested: ${data.quantity}`
    )
  }

  static async deleteOrder(id: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        const order = await tx.order.delete({
          where: { id },
          include: { product: true },
        })

        // Return the units to stock atomically
        const product = await tx.product.update({
          where: { id: order.productID },
          data: { stock_quantity: { increment: order.quantity } },
        })

        return { ...order, product }
      }, TX_OPTIONS)
    } catch (error) {
      if (isNotFound(error)) {
        throw new HttpError(404, `Order with ID "${id}" not found`)
      }
      throw error
    }
  }
}
