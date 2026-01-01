export type TimetableEvent = {
  day: number // 0 = Monday, 6 = Sunday
  start: string // HH:MM 24h
  end: string // HH:MM 24h
  title: string
  location?: string
  colorClassName?: string
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function WeeklyTimetable({
  events = [],
  startHour = 8,
  endHour = 18,
}: {
  events?: TimetableEvent[]
  startHour?: number
  endHour?: number
}) {
  const hours = Array.from({ length: Math.max(1, endHour - startHour) }, (_, i) => startHour + i)

  return (
    <div className="relative w-full overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-8 border-b bg-muted/30">
        <div className="p-3 text-xs font-medium text-muted-foreground">Time</div>
        {DAYS.map((d) => (
          <div key={d} className="p-3 text-center text-xs font-semibold text-foreground">
            {d}
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="grid grid-cols-8">
          {/* time gutter */}
          <div className="relative">
            {hours.map((h) => (
              <div
                key={h}
                className="flex h-16 items-start justify-end pr-2 text-[10px] text-muted-foreground"
              >
                <span className="translate-y-[-0.5rem]">{String(h).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>

          {/* day columns */}
          {DAYS.map((_, dayIdx) => (
            <div key={dayIdx} className="relative">
              {hours.map((h) => (
                <div key={h} className="h-16 border-l border-t last:border-b border-muted/40" />
              ))}
            </div>
          ))}
        </div>

        {/* events layer */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-8">
          <div />
          {DAYS.map((_, dayIdx) => (
            <div key={dayIdx} className="relative">
              {events
                .filter((e) => e.day === dayIdx)
                .map((e, i) => {
                  const totalMinutes = (endHour - startHour) * 60
                  const startMins = Math.max(0, toMinutes(e.start) - startHour * 60)
                  const endMins = Math.min(totalMinutes, toMinutes(e.end) - startHour * 60)
                  const topPct = (startMins / totalMinutes) * 100
                  const heightPct = Math.max(4, ((endMins - startMins) / totalMinutes) * 100)

                  return (
                    <div
                      key={`${e.title}-${i}`}
                      className={`pointer-events-auto absolute left-1 right-1 overflow-hidden rounded-md border text-xs shadow-sm ${e.colorClassName || "bg-primary/10 border-primary/30"}`}
                      style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                    >
                      <div className="flex items-center justify-between gap-2 p-2">
                        <div className="font-medium text-foreground/90 truncate">{e.title}</div>
                        <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {e.start}–{e.end}
                        </div>
                      </div>
                      {e.location && (
                        <div className="px-2 pb-2 text-[10px] text-muted-foreground truncate">{e.location}</div>
                      )}
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
      </div>

      {(!events || events.length === 0) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="text-center space-y-7">
            <span className="rounded-full bg-primary px-6 py-3 text-center text-xl font-bold tracking-tight text-primary-foreground sm:text-2xl">
              {"SCHOOL DIDN'T EVEN START YET 😄"}
            </span>
           
          </div>
        </div>
      )}
    </div>
  )
} 