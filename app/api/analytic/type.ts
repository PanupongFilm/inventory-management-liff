import { z } from 'zod'
import { DateRangeQuerySchema } from '@/lib/http-error'

export const AnalyticQuerySchema = DateRangeQuerySchema

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
