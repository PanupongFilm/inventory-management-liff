import { prisma } from '@/lib/prisma'
import { AnalyticQuery, SalesAnalytic } from './type'

interface AnalyticRow {
  total_quantity: number
  total_revenue: number
  total_cost: number
  total_orders: number
  by_payment: { method: string; quantity: number; revenue: number; order_count: number }[]
  by_product: { name: string; quantity: number; revenue: number }[]
  product_stock: { name: string; stock_quantity: number }[]
}

/**
 * `createdAt` is `TIMESTAMP(3)` (no time zone) and Prisma stores it in UTC,
 * so compare against the UTC wall-clock value: "YYYY-MM-DD HH:MM:SS.mmm".
 */
function toUtcTimestamp(iso?: string | null) {
  if (!iso) return null
  return new Date(iso).toISOString().replace('T', ' ').replace('Z', '')
}

export class AnalyticService {

  /**
   * All figures are computed in a single SQL statement (one DB round trip).
   * The production pool is `connection_limit=1` over a high-latency link, so
   * the number of round trips — not the amount of work — dominates latency.
   * Legacy orders without a cost snapshot fall back to the current cost.
   */
  static async getSalesAnalytic(query: AnalyticQuery): Promise<SalesAnalytic> {
    const start = toUtcTimestamp(query.startDate)
    const end = toUtcTimestamp(query.endDate)

    const [row] = await prisma.$queryRaw<AnalyticRow[]>`
      WITH filtered AS (
        SELECT
          o."quantity",
          o."totalAmount",
          o."payment_method",
          o."productID",
          p."name" AS product_name,
          COALESCE(o."totalCost", p."purchase_price" * o."quantity") AS cost
        FROM "Order" o
        JOIN "Product" p ON p."id" = o."productID"
        WHERE (${start}::timestamp IS NULL OR o."createdAt" >= ${start}::timestamp)
          AND (${end}::timestamp IS NULL OR o."createdAt" <= ${end}::timestamp)
      )
      SELECT
        (SELECT COALESCE(SUM("quantity"), 0)::int      FROM filtered) AS total_quantity,
        (SELECT COALESCE(SUM("totalAmount"), 0)::float8 FROM filtered) AS total_revenue,
        (SELECT COALESCE(SUM(cost), 0)::float8          FROM filtered) AS total_cost,
        (SELECT COUNT(*)::int                           FROM filtered) AS total_orders,
        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT "payment_method"::text AS method,
                 SUM("quantity")::int AS quantity,
                 SUM("totalAmount")::float8 AS revenue,
                 COUNT(*)::int AS order_count
          FROM filtered GROUP BY "payment_method"
        ) t) AS by_payment,
        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT product_name AS name,
                 SUM("quantity")::int AS quantity,
                 SUM("totalAmount")::float8 AS revenue
          FROM filtered GROUP BY "productID", product_name
        ) t) AS by_product,
        (SELECT COALESCE(json_agg(t ORDER BY t.name), '[]'::json) FROM (
          SELECT "name" AS name, "stock_quantity" AS stock_quantity
          FROM "Product" WHERE "isActive" = true
        ) t) AS product_stock
    `

    const paymentMethodBreakdown: SalesAnalytic['paymentMethodBreakdown'] = {}
    for (const r of row.by_payment) {
      paymentMethodBreakdown[r.method] = {
        quantity: r.quantity,
        revenue: r.revenue,
        orderCount: r.order_count,
      }
    }

    const productBreakdown: SalesAnalytic['productBreakdown'] = {}
    for (const r of row.by_product) {
      productBreakdown[r.name] = { quantity: r.quantity, revenue: r.revenue }
    }

    const totalRevenue = row.total_revenue
    const totalCost = row.total_cost
    const totalOrders = row.total_orders

    return {
      totalQuantitySold: row.total_quantity,
      totalCost,
      totalRevenue,
      profit: totalRevenue - totalCost,
      averageSalePerOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalOrders,
      paymentMethodBreakdown,
      productBreakdown,
      productStock: row.product_stock,
    }
  }
}
