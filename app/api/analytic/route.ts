import { NextRequest } from 'next/server'
import { AnalyticController } from './controller'

export async function GET(req: NextRequest) {
  return AnalyticController.getSalesAnalytic(req)
}
