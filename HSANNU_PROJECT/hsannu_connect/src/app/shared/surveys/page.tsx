"use client"

import React from "react"

import { X, ChevronRight, Home } from "lucide-react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { API_URL } from "@/config"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { UnifiedDatePicker, UnifiedDateTimeValue } from "@/components/unified-date-picker"

// Types aligned with server API
interface VoteOption {
  id: number
  sub_vote_id?: number
  subVoteId?: number
  text: string
  has_custom_input?: boolean
  hasCustomInput?: boolean
  vote_count?: number
  created_at?: string
}

interface SubVote {
  id: number
  event_id?: number
  eventId?: number
  title: string
  description?: string
  created_at?: string
  options?: VoteOption[]
  user_vote?: {
    id: number
    user_id: number
    sub_vote_id: number
    option_id: number
    custom_input?: string
    created_at?: string
  } | null
}

interface VotingEvent {
  id: number
  title: string
  description?: string
  deadline: string
  status: string
  organizer_id?: number
  organizer_name?: string
  organizer_role?: string
  vote_count?: number
  total_votes?: number
  created_at?: string
  sub_votes?: SubVote[]
  subVotes?: SubVote[]
}

type TabKey = "all" | "pending" | "completed"

interface NewOptionForm {
  text: string
  hasCustomInput: boolean
}

interface NewSubVoteForm {
  title: string
  description?: string
  options: NewOptionForm[]
  customInputOnly?: boolean
}

interface NewSurveyForm {
  title: string
  description?: string
  subVotes: NewSubVoteForm[]
}

function formatDate(input: string): string {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString()
}

function isDeadlinePassed(deadline: string): boolean {
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) return false
  return Date.now() > d.getTime()
}

