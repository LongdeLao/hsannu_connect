"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { NLPDatePicker } from "@/components/nlp-date-picker"
import { getDateInputMode, DateInputMode } from "@/lib/preferences"

export interface UnifiedDateTimeValue {
	date?: Date
	time?: string // HH:mm[:ss]
}

interface UnifiedDatePickerProps {
	mode?: DateInputMode
	value?: UnifiedDateTimeValue
	onChange?: (next: UnifiedDateTimeValue) => void
	label?: string
	description?: string
	required?: boolean
}

export function UnifiedDatePicker({
	mode,
	value,
	onChange,
	label = "Date",
	description,
	required,
}: UnifiedDatePickerProps) {
	const resolvedMode = mode ?? getDateInputMode()
	const [date, setDate] = React.useState<Date | undefined>(value?.date)
	const [time, setTime] = React.useState<string>(value?.time ?? "")

	React.useEffect(() => {
		setDate(value?.date)
		setTime(value?.time ?? "")
	}, [value?.date, value?.time])

	const handleDate = (d?: Date) => {
		setDate(d)
		onChange?.({ date: d, time })
	}
	const handleTime = (t: string) => {
		setTime(t)
		onChange?.({ date, time: t })
	}

	if (resolvedMode === "nlp") {
		return (
			<div className="space-y-2">
				<NLPDatePicker
					value={date ? date.toDateString() : undefined}
					onDateChange={(d) => handleDate(d ?? undefined)}
					placeholder="Tomorrow, next Friday, in 2 weeks..."
					label={label}
					description={description}
				/>
				<div className="space-y-2">
					<Label className="text-xs flex items-center gap-2"><Clock className="h-3.5 w-3.5"/>Time</Label>
					<Input type="time" step="1" value={time} onChange={(e) => handleTime(e.target.value)} className="w-[160px]" />
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-2">
			{label && <Label>{label}{required ? " *" : ""}</Label>}
			<div className="flex items-center gap-2">
				<Popover>
					<PopoverTrigger asChild>
						<Button type="button" variant="outline" className="justify-between w-40">
							{date ? date.toLocaleDateString() : "Select date"}
							<CalendarIcon className="ml-2 h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto overflow-hidden p-0" align="start">
						<Calendar 
							mode="single" 
							selected={date} 
							onSelect={handleDate} 
							className="rounded-md border shadow-sm" 
							captionLayout="dropdown" 
						/>
					</PopoverContent>
				</Popover>
				<Input type="time" step="1" value={time} onChange={(e) => handleTime(e.target.value)} className="w-[160px]" />
			</div>
			{description && <div className="text-muted-foreground text-xs">{description}</div>}
		</div>
	)
} 