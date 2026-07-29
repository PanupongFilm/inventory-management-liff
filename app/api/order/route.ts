import { NextRequest } from 'next/server'
import { OrderController } from './controller'

export async function GET(req: NextRequest) {
  return OrderController.get(req)
}

export async function POST(req: NextRequest) {
  return OrderController.create(req)
}

export async function PUT(req: NextRequest) {
  return OrderController.update(req)
}

export async function DELETE(req: NextRequest) {
  return OrderController.delete(req)
}
