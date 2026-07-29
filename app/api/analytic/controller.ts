import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AnalyticService } from './service'
import { AnalyticQuerySchema } from './type'

export class AnalyticController {

  static async getSalesAnalytic(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url)
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      const query = AnalyticQuerySchema.parse({
        startDate,
        endDate,
      })

      const analytic = await AnalyticService.getSalesAnalytic(query)

      return NextResponse.json(
        {
          success: true,
          detail: 'Fetch sales analytic successfully',
          data: analytic,
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
      console.error('Error fetching analytic:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analytic' },
        { status: 500 }
      )
    }
  }
}
