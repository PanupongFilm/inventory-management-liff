import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

/**
 * Error with an HTTP status code, thrown by services and translated into a
 * JSON response by controllers. Avoids matching on error message strings.
 */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

/** Convert any thrown error into a consistent JSON error response. */
export function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation error', details: error.errors },
      { status: 400 }
    )
  }
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Record already exists' }, { status: 409 })
    }
    // Record to update/delete not found
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }
  }
  console.error(`${fallbackMessage}:`, error)
  return NextResponse.json({ error: fallbackMessage }, { status: 500 })
}

/** Build a Prisma `createdAt` range filter from optional ISO date strings. */
export function buildDateRange(startDate?: string | null, endDate?: string | null) {
  if (!startDate && !endDate) return undefined
  return {
    ...(startDate ? { gte: new Date(startDate) } : {}),
    ...(endDate ? { lte: new Date(endDate) } : {}),
  }
}

/** Shared query schema for `?startDate=&endDate=` (ISO 8601 strings). */
export const DateRangeQuerySchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional().nullable(),
  endDate: z.string().datetime({ offset: true }).optional().nullable(),
})
