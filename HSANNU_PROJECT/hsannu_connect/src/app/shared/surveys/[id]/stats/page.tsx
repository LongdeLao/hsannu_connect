"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { API_URL } from "@/config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface VoteOption {
  id: number
  sub_vote_id?: number
  text: string
  has_custom_input?: boolean
  vote_count?: number
}

interface SubVote {
  id: number
  event_id?: number
  title: string
  description?: string
  options?: VoteOption[]
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
}

interface OptionStat {
  option_id: number
  text: string
  vote_count: number
  percentage: number
  has_custom_input: boolean
  custom_inputs?: string[]
}

interface SubVoteStats {
  sub_vote_id: number
  title: string
  description: string
  total_votes: number
  option_stats: OptionStat[]
}

function formatDate(input: string): string {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString()
}

function formatPercentDisplay(value: number): string {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  // Show at most 1 decimal, but drop trailing .0
  const s = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(clamped)
  return s
}

export default function SurveyStatsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id

  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<VotingEvent | null>(null)
  const [stats, setStats] = useState<SubVoteStats[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user")
      if (stored) {
        const parsed = JSON.parse(stored) as { id?: number | null }
        setUserId(parsed?.id ?? null)
      } else {
        setUserId(null)
      }
    } catch {
      setUserId(null)
    }
  }, [])

  useEffect(() => {
    const run = async () => {
      if (!id || !userId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const [eventResp, statsResp] = await Promise.all([
          fetch(`${API_URL}/api/voting/events/${id}?user_id=${userId}`, { cache: "no-store" }),
          fetch(`${API_URL}/api/voting/statistics/${id}`, { cache: "no-store" }),
        ])

        if (!eventResp.ok) {
          const txt = await eventResp.text()
          throw new Error(txt || `Event request failed: ${eventResp.status}`)
        }
        if (!statsResp.ok) {
          const txt = await statsResp.text()
          throw new Error(txt || `Stats request failed: ${statsResp.status}`)
        }

        const data = (await eventResp.json()) as VotingEvent
        const statsData = (await statsResp.json()) as SubVoteStats[]

        setEvent(data)
        setStats(statsData)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load stats"
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [id, userId])

  const isOrganizer = useMemo(() => (event && userId != null ? event.organizer_id === userId : false), [event, userId])

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    setError(null)
    try {
      const resp = await fetch(`${API_URL}/api/voting/events/${id}`, { method: "DELETE" })
      if (!resp.ok) {
        const txt = await resp.text()
        throw new Error(txt || "Failed to delete event")
      }
      router.push("/shared/surveys")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete"
      setError(msg)
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="space-y-3">
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
          <div className="h-5 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-40 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          <div className="text-sm font-medium">{error}</div>
        </div>
      </div>
    )
  }

  if (!event) return null

  if (!isOrganizer) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-yellow-700 dark:text-yellow-400">
          <div className="text-sm font-medium">You do not have access to this analytics page.</div>
        </div>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => router.push(`/shared/surveys/${id}`)}>Back to survey</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete survey
          </Button>
          <Badge variant="secondary">Analytics</Badge>
        </div>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{event.title} — Results</h1>
        {event.description && (
          <p className="mt-1 text-muted-foreground">{event.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div>
            Deadline: <span className="font-medium text-foreground">{formatDate(event.deadline)}</span>
          </div>
          {typeof event.vote_count === "number" && typeof event.total_votes === "number" && (
            <div>
              Participation: <span className="font-medium text-foreground">{event.vote_count}/{event.total_votes}</span>
            </div>
          )}
        </div>
      </header>

      <Separator />

      <section className="mt-6 space-y-6">
        {stats.map((sv) => (
          <Card key={sv.sub_vote_id}>
            <CardHeader>
              <CardTitle className="text-base">{sv.title}</CardTitle>
              {sv.description && <CardDescription>{sv.description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-3">
              {sv.option_stats.map((o) => {
                const pct = o.percentage ?? 0
                const key = `${sv.sub_vote_id}-${o.option_id}`
                const hasCustoms = o.has_custom_input && (o.custom_inputs?.length ?? 0) > 0
                const expanded = expandedKeys[key]
                const preview = (o.custom_inputs ?? []).slice(0, 3)
                const remainder = (o.custom_inputs ?? []).slice(3)
                return (
                  <div key={o.option_id} className="text-xs">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate">{o.text}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground tabular-nums">{o.vote_count}</span>
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums">
                          {formatPercentDisplay(pct)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-md bg-muted">
                      <div className="h-3 bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    {hasCustoms && (
                      <div className="mt-2 space-y-1">
                        <div className="text-[11px] font-medium text-muted-foreground">
                          Custom responses ({o.custom_inputs!.length})
                        </div>
                        {(expanded ? o.custom_inputs! : preview).map((txt, idx) => (
                          <div key={`${key}-${idx}`} className="rounded-md border bg-muted/30 px-2 py-1 text-[11px] leading-5 text-muted-foreground">
                            {txt}
                          </div>
                        ))}
                        {remainder.length > 0 && !expanded && (
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => toggleExpanded(key)}>
                            Show {remainder.length} more
                          </Button>
                        )}
                        {expanded && (
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => toggleExpanded(key)}>
                            Hide
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {sv.option_stats.length === 0 && (
                <div className="text-xs text-muted-foreground">No options</div>
              )}
            </CardContent>
          </Card>
        ))}
        {stats.length === 0 && (
          <div className="text-sm text-muted-foreground">No questions found</div>
        )}
      </section>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]" title="Delete survey">
          <DialogHeader>
            <DialogTitle>Delete survey</DialogTitle>
            <DialogDescription>
              This will permanently remove the survey and all votes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 