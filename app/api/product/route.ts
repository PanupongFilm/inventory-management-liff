import { NextRequest } from 'next/server'
import { ProductController } from './controller'

export async function GET(req: NextRequest) {
  return ProductController.get(req)
}

export async function POST(req: NextRequest) {
  return ProductController.create(req)
}

export async function PATCH(req: NextRequest) {
  return ProductController.update(req)
}

export async function PUT(req: NextRequest) {
  return ProductController.toggleActive(req)
}

export async function DELETE(req: NextRequest) {
  return ProductController.delete(req)
}
