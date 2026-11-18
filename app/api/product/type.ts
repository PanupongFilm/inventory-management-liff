import { z } from 'zod'

const ProductFields = {
  name: z.string().trim().min(1, 'Name is required'),
  purchase_price: z.number().nonnegative('Purchase price must not be negative'),
  selling_price: z.number().positive('Selling price must be positive'),
  stock_quantity: z.number().int().nonnegative('Stock must not be negative'),
  // Bundle size for the promotion (e.g. 3 = "3 packs for X baht"); 0 = no promotion
  promotion_quantity: z.number().int().nonnegative(),
  // Bundle price; null clears the promotion
  promotion_price: z.number().positive().nullable(),
}

export const CreateProductSchema = z.object({
  ...ProductFields,
  stock_quantity: ProductFields.stock_quantity.default(0),
  promotion_quantity: ProductFields.promotion_quantity.optional(),
  promotion_price: ProductFields.promotion_price.optional(),
})

export type CreateProductRequest = z.infer<typeof CreateProductSchema>

export const UpdateProductSchema = z.object(ProductFields).partial()

export type UpdateProductRequest = z.infer<typeof UpdateProductSchema>
