import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { OrderService } from './service'
import { CreateOrderSchema } from './type'

export class OrderController {

  static async get(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')
      const productID = searchParams.get('productID')

      let orders

      if (id) {
        orders = await OrderService.getOrderById(id)
        if (!orders) {
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          )
        }
      } else if (productID) {
        orders = await OrderService.getOrdersByProductId(productID)
      } else {
        orders = await OrderService.getAllOrders()
      }

      return NextResponse.json(
        {
          success: true,
          detail: 'Fetch orders successfully',
          data: orders,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }
  }

  static async create(req: NextRequest) {
    try {
      let body
      try {
        body = await req.json()
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid or empty JSON body' },
          { status: 400 }
        )
      }

      const validated = CreateOrderSchema.parse(body)
      const order = await OrderService.createOrder(validated)

      return NextResponse.json(
        {
          success: true,
          detail: 'Create order successfully',
          data: order,
        },
        { status: 201 }
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return NextResponse.json(
            { error: error.message },
            { status: 404 }
          )
        }
        if (error.message.includes('Insufficient stock')) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          )
        }
      }
      console.error('Error creating order:', error)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }
  }

  static async delete(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json(
          { error: 'Order ID required' },
          { status: 400 }
        )
      }

      const order = await OrderService.deleteOrder(id)

      return NextResponse.json(
        {
          success: true,
          detail: 'Delete order successfully',
          data: order,
        },
        { status: 200 }
      )
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      console.error('Error deleting order:', error)
      return NextResponse.json(
        { error: 'Failed to delete order' },
        { status: 500 }
      )
    }
  }
}
