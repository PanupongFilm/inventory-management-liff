import { z } from 'zod'
import { DateRangeQuerySchema } from '@/lib/http-error'

export const PaymentMethodEnum = z.enum(['CASH', 'SCAN', 'THAI_HELP'])

export const CreateOrderSchema = z.object({
  productID: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  payment_method: PaymentMethodEnum,
  isDelivery: z.boolean().optional(),
  note: z.string().max(500).optional(),
})

export type CreateOrderRequest = z.infer<typeof CreateOrderSchema>

export const OrderQuerySchema = DateRangeQuerySchema

export type OrderQuery = z.infer<typeof OrderQuerySchema>
