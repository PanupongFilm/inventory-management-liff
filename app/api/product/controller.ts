import { NextRequest, NextResponse } from 'next/server'
import { toErrorResponse } from '@/lib/http-error'
import { ProductService } from './service'
import { CreateProductSchema, UpdateProductSchema } from './type'

async function readJson(req: NextRequest): Promise<unknown | undefined> {
  try {
    return await req.json()
  } catch {
    return undefined
  }
}

const invalidBody = () =>
  NextResponse.json({ error: 'Invalid or empty JSON body' }, { status: 400 })

const missingId = () =>
  NextResponse.json({ error: 'Product ID required' }, { status: 400 })

export class ProductController {

  static async get(req: NextRequest) {
    try {
      const { searchParams } = req.nextUrl
      const id = searchParams.get('id')
      const name = searchParams.get('name')
      const isActive = searchParams.get('isActive')

      let products

      if (id || name) {
        products = id
          ? await ProductService.getProductById(id)
          : await ProductService.getProductByName(name!)
        if (!products) {
          return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }
      } else {
        products = await ProductService.getAllProducts(
          isActive === 'true' ? true : isActive === 'false' ? false : undefined
        )
      }

      return NextResponse.json(
        { success: true, detail: 'Fetch products successfully', data: products },
        { status: 200 }
      )
    } catch (error) {
      return toErrorResponse(error, 'Failed to fetch products')
    }
  }

  static async create(req: NextRequest) {
    try {
      const body = await readJson(req)
      if (body === undefined) return invalidBody()

      const product = await ProductService.createProduct(CreateProductSchema.parse(body))

      return NextResponse.json(
        { success: true, detail: 'Create product successfully', data: product },
        { status: 201 }
      )
    } catch (error) {
      return toErrorResponse(error, 'Failed to create product')
    }
  }

  static async update(req: NextRequest) {
    try {
      const id = req.nextUrl.searchParams.get('id')
      if (!id) return missingId()

      const body = await readJson(req)
      if (body === undefined) return invalidBody()

      const product = await ProductService.updateProduct(id, UpdateProductSchema.parse(body))

      return NextResponse.json(
        { success: true, detail: 'Update product successfully', data: product },
        { status: 200 }
      )
    } catch (error) {
      return toErrorResponse(error, 'Failed to update product')
    }
  }

  static async delete(req: NextRequest) {
    try {
      const id = req.nextUrl.searchParams.get('id')
      if (!id) return missingId()

      const product = await ProductService.deleteProduct(id)

      return NextResponse.json(
        { success: true, detail: 'Delete product successfully', data: product },
        { status: 200 }
      )
    } catch (error) {
      return toErrorResponse(error, 'Failed to delete product')
    }
  }

  static async toggleActive(req: NextRequest) {
    try {
      const id = req.nextUrl.searchParams.get('id')
      if (!id) return missingId()

      const product = await ProductService.toggleProductActive(id)

      return NextResponse.json(
        { success: true, detail: 'Toggle product active status successfully', data: product },
        { status: 200 }
      )
    } catch (error) {
      return toErrorResponse(error, 'Failed to toggle product active')
    }
  }
}
