"use client"

import * as React from "react"
import { parseDate } from "chrono-node"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

interface NLPDatePickerProps {
  value?: string
  onValueChange?: (value: string) => void
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  label?: string
  description?: string
}

export function NLPDatePicker({
  value: controlledValue,
  onValueChange,
  onDateChange,
  placeholder = "Tomorrow or next week",
  label = "Schedule Date",
  description,
}: NLPDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(controlledValue || "In 2 days")
  const [date, setDate] = React.useState<Date | undefined>(
    parseDate(controlledValue || value) || undefined
  )
  const [month, setMonth] = React.useState<Date | undefined>(date)

  const handleValueChange = (newValue: string) => {
    setValue(newValue)
    onValueChange?.(newValue)
    
    const parsedDate = parseDate(newValue)
    if (parsedDate) {
      setDate(parsedDate)
      setMonth(parsedDate)
      onDateChange?.(parsedDate)
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    const formattedDate = formatDate(selectedDate)
    setValue(formattedDate)
    onValueChange?.(formattedDate)
    onDateChange?.(selectedDate)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="date" className="px-1">
        {label}
      </Label>
      <div className="relative flex gap-2">
        <Input
          id="date"
          value={value}
          placeholder={placeholder}
          className="bg-background pr-10"
          onChange={(e) => handleValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-picker"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              className="rounded-md border shadow-sm"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
      {description && (
        <div className="text-muted-foreground px-1 text-sm">
          {description.replace("{date}", formatDate(date))}
        </div>
      )}
    </div>
  )
} 
 