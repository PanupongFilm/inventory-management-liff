import { NextRequest, NextResponse } from 'next/server'
import { toErrorResponse } from '@/lib/http-error'
import { OrderService } from './service'
import { CreateOrderSchema, OrderQuerySchema } from './type'

export class OrderController {

  static async get(req: NextRequest) {
    try {
      const { searchParams } = req.nextUrl
      const id = searchParams.get('id')
      const productID = searchParams.get('productID')

      let orders

      if (id) {
        orders = await OrderService.getOrderById(id)
        if (!orders) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }
      } else if (productID) {
        orders = await OrderService.getOrdersByProductId(productID)
      } else {
        const query = OrderQuerySchema.parse({
          startDate: searchParams.get('startDate'),
          endDate: searchParams.get('endDate'),
        })
        orders = await OrderService.getAllOrders(query)
      }

      return NextResponse.json(
        { success: true, detail: 'Fetch orders successfully', data: orders },
        { status: 200 }
      )
    } catch (error) {
      return toErrorResponse(error, 'Failed to fetch orders')
    }
  }

  static async create(req: NextRequest) {
    try {
      let body
      try {
        body = await req.json()
      } catch {
        return NextResponse.json({ error: 'Invalid or empty JSON body' }, { status: 400 })
      }

      const validated = CreateOrderSchema.parse(body)
      const order = await OrderService.createOrder(validated)

      return NextResponse.json(
        { success: true, detail: 'Create order successfully', data: order },
        { status: 201 }
      )
    } catch (error) {
      return toErrorResponse(error, 'Failed to create order')
    }
  }

  static async delete(req: NextRequest) {
    try {
      const id = req.nextUrl.searchParams.get('id')

      if (!id) {
        return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
      }

      const order = await OrderService.deleteOrder(id)

      return NextResponse.json(
        { success: true, detail: 'Delete order successfully', data: order },
        { status: 200 }
      )
    } catch (error) {
      return toErrorResponse(error, 'Failed to delete order')
    }
  }
}
