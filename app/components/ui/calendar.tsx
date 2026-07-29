"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/app/lib/utils"
import { Button, buttonVariants } from "@/app/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-3 rounded-lg w-full",
        className
      )}
      classNames={{
        months: "flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "space-x-1 flex items-center absolute inset-x-0 top-0",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-white p-0 hover:bg-emerald-50 border-emerald-200"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex gap-1",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-semibold text-[0.75rem] text-center py-2",
        row: "flex w-full mt-2 gap-1",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-emerald-50 [&:has([aria-selected])]:bg-emerald-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-sm hover:bg-emerald-50 rounded-md aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white focus:bg-emerald-600 focus:text-white",
        day_today: "bg-emerald-100 text-emerald-900 font-semibold",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-emerald-50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-emerald-50 aria-selected:text-foreground rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <ChevronLeftIcon className="h-4 w-4 text-emerald-600" />
        ),
        IconRight: ({ ...props }) => (
          <ChevronRightIcon className="h-4 w-4 text-emerald-600" />
        ),
      }}
      {...props}
    />
  )
}

export { Calendar }
