import { z } from 'zod'

export const AnalyticQuerySchema = z.object({
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
})

export type AnalyticQuery = z.infer<typeof AnalyticQuerySchema>

export interface SalesAnalytic {
  totalQuantitySold: number
  totalCost: number
  totalRevenue: number
  profit: number
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
  productStock: Array<{
    name: string
    stock_quantity: number
  }>
}
