import { prisma } from '@/lib/prisma'
import { CreateOrderRequest, UpdateOrderRequest } from './type'
import { includes } from 'zod/v4'

export class OrderService {

  static async getAllOrders() {
    return await prisma.order.findMany({
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  static async getOrderById(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
      },
    })
  }

  static async getOrdersByProductId(productID: string) {
    return await prisma.order.findMany({
      where: { productID },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  static async createOrder(data: CreateOrderRequest) {
    const product = await prisma.product.findUnique({
      where: { id: data.productID },
    })

    if (!product) {
      throw new Error(`Product with ID "${data.productID}" not found`)
    }

    const totalStock = product.stock_quantity + product.promotion_quantity
    if (data.quantity > totalStock) {
      throw new Error(
        `Insufficient stock. Available: ${totalStock}, Requested: ${data.quantity}`
      )
    }

  

    const updateProductQty = await prisma.product.update({
      where:{id: data.productID},
      data:{stock_quantity: product.stock_quantity - data.quantity}
    });

    return await prisma.order.create({
      data,
      include: {
        product: true,
      },
    })
  }

  static async updateOrder(id: string, data: UpdateOrderRequest) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
      },
    })

    if (!order) {
      throw new Error(`Order with ID "${id}" not found`)
    }

    if (data.productID && data.productID !== order.productID) {
      const newProduct = await prisma.product.findUnique({
        where: { id: data.productID },
      })

      if (!newProduct) {
        throw new Error(`Product with ID "${data.productID}" not found`)
      }
    }

    const targetProduct = data.productID
      ? await prisma.product.findUnique({
          where: { id: data.productID },
        })
      : order.product

    if (targetProduct) {
      const newQuantity = data.quantity || order.quantity
      const totalStock = targetProduct.stock_quantity + targetProduct.promotion_quantity
      if (newQuantity > totalStock) {
        throw new Error(
          `Insufficient stock. Available: ${totalStock}, Requested: ${newQuantity}`
        )
      }
    }

    return await prisma.order.update({
      where: { id },
      data,
      include: {
        product: true,
      },
    })
  }

  static async deleteOrder(id: string) {
    return await prisma.order.delete({
      where: { id },
      include: {
        product: true,
      },
    })
  }
}
