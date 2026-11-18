import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { HttpError } from '@/lib/http-error'
import { CreateProductRequest, UpdateProductRequest } from './type'

/** Map Prisma's unique-name violation to a readable 409. */
function rethrowDuplicateName(error: unknown, name?: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new HttpError(409, `Product with name "${name}" already exists`)
  }
  throw error
}

export class ProductService {

  static async getAllProducts(isActive?: boolean) {
    return prisma.product.findMany({
      where: isActive === undefined ? undefined : { isActive },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async getProductById(id: string) {
    return prisma.product.findUnique({ where: { id } })
  }

  static async getProductByName(name: string) {
    return prisma.product.findUnique({ where: { name } })
  }

  // The DB has a UNIQUE index on `name`, so we rely on it instead of a
  // check-then-insert (which costs an extra query and is racy).
  static async createProduct(data: CreateProductRequest) {
    try {
      return await prisma.product.create({ data })
    } catch (error) {
      rethrowDuplicateName(error, data.name)
    }
  }

  static async updateProduct(id: string, data: UpdateProductRequest) {
    try {
      return await prisma.product.update({ where: { id }, data })
    } catch (error) {
      rethrowDuplicateName(error, data.name)
    }
  }

  static async deleteProduct(id: string) {
    // Orders cascade-delete with their product, which would silently erase
    // sales history from reports. Require deactivation instead.
    const orderCount = await prisma.order.count({ where: { productID: id } })
    if (orderCount > 0) {
      throw new HttpError(
        409,
        `Cannot delete a product with ${orderCount} order(s). Deactivate it instead to keep sales history.`
      )
    }
    return prisma.product.delete({ where: { id } })
  }

  static async toggleProductActive(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { isActive: true },
    })

    if (!product) {
      throw new HttpError(404, `Product with ID "${id}" not found`)
    }

    return prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    })
  }
}
