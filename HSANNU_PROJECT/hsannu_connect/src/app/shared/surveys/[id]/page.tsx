"use client"

import React, { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import { API_URL } from "@/config"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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

interface UserVote {
  id: number
  user_id: number
  sub_vote_id: number
  option_id: number
  custom_input?: string
}

interface SubVote {
  id: number
  event_id?: number
  title: string
  description?: string
  options?: VoteOption[]
  user_vote?: UserVote | null
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

type Selection = { optionId: number; customInput: string }
 
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

export default function SurveyDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id

  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<VotingEvent | null>(null)
  const [selections, setSelections] = useState<Record<number, Selection>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)

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
        const resp = await fetch(`${API_URL}/api/voting/events/${id}?user_id=${userId}`, { cache: "no-store" })
        if (!resp.ok) {
          const txt = await resp.text()
          throw new Error(txt || `Request failed: ${resp.status}`)
        }
        const data = (await resp.json()) as VotingEvent
        setEvent(data)
        // Seed selections from existing user votes
        const seeded: Record<number, Selection> = {}
        for (const sv of data.sub_votes ?? []) {
          if (sv.user_vote) {
            seeded[sv.id] = {
              optionId: sv.user_vote.option_id,
              customInput: sv.user_vote.custom_input ?? "",
            }
          }
        }
        setSelections(seeded)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load survey"
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [id, userId])

  useEffect(() => {
    setMounted(true)
  }, [])

  const deadlinePassed = useMemo(() => (event ? isDeadlinePassed(event.deadline) : false), [event])
  const isActive = useMemo(() => (event ? event.status === "active" && !deadlinePassed : false), [event, deadlinePassed])
  const isOrganizer = useMemo(() => (event && userId != null ? event.organizer_id === userId : false), [event, userId])

  const setSelection = (subVoteId: number, optionId: number) => {
    setSelections((prev) => ({
      ...prev,
      [subVoteId]: {
        optionId,
        customInput: prev[subVoteId]?.customInput ?? "",
      },
    }))
  }

  const setCustomInput = (subVoteId: number, value: string) => {
    setSelections((prev) => ({
      ...prev,
      [subVoteId]: {
        optionId: prev[subVoteId]?.optionId ?? 0,
        customInput: value,
      },
    }))
  }

  const submitAll = async () => {
    if (!event || !userId) return
    setSubmitting(true)
    setError(null)
    try {
      const requests: Promise<Response>[] = []
      for (const sv of event.sub_votes ?? []) {
        const sel = selections[sv.id]
        if (!sel || !sel.optionId) continue
        requests.push(
          fetch(`${API_URL}/api/voting/vote`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-ID": String(userId),
            },
            body: JSON.stringify({
              sub_vote_id: sv.id,
              option_id: sel.optionId,
              custom_input: sel.customInput || undefined,
            }),
          })
        )
      }

      const results = await Promise.all(requests)
      const firstError = results.find((r) => !r.ok)
      if (firstError) {
        const txt = await firstError.text()
        throw new Error(txt || `Failed to submit some votes`)
      }

      // Refresh event
      const refreshed = await fetch(`${API_URL}/api/voting/events/${id}?user_id=${userId}`, { cache: "no-store" })
      if (refreshed.ok) {
        const data = (await refreshed.json()) as VotingEvent
        setEvent(data)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to submit"
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

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

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="space-y-3">
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
          <div className="h-5 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-0 shadow-none bg-transparent">
              <CardHeader>
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-muted" />
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
        <div className="rounded-lg bg-destructive/5 p-4 text-destructive">
          <div className="text-sm font-medium">{error}</div>
        </div>
      </div>
    )
  }

  if (!event) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-5xl px-4 py-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          {isOrganizer && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              Delete survey
            </Button>
          )}
          {isOrganizer && (
            <Button size="sm" onClick={() => router.push(`/shared/surveys/${id}/stats`)}>
              View analytics
            </Button>
          )}
          <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Closed"}</Badge>
        </div>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
        {event.description && (
          <p className="mt-1 text-muted-foreground">{event.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div>
            Deadline: <span className="font-medium text-foreground">{formatDate(event.deadline)}</span>
          </div>
          {event.organizer_name && (
            <div>
              Posted by: <span className="font-medium text-foreground">{event.organizer_name}</span>
              {event.organizer_role ? (
                <span className="ml-1 text-muted-foreground">({event.organizer_role})</span>
              ) : null}
            </div>
          )}
          {typeof event.vote_count === "number" && typeof event.total_votes === "number" && (
            <div>
              Participation: <span className="font-medium text-foreground">{event.vote_count}/{event.total_votes}</span>
            </div>
          )}
        </div>
      </header>

      <Separator />

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {(event.sub_votes ?? []).map((sv) => {
          const selected = selections[sv.id]?.optionId ?? 0
          const totalVotesForSv = (sv.options ?? []).reduce((sum, o) => sum + (o.vote_count ?? 0), 0)
          return (
            <Card key={sv.id} className="h-full border-0 shadow-none bg-transparent">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">{sv.title}</CardTitle>
                {sv.description && (
                  <CardDescription>{sv.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label={sv.title}>
                  {(sv.options ?? []).map((opt) => {
                    const active = selected === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => isActive && setSelection(sv.id, opt.id)}
                        disabled={!isActive}
                        className={[
                          "flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                          active ? "bg-primary/5" : "hover:bg-muted",
                          !isActive ? "opacity-60" : "",
                        ].join(" ")}
                      >
                        <span
                          aria-hidden
                          className={[
                            "inline-flex h-4 w-4 items-center justify-center rounded-full",
                            active ? "ring-2 ring-primary" : "ring-1 ring-muted-foreground/40",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "block h-2.5 w-2.5 rounded-full",
                              active ? "bg-primary" : "bg-transparent",
                            ].join(" ")}
                          />
                        </span>
                        <span className="text-sm">{opt.text}</span>
                      </button>
                    )
                  })}
                </div>

                {selected !== 0 && (sv.options ?? []).find((o) => o.id === selected)?.has_custom_input && (
                  <div className="pt-2">
                    <label className="mb-1 block text-xs text-muted-foreground">Additional details</label>
                    <Input
                      value={selections[sv.id]?.customInput ?? ""}
                      onChange={(e) => setCustomInput(sv.id, e.target.value)}
                      placeholder="Type here..."
                      disabled={!isActive}
                    />
                  </div>
                )}


              </CardContent>
              <CardFooter className="justify-end">
                {sv.user_vote && (
                  <span className="text-xs text-muted-foreground">Your last vote: option #{sv.user_vote.option_id}</span>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </section>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {Object.values(selections).filter((s) => s.optionId).length} selection(s) ready
        </div>
        <Button onClick={submitAll} disabled={!isActive || submitting}>
          {submitting ? "Submitting..." : isActive ? "Submit Votes" : "Voting Closed"}
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
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
    </motion.div>
  )
} 