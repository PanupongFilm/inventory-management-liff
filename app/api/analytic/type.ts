import { z } from 'zod'

export const AnalyticQuerySchema = z.object({
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
})

export type AnalyticQuery = z.infer<typeof AnalyticQuerySchema>

export interface SalesAnalytic {
  totalQuantitySold: number
  totalRevenue: number
  averageSalePerOrder: number
  totalOrders: number
  paymentMethodBreakdown: {
    [key: string]: {
      quantity: number
      revenue: number
      orderCount: number
    }
  }
  productBreakdown: {
    [key: string]: {
      quantity: number
      revenue: number
    }
  }
}
