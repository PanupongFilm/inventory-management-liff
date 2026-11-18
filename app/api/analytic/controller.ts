import { NextRequest, NextResponse } from 'next/server'
import { toErrorResponse } from '@/lib/http-error'
import { AnalyticService } from './service'
import { AnalyticQuerySchema } from './type'

export class AnalyticController {

  static async getSalesAnalytic(req: NextRequest) {
    try {
      const { searchParams } = req.nextUrl
      const query = AnalyticQuerySchema.parse({
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
      })

      const analytic = await AnalyticService.getSalesAnalytic(query)

      return NextResponse.json(
        { success: true, detail: 'Fetch sales analytic successfully', data: analytic },
        { status: 200 }
      )
    } catch (error) {
      return toErrorResponse(error, 'Failed to fetch analytic')
    }
  }
}
