"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, subDays } from "date-fns"
import {
  CalendarIcon,
  TrendingDownIcon,
  ShoppingCartIcon,
  PackageIcon,
  ReceiptIcon,
  CoinsIcon,
  RefreshCwIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  WalletIcon,
  BanknoteIcon,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Calendar } from "@/app/components/ui/calendar"
import { Card, CardContent } from "@/app/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"

// ── Mock API response ─────────────────────────────────────────────────────────
const MOCK_DATA = {
  success: true,
  detail: "Fetch sales analytic successfully",
  data: {
    totalQuantitySold: 11,
    totalCost: 330,
    totalRevenue: 370,
    profit: 40,
    averageSalePerOrder: 123.33333333333333,
    totalOrders: 3,
    paymentMethodBreakdown: {
      CASH: { quantity: 11, revenue: 370, orderCount: 3 },
    },
    productBreakdown: {
      Plus: { quantity: 11, revenue: 370 },
    },
    productStock: [
      { name: "Sky", stock_quantity: 50 },
      { name: "Ocean", stock_quantity: 50 },
      { name: "Plus", stock_quantity: 50 },
    ],
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCurrency(n: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(n)
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("th-TH").format(n)
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
type Accent = "emerald" | "blue" | "violet" | "amber"

const ACCENT_STYLES: Record<Accent, { icon: string; bar: string; ring: string }> = {
  emerald: {
    icon: "bg-emerald-50 text-emerald-600",
    bar: "bg-teal-500",
    ring: "ring-emerald-200/60",
  },
  blue: {
    icon: "bg-teal-50 text-teal-600",
    bar: "bg-sky-400",
    ring: "ring-teal-200/60",
  },
  violet: {
    icon: "bg-green-50 text-green-600",
    bar: "bg-violet-600",
    ring: "ring-green-200/60",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    bar: "bg-amber-500",
    ring: "ring-amber-200/60",
  },
}

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  accent: Accent
  trend?: { dir: "up" | "down"; label: string }
}

function KpiCard({ title, value, subtitle, icon, accent, trend }: KpiCardProps) {
  const s = ACCENT_STYLES[accent]
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-card to-white shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("h-1.5 w-full", s.bar)} />
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-xl shrink-0",
              s.icon
            )}
          >
            {icon}
          </div>
          <p className="text-xs font-semibold text-muted-foreground truncate uppercase tracking-wide">
            {title}
          </p>
        </div>
        <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums leading-none mb-2">
          {value}
        </p>
        <div className="flex items-center justify-between gap-2">
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold ml-auto shrink-0",
                trend.dir === "up"
                  ? "text-emerald-600"
                  : "text-destructive"
              )}
            >
              {trend.dir === "up" ? (
                <ArrowUpRightIcon className="size-4" />
              ) : (
                <ArrowDownRightIcon className="size-4" />
              )}
              {trend.label}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Date Range Picker ─────────────────────────────────────────────────────────
function DateRangePicker({
  date,
  onDateChange,
}: {
  date: DateRange | undefined
  onDateChange: (range: DateRange | undefined) => void
}) {
  const [open, setOpen] = React.useState(false)

  const label = React.useMemo(() => {
    if (date?.from && date?.to) {
      return `${format(date.from, "d MMM yyyy")} — ${format(date.to, "d MMM yyyy")}`
    }
    if (date?.from) return format(date.from, "d MMM yyyy")
    return "เลือกช่วงวันที่"
  }, [date])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-11 w-full justify-start gap-2.5 rounded-lg border-emerald-200 bg-white hover:bg-emerald-50 px-4",
            "font-medium text-foreground",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-emerald-600" />
          <span className="truncate text-sm">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-emerald-200 bg-white shadow-lg" align="start" side="bottom">
        <div className="p-4">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={1}
            className="rounded-lg"
          />
        </div>
        <Separator className="bg-emerald-100" />
        <div className="flex gap-2 p-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs border-emerald-200 hover:bg-emerald-50"
            onClick={() => {
              const now = new Date()
              onDateChange({ from: startOfMonth(now), to: endOfMonth(now) })
              setOpen(false)
            }}
          >
            เดือนนี้
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs border-emerald-200 hover:bg-emerald-50"
            onClick={() => {
              const now = new Date()
              onDateChange({ from: subDays(now, 6), to: now })
              setOpen(false)
            }}
          >
            7 วันล่าสุด
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setOpen(false)}
          >
            เสร็จสิ้น
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ── Payment Method Breakdown ──────────────────────────────────────────────────
const PAYMENT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
]

const PAYMENT_META: Record<string, { label: string; icon: React.ReactNode }> = {
  CASH: {
    label: "เงินสด",
    icon: <BanknoteIcon className="size-4" />,
  },
  TRANSFER: {
    label: "โอนเงิน",
    icon: <WalletIcon className="size-4" />,
  },
  CREDIT: {
    label: "บัตรเครดิต",
    icon: <ReceiptIcon className="size-4" />,
  },
}

