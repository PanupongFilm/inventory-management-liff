import { prisma } from '@/lib/prisma'
import { CreateProductRequest, UpdateProductRequest } from './type'

export class ProductService {

  static async getAllProducts() {
    return await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  static async getProductById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
    })
  }

  static async getProductByName(name: string) {
    return await prisma.product.findFirst({
      where: { name },
    })
  }

  static async createProduct(data: CreateProductRequest) {

    const existing = await prisma.product.findFirst({
      where: { name: data.name },
    })

    if (existing) {
      throw new Error(`Product with name "${data.name}" already exists`)
    }

    return await prisma.product.create({
      data,
    })
  }

  static async updateProduct(id: string, data: UpdateProductRequest) {
 
    if (data.name) {
      const existing = await prisma.product.findFirst({
        where: {
          name: data.name,
          id: { not: id }, // ไม่รวม product ที่กำลังแก้
        },
      })

      if (existing) {
        throw new Error(`Product with name "${data.name}" already exists`)
      }
    }

    return await prisma.product.update({
      where: { id },
      data,
    })
  }

  static async deleteProduct(id: string) {
    return await prisma.product.delete({
      where: { id },
    })
  }

  static async toggleProductActive(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw new Error(`Product with ID "${id}" not found`)
    }

    return await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    })
  }
}
