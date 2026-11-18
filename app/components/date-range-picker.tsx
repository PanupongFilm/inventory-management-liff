'use client'

import { useState } from 'react'
import { format, isSameDay, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { cn } from '@/app/lib/utils'
import { Button } from '@/app/components/ui/button'
import { Calendar } from '@/app/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import { Separator } from '@/app/components/ui/separator'

/**
 * Human-readable label for a date range. A range whose start and end fall on
 * the same day (or that has no end yet) is shown as a single date.
 */
export function formatDateRange(range: DateRange | undefined, pattern = 'd MMM yyyy') {
  if (!range?.from) return null
  if (!range.to || isSameDay(range.from, range.to)) return format(range.from, pattern)
  return `${format(range.from, pattern)} — ${format(range.to, pattern)}`
}

const TONES = {
  emerald: {
    border: 'border-emerald-200',
    hover: 'hover:bg-emerald-50',
    icon: 'text-emerald-600',
    separator: 'bg-emerald-100',
    primary: 'bg-emerald-600 hover:bg-emerald-700',
  },
  blue: {
    border: 'border-blue-200',
    hover: 'hover:bg-blue-50',
    icon: 'text-blue-600',
    separator: 'bg-blue-100',
    primary: 'bg-blue-600 hover:bg-blue-700',
  },
} as const

interface DateRangePickerProps {
  date: DateRange | undefined
  onDateChange: (range: DateRange | undefined) => void
  tone?: keyof typeof TONES
  className?: string
}

export function DateRangePicker({
  date,
  onDateChange,
  tone = 'emerald',
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const t = TONES[tone]

  const selectPreset = (range: DateRange) => {
    onDateChange(range)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-11 w-full justify-start gap-2.5 rounded-lg bg-white px-4 font-medium text-foreground',
            t.border,
            t.hover,
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className={cn('size-4 shrink-0', t.icon)} />
          <span className="truncate text-sm">{formatDateRange(date) ?? 'เลือกช่วงวันที่'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-auto p-0 bg-white shadow-lg', t.border)}
        align="start"
        side="bottom"
      >
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
        <Separator className={t.separator} />
        <div className="flex gap-2 p-3">
          <Button
            size="sm"
            variant="outline"
            className={cn('flex-1 text-xs', t.border, t.hover)}
            onClick={() => {
              const now = new Date()
              selectPreset({ from: startOfMonth(now), to: endOfMonth(now) })
            }}
          >
            เดือนนี้
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn('flex-1 text-xs', t.border, t.hover)}
            onClick={() => {
              const now = new Date()
              selectPreset({ from: subDays(now, 6), to: now })
            }}
          >
            7 วันล่าสุด
          </Button>
          <Button
            size="sm"
            className={cn('flex-1 text-xs text-white', t.primary)}
            onClick={() => setOpen(false)}
          >
            เสร็จสิ้น
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