export default function SurveysPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<VotingEvent[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>("pending")

  // Load user id from storage
  const [userId, setUserId] = useState<number | null>(null)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user")
      if (stored) {
        const parsed = JSON.parse(stored) as { id?: number | null }
        setUserId(parsed?.id ?? null)
      }
    } catch {
      setUserId(null)
    }
  }, [])

  const loadEvents = useCallback(async (uid: number) => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API_URL}/api/voting/events?user_id=${uid}`, { cache: "no-store" })
      if (!resp.ok) {
        const txt = await resp.text()
        throw new Error(txt || `Request failed: ${resp.status}`)
      }
      const data = (await resp.json()) as VotingEvent[]
      setEvents(Array.isArray(data) ? data : [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load surveys"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch events when we have a userId
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    void loadEvents(userId)
  }, [userId, loadEvents])

  // Create survey dialog + form state
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<NewSurveyForm>({
    title: "",
    description: "",
    subVotes: [
      {
        title: "",
        description: "",
        options: [
          { text: "", hasCustomInput: false },
          { text: "", hasCustomInput: false },
        ],
        customInputOnly: false,
      },
    ],
  })

  // unified deadline state handled by UnifiedDatePicker
  const [deadlineUnified, setDeadlineUnified] = useState<UnifiedDateTimeValue>({ date: new Date() })

  function updateForm<K extends keyof NewSurveyForm>(key: K, value: NewSurveyForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateSubVote(index: number, patch: Partial<NewSubVoteForm>) {
    setForm((prev) => {
      const subVotes = prev.subVotes.map((sv, i) => (i === index ? { ...sv, ...patch } : sv))
      return { ...prev, subVotes }
    })
  }

  function addSubVote() {
    setForm((prev) => ({
      ...prev,
      subVotes: [
        ...prev.subVotes,
        { title: "", description: "", options: [ { text: "", hasCustomInput: false }, { text: "", hasCustomInput: false } ], customInputOnly: false },
      ],
    }))
  }

  function removeSubVote(index: number) {
    setForm((prev) => ({ ...prev, subVotes: prev.subVotes.filter((_, i) => i !== index) }))
  }

  function updateOption(subIndex: number, optIndex: number, patch: Partial<NewOptionForm>) {
    setForm((prev) => {
      const subVotes = prev.subVotes.map((sv, i) => {
        if (i !== subIndex) return sv
        const options = sv.options.map((opt, j) => (j === optIndex ? { ...opt, ...patch } : opt))
        return { ...sv, options }
      })
      return { ...prev, subVotes }
    })
  }

  function addOption(subIndex: number) {
    setForm((prev) => {
      const subVotes = prev.subVotes.map((sv, i) =>
        i === subIndex ? { ...sv, options: [...sv.options, { text: "", hasCustomInput: false }] } : sv,
      )
      return { ...prev, subVotes }
    })
  }

  function removeOption(subIndex: number, optIndex: number) {
    setForm((prev) => {
      const subVotes = prev.subVotes.map((sv, i) => {
        if (i !== subIndex) return sv
        return { ...sv, options: sv.options.filter((_, j) => j !== optIndex) }
      })
      return { ...prev, subVotes }
    })
  }

  const handleCreate = useCallback(async () => {
    if (!userId) return
    setCreating(true)
    try {
      // Build ISO deadline from unified picker
      let deadlineISO = ""
      if (deadlineUnified.date) {
        const d = deadlineUnified.date
        const [hours, minutes, seconds] = (() => {
          if (!deadlineUnified.time) return [23, 59, 0]
          const parts = deadlineUnified.time.split(":").map((n) => parseInt(n, 10))
          return [parts[0] || 0, parts[1] || 0, parts[2] || 0] as const
        })()
        const utcDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes, seconds))
        deadlineISO = utcDate.toISOString()
      }
      const payload = {
        title: form.title,
        description: form.description,
        deadline: deadlineISO,
        status: "active",
        sub_votes: form.subVotes.map((sv) => ({
          title: sv.title,
          description: sv.description,
          options: sv.options.map((opt) => ({ text: opt.text, has_custom_input: opt.hasCustomInput })),
        })),
      }

      const resp = await fetch(`${API_URL}/api/voting/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-ID": String(userId),
        },
        body: JSON.stringify(payload),
      })
      if (!resp.ok) {
        const txt = await resp.text()
        throw new Error(txt || `Failed to create survey: ${resp.status}`)
      }

      setCreateOpen(false)
      // reset form
      setForm({
        title: "",
        description: "",
        subVotes: [
          { title: "", description: "", options: [ { text: "", hasCustomInput: false }, { text: "", hasCustomInput: false } ], customInputOnly: false },
        ],
      })
      setDeadlineUnified({ date: new Date() })

      await loadEvents(userId)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Failed to create survey")
    } finally {
      setCreating(false)
    }
  }, [form, userId, loadEvents, deadlineUnified])

  // Default tab selection
  const normalizedEvents: VotingEvent[] = useMemo(() => {
    return events.map((e) => ({
      ...e,
      subVotes: (e.sub_votes ?? e.subVotes ?? []).map((sv) => ({ ...sv })),
    }))
  }, [events])

  const pending = useMemo(() =>
    normalizedEvents.filter((e) => e.status === "active" && !isDeadlinePassed(e.deadline)),
  [normalizedEvents])
  const completed = useMemo(() =>
    normalizedEvents.filter((e) => e.status !== "active" || isDeadlinePassed(e.deadline)),
  [normalizedEvents])

  useEffect(() => {
    // Default tab: pending if any, else all
    if (pending.length > 0) setActiveTab("pending")
    else setActiveTab("all")
  }, [pending.length])

  return (
    <div className="p-6">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/shared" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Surveys</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Surveys</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Vote on ongoing surveys or review completed ones
              </p>
            </div>
            <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { if (confirm('Discard this survey? Your changes will be lost.')) setCreateOpen(false); } else { setCreateOpen(true); } }}>
              <Button size="sm" onClick={() => setCreateOpen(true)}>Create new survey</Button>
              <DialogContent 
                title="Create new survey"
                onEscapeKeyDown={(e) => e.preventDefault()} 
                onPointerDownOutside={(e) => e.preventDefault()} 
                className="h-[85vh] w-full max-w-xl overflow-hidden p-0 flex flex-col"
              >
                <DialogHeader className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur">
                  <Button size="icon" variant="ghost" className="absolute right-2 top-2" onClick={() => { if (confirm('Discard this survey? Your changes will be lost.')) setCreateOpen(false) }}>
                    <X className="size-5" />
                  </Button>
                  <DialogTitle>Create new survey</DialogTitle>
                  <DialogDescription>Define the survey and its questions and options.</DialogDescription>
                </DialogHeader>
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Survey title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Description</Label>
                    <Input id="desc" value={form.description ?? ""} onChange={(e) => updateForm("description", e.target.value)} placeholder="Short description" />
                  </div>
                  <div className="space-y-2">
                    <UnifiedDatePicker
                      label="Deadline"
                      required
                      value={deadlineUnified}
                      onChange={setDeadlineUnified}
                      description={deadlineUnified.date ? `The survey will close on ${deadlineUnified.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}` : "Pick a deadline for your survey"}
                    />
                  </div>

                  {form.subVotes.map((sv, i) => (
                    <div key={i} className="rounded-md border p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-sm font-medium">Question {i + 1}</div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => addOption(i)} disabled={Boolean(sv.customInputOnly)}>Add option</Button>
                          <Button size="sm" variant="ghost" onClick={() => removeSubVote(i)} disabled={form.subVotes.length === 1}>Remove</Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={sv.title} onChange={(e) => updateSubVote(i, { title: e.target.value })} />
                      </div>
                      <div className="mt-2 space-y-2">
                        <Label>Description</Label>
                        <Input value={sv.description ?? ""} onChange={(e) => updateSubVote(i, { description: e.target.value })} />
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-muted-foreground">Options</div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`cio-${i}`}
                              checked={Boolean(sv.customInputOnly)}
                              onCheckedChange={(v) =>
                                updateSubVote(i, {
                                  customInputOnly: Boolean(v),
                                  options: Boolean(v)
                                    ? [ { text: "", hasCustomInput: true } ]
                                    : [ { text: "", hasCustomInput: false }, { text: "", hasCustomInput: false } ],
                                })
                              }
                            />
                            <Label htmlFor={`cio-${i}`} className="text-xs">Custom input only</Label>
                          </div>
                        </div>
                        {sv.customInputOnly ? (
                          <div className="flex items-center gap-2">
                            <Input className="flex-1" value="" placeholder="Respondents will type their own answer" disabled />
                            <div className="text-xs text-muted-foreground whitespace-nowrap">Single free-text response</div>
                          </div>
                        ) : (
                        <div className="flex flex-col gap-2">
                          {sv.options.map((opt, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <Input className="flex-1" value={opt.text} onChange={(e) => updateOption(i, j, { text: e.target.value })} placeholder={opt.hasCustomInput ? "User will type their own answer" : `Option ${j + 1}`} disabled={opt.hasCustomInput} />
                              <div className="flex items-center gap-1">
                                <Checkbox id={`ci-${i}-${j}`} checked={opt.hasCustomInput} onCheckedChange={(v) => updateOption(i, j, { hasCustomInput: Boolean(v) })} />
                                <Label htmlFor={`ci-${i}-${j}`} className="text-xs">Allow custom answer</Label>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => removeOption(i, j)} disabled={sv.options.length <= 2}>Remove</Button>
                            </div>
                          ))}
                        </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div>
                    <Button size="sm" variant="outline" onClick={addSubVote}>Add question</Button>
                  </div>
                </div>
                <DialogFooter className="sticky bottom-0 z-10 border-t bg-background/80 px-6 py-4 backdrop-blur">
                  <Button onClick={handleCreate} disabled={creating || !form.title.trim() || !deadlineUnified.date}>{creating ? "Creating..." : "Create survey"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as TabKey)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <div className="mt-4" />

          {loading ? (
            <LoadingGrid />
          ) : error ? (
            <ErrorState message={error} />
          ) : (
            <>
              <TabsContent value="pending" className="m-0">
                {pending.length === 0 ? (
                  <EmptyState title="No pending surveys" subtitle="You're all caught up. Check back later." />
                ) : (
                  <CardsGrid items={pending} />
                )}
              </TabsContent>

              <TabsContent value="completed" className="m-0">
                {completed.length === 0 ? (
                  <EmptyState title="No completed surveys" subtitle="Once a survey ends, it will appear here." />
                ) : (
                  <CardsGrid items={completed} />
                )}
              </TabsContent>

              <TabsContent value="all" className="m-0">
                {normalizedEvents.length === 0 ? (
                  <EmptyState title="No surveys available" subtitle="There are currently no surveys to show." />
                ) : (
                  <CardsGrid items={normalizedEvents} />
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden border-0 shadow-none bg-transparent">
          <CardHeader>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-5 w-20" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg p-10 text-center">
      <h3 className="text-lg font-medium">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-destructive/5 p-4 text-destructive">
      <div className="text-sm font-medium">Failed to load surveys</div>
      <div className="text-sm opacity-90">{message}</div>
    </div>
  )
}

function CardsGrid({ items }: { items: VotingEvent[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((ev) => (
        <SurveyCard key={ev.id} event={ev} />
      ))}
    </div>
  )
}

function SurveyCard({ event }: { event: VotingEvent }) {
  const deadlinePassed = isDeadlinePassed(event.deadline)
  const isActive = event.status === "active" && !deadlinePassed
  const subVotes = event.subVotes ?? event.sub_votes ?? []

  return (
    <Card className="flex h-full flex-col overflow-hidden border-0 shadow-none bg-transparent">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="line-clamp-1 text-base">{event.title}</CardTitle>
          <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Closed"}</Badge>
        </div>
        {event.description && (
          <CardDescription className="line-clamp-2">{event.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="grow space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Questions</span>
          <span className="font-medium text-foreground">{subVotes.length}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Deadline</span>
          <span className="font-medium text-foreground">{formatDate(event.deadline)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
                          <Link href={`/shared/surveys/${event.id}`}>
          <Button size="sm" variant={isActive ? "default" : "outline"}>
            {isActive ? "Open" : "View"}
          </Button>
        </Link>
        {typeof event.vote_count === "number" && typeof event.total_votes === "number" ? (
          <span className="text-xs text-muted-foreground">
            {event.vote_count}/{event.total_votes} participated
          </span>
        ) : null}
      </CardFooter>
    </Card>
  )
} 