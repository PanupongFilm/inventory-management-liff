import { prisma } from '@/lib/prisma'
import { AnalyticQuery, SalesAnalytic } from './type'

export class AnalyticService {

  static async getSalesAnalytic(query: AnalyticQuery): Promise<SalesAnalytic> {
    const where: any = {}

    if (query.startDate) {
      where.createdAt = { gte: new Date(query.startDate) }
    }

    if (query.endDate) {
      if (where.createdAt) {
        where.createdAt.lte = new Date(query.endDate)
      } else {
        where.createdAt = { lte: new Date(query.endDate) }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const aggregateData = await tx.order.aggregate({
        where,
        _sum: {
          quantity: true,
          totalAmount: true,
        },
        _count: true,
      })

      const orders = await tx.order.findMany({
        where,
        include: {
          product: true,
        },
      })

      return { aggregateData, orders }
    })

    const totalQuantitySold = result.aggregateData._sum.quantity || 0
    const totalRevenue = result.aggregateData._sum.totalAmount || 0
    const totalOrders = result.aggregateData._count

    let paymentMethodBreakdown: any = {}
    let productBreakdown: any = {}

    result.orders.forEach((order) => {
      const paymentMethod = order.payment_method
      if (!paymentMethodBreakdown[paymentMethod]) {
        paymentMethodBreakdown[paymentMethod] = {
          quantity: 0,
          revenue: 0,
          orderCount: 0,
        }
      }
      paymentMethodBreakdown[paymentMethod].quantity += order.quantity
      paymentMethodBreakdown[paymentMethod].revenue += order.totalAmount
      paymentMethodBreakdown[paymentMethod].orderCount += 1

      const productName = order.product.name
      if (!productBreakdown[productName]) {
        productBreakdown[productName] = {
          quantity: 0,
          revenue: 0,
        }
      }
      productBreakdown[productName].quantity += order.quantity
      productBreakdown[productName].revenue += order.totalAmount
    })

    const averageSalePerOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return {
      totalQuantitySold,
      totalRevenue,
      averageSalePerOrder,
      totalOrders,
      paymentMethodBreakdown,
      productBreakdown,
    }
  }
}
