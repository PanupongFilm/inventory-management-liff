import { z } from 'zod'

export const AnalyticQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  paymentMethod: z.enum(['CASH', 'SCAN', 'THAI_HELP']).optional(),
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
