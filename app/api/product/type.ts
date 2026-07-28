import { z } from 'zod'

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  purchase_price: z.number().positive('Purchase price must be positive'),
  selling_price: z.number().positive('Selling price must be positive'),
  stock_quantity: z.number().int().default(0),
  promotion_quantity: z.number().int().optional(),
  promotion_price: z.number().positive().optional(),
})

export type CreateProductRequest = z.infer<typeof CreateProductSchema>

export const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  purchase_price: z.number().positive().optional(),
  selling_price: z.number().positive().optional(),
  stock_quantity: z.number().int().optional(),
  promotion_quantity: z.number().int().optional(),
  promotion_price: z.number().positive().optional(),
})

export type UpdateProductRequest = z.infer<typeof UpdateProductSchema>
