import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ProductService } from './service'
import { CreateProductSchema, UpdateProductSchema } from './type'

export class ProductController {

  static async get(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')
      const name = searchParams.get('name')
      const isActive = searchParams.get('isActive')

      let products

      if (id) {
        products = await ProductService.getProductById(id)
        if (!products) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          )
        }
      } else if (name) {
        products = await ProductService.getProductByName(name)
        if (!products) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          )
        }
      } else {
        products = await ProductService.getAllProducts(
          isActive === 'true' ? true : isActive === 'false' ? false : undefined
        )
      }

      return NextResponse.json(
        {
          success: true,
          detail: "Fetch products successfully",
          data: products,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
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

      const validated = CreateProductSchema.parse(body)
      const product = await ProductService.createProduct(validated)

      return NextResponse.json(
        {
          success: true,
          detail: "Create product successfully",
          data: product,
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
      if (error instanceof Error && error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 } // Conflict
        )
      }
      console.error('Error creating product:', error)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }
  }

  static async update(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json(
          { error: 'Product ID required' },
          { status: 400 }
        )
      }

      let body
      try {
        body = await req.json()
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid or empty JSON body' },
          { status: 400 }
        )
      }

      const validated = UpdateProductSchema.parse(body)
      const product = await ProductService.updateProduct(id, validated)

      return NextResponse.json(
        {
          success: true,
          detail: "Update product successfully",
          data: product,
        },
        { status: 200 }
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      if (error instanceof Error && error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 } // Conflict
        )
      }
      console.error('Error updating product:', error)
      return NextResponse.json(
        { error: 'Failed to update product' },
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
          { error: 'Product ID required' },
          { status: 400 }
        )
      }

      const product = await ProductService.deleteProduct(id)

      return NextResponse.json(
        {
          success: true,
          detail: "Delete product successfully",
          data: product,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }
  }

  static async toggleActive(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json(
          { error: 'Product ID required' },
          { status: 400 }
        )
      }

      const product = await ProductService.toggleProductActive(id)

      return NextResponse.json(
        {
          success: true,
          detail: "Toggle product active status successfully",
          data: product,
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
      console.error('Error toggling product active:', error)
      return NextResponse.json(
        { error: 'Failed to toggle product active' },
        { status: 500 }
      )
    }
  }
}
