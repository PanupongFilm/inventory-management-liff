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

    if (query.paymentMethod) {
      where.payment_method = query.paymentMethod
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        product: true,
      },
    });

    let cost;
    let profit;



    const averageSalePerOrder = orders.length > 0 ? totalRevenue / orders.length : 0

    return {
    
    }
  }
}