function PaymentBreakdown({
  data,
}: {
  data: Record<string, { quantity: number; revenue: number; orderCount: number }>
}) {
  const total = Object.values(data).reduce((sum, s) => sum + s.revenue, 0)

  const entries = Object.entries(data).map(([method, stats], i) => {
    const meta = PAYMENT_META[method] ?? {
      label: method,
      icon: <WalletIcon className="size-4" />,
    }
    return {
      method,
      label: meta.label,
      icon: meta.icon,
      ...stats,
      color: PAYMENT_COLORS[i % PAYMENT_COLORS.length],
      pct: total > 0 ? (stats.revenue / total) * 100 : 0,
    }
  })

  return (
    <div className="space-y-4">
      {/* Stacked proportion bar */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {entries.map((e) => (
          <div
            key={e.method}
            className="h-full"
            style={{ width: `${e.pct}%`, backgroundColor: e.color }}
          />
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-2.5">
        {entries.map((e) => (
          <div
            key={e.method}
            className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 p-3.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex size-10 items-center justify-center rounded-lg shrink-0"
                style={{ backgroundColor: `color-mix(in oklab, ${e.color} 12%, transparent)` }}
              >
                <span
                  className="size-4"
                  style={{ color: e.color }}
                >
                  {e.icon}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {e.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.orderCount} ออร์เดอร์ · {e.quantity} ชิ้น
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(e.revenue)}
              </p>
              <p className="text-xs text-muted-foreground">{e.pct.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Product Breakdown List ────────────────────────────────────────────────────
const PRODUCT_RANK_COLORS = [
  "bg-primary",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
]

function ProductBreakdownList({
  data,
}: {
  data: Record<string, { quantity: number; revenue: number }>
}) {
  const entries = Object.entries(data)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)

  const totalRevenue = entries.reduce((s, e) => s + e.revenue, 0)
  const maxRevenue = Math.max(...entries.map((e) => e.revenue), 1)

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const sharePct = totalRevenue > 0 ? (entry.revenue / totalRevenue) * 100 : 0
        const barPct = Math.min((entry.revenue / maxRevenue) * 100, 100)
        const rank = i + 1
        const rankColor = PRODUCT_RANK_COLORS[i % PRODUCT_RANK_COLORS.length]
        const avgPrice = entry.quantity > 0 ? entry.revenue / entry.quantity : 0

        return (
          <div
            key={entry.name}
            className="rounded-lg border border-border/50 bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums text-white",
                  rankColor
                )}
              >
                {rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {entry.name}
                  </p>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(entry.revenue)}
                  </p>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    ขาย {formatNumber(entry.quantity)} ชิ้น · เฉลี่ย {formatCurrency(Math.round(avgPrice))}/ชิ้น
                  </span>
                  <span className="font-medium text-primary">{sharePct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${barPct}%` }}
              />
            </div>
          </div>
        )
      })}

      {entries.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          ยังไม่มีข้อมูลยอดขายในช่วงที่เลือก
        </p>
      )}
    </div>
  )
}

// ── Stock List ────────────────────────────────────────────────────────────────
function StockList({
  items,
}: {
  items: { name: string; stock_quantity: number }[]
}) {
  const totalStock = items.reduce((s, i) => s + i.stock_quantity, 0)
  const maxStock = Math.max(...items.map((i) => i.stock_quantity))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/50 p-3 text-center border border-border/50">
          <p className="text-xs text-muted-foreground font-medium">ประเภท</p>
          <p className="text-lg font-bold tabular-nums text-foreground mt-1">
            {items.length}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center border border-border/50">
          <p className="text-xs text-muted-foreground font-medium">คงเหลือ</p>
          <p className="text-lg font-bold tabular-nums text-foreground mt-1">
            {formatNumber(totalStock)}
          </p>
        </div>
        <div className="rounded-lg bg-accent/30 p-3 text-center border border-primary/20">
          <p className="text-xs text-accent-foreground font-medium">เฉลี่ย</p>
          <p className="text-lg font-bold tabular-nums text-primary mt-1">
            {formatNumber(Math.round(totalStock / items.length))}
          </p>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        {items.map((item) => {
          const pct = Math.min((item.stock_quantity / maxStock) * 100, 100)
          const status =
            pct >= 60 ? "good" : pct >= 30 ? "warn" : "critical"
          const barColor =
            status === "good"
              ? "bg-primary"
              : status === "warn"
                ? "bg-amber-500"
                : "bg-destructive"
          const badgeClass =
            status === "good"
              ? "bg-accent/60 text-accent-foreground"
              : status === "warn"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-red-50 text-red-700 border border-red-200"
          const statusLabel =
            status === "good" ? "พร้อมขาย" : status === "warn" ? "เหลือน้อย" : "วิกฤต"

          return (
            <div key={item.name} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0 border border-border/50">
                    <PackageIcon className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatNumber(item.stock_quantity)}
                  </span>
                  <span className="text-xs text-muted-foreground">ชิ้น</span>
                  <Badge
                    variant="outline"
                    className={cn("border px-2 py-0 text-xs font-medium", badgeClass)}
                  >
                    {statusLabel}
                  </Badge>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all", barColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SalesAnalytics() {
  const now = new Date()
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: now,
    to: now,
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [data, setData] = React.useState(MOCK_DATA.data)

  const fetchAnalytics = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange?.from) {
        // Set to start of day (00:00:00)
        const startDate = new Date(dateRange.from)
        startDate.setHours(0, 0, 0, 0)
        params.append('startDate', startDate.toISOString())
      }
      if (dateRange?.to) {
        // Set to end of day (23:59:59)
        const endDate = new Date(dateRange.to)
        endDate.setHours(23, 59, 59, 999)
        params.append('endDate', endDate.toISOString())
      }

      const response = await fetch(`/api/analytic?${params}`)
      const result = await response.json()

      if (result.success && result.data) {
        setData(result.data)
      } else {
        console.error('API error:', result.error)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  const handleRefresh = () => {
    fetchAnalytics()
  }

  // Fetch data when date range changes
  React.useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const profitMargin =
    data.totalRevenue > 0
      ? (data.profit / data.totalRevenue) * 100
      : 0

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white/50 backdrop-blur supports-[backdrop-filter]:bg-emerald-50/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-emerald-900">
              ภาพรวมยอดขาย
            </h1>
            <p className="text-xs text-emerald-600 mt-0.5">Sales Overview</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-emerald-50 hover:text-emerald-600 border-emerald-200"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCwIcon
              className={cn("size-4", isLoading && "animate-spin")}
            />
            <span className="hidden sm:inline text-sm">รีเฟรช</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 pb-12 pt-8 sm:px-6">
        {/* ── Date Range ─────────────────────────────────────────────── */}
        <section>
          <SectionHeading
            title="ช่วงเวลาที่ดูข้อมูล"
            subtitle="เลือกวันเริ่มต้นและวันสิ้นสุดของรายงาน"
          />
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        </section>

        <Separator className="my-2 bg-emerald-100" />

        {/* ── KPI Cards ──────────────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeading title="ตัวชี้วัดหลัก" subtitle="สรุปผลประกอบการในช่วงที่เลือก" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <KpiCard
              title="รายรับรวม"
              value={formatCurrency(data.totalRevenue)}
              subtitle={`${formatNumber(data.totalQuantitySold)} ชิ้น`}
              icon={<ReceiptIcon className="size-5" />}
              accent="emerald"
              trend={{ dir: "up", label: "+" }}
            />
            <KpiCard
              title="กำไร"
              value={formatCurrency(data.profit)}
              subtitle={`Margin ${profitMargin.toFixed(1)}%`}
              icon={<CoinsIcon className="size-5" />}
              accent="blue"
              trend={{ dir: data.profit >= 0 ? "up" : "down", label: `${profitMargin.toFixed(1)}%` }}
            />
            <KpiCard
              title="จำนวนออร์เดอร์"
              value={formatNumber(data.totalOrders)}
              subtitle={`เฉลี่ย ${formatCurrency(Math.round(data.averageSalePerOrder))}/ออร์เดอร์`}
              icon={<ShoppingCartIcon className="size-5" />}
              accent="violet"
            />
            <KpiCard
              title="ต้นทุนรวม"
              value={formatCurrency(data.totalCost)}
              subtitle={`ต่อชิ้น ${formatCurrency(Math.round(data.totalCost / data.totalQuantitySold))}`}
              icon={<TrendingDownIcon className="size-5" />}
              accent="amber"
            />
          </div>
        </section>

        {/* ── Payment Method ─────────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeading
            title="ช่องทางชำระเงิน"
            subtitle="สัดส่วนรายรับแยกตามวิธีการชำระ"
          />
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <PaymentBreakdown data={data.paymentMethodBreakdown} />
            </CardContent>
          </Card>
        </section>

        {/* ── Product Breakdown ──────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeading
            title="ยอดขายตามสินค้า"
            subtitle="รายรับและจำนวนที่ขายได้แยกตามรายการ"
          />
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <ProductBreakdownList data={data.productBreakdown} />
            </CardContent>
          </Card>
        </section>

        {/* ── Product Stock ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeading
            title="สต็อกสินค้า"
            subtitle="ปริมาณสินค้าคงเหลือในคลัง"
            action={
              <Badge variant="secondary" className="font-medium text-xs bg-emerald-100 text-emerald-700 border-0">
                {data.productStock.length} รายการ
              </Badge>
            }
          />
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <StockList items={data.productStock} />
            </CardContent>
          </Card>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <Separator className="my-4 bg-emerald-100" />
        <p className="text-center text-xs text-muted-foreground">
          {dateRange?.from && dateRange?.to
            ? `ข้อมูลระหว่าง ${format(dateRange.from, "d MMMM yyyy")} — ${format(dateRange.to, "d MMMM yyyy")}`
            : "กรุณาเลือกช่วงวันที่"}
        </p>
      </main>
    </div>
  )
}
