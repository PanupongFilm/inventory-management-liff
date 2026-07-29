import { z } from 'zod'

export const PaymentMethodEnum = z.enum(['CASH', 'SCAN', 'THAI_HELP'])

export const CreateOrderSchema = z.object({
  productID: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  payment_method: PaymentMethodEnum,
  isDelivery: z.boolean().optional(),
  note: z.string().optional(),
})

export type CreateOrderRequest = z.infer<typeof CreateOrderSchema>
