"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { API_URL } from "@/config"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconMessageCircle, IconSearch, IconSend, IconPlus, IconLoader2, IconX, IconChecks, IconChevronDown } from "@tabler/icons-react"
import { Virtuoso, VirtuosoHandle } from "react-virtuoso"

interface ChatUser {
  id: number
  first_name?: string
  last_name?: string
  name?: string
  role?: string
  avatar_url?: string
}

interface LatestMessage {
  id: number
  sender_id: number
  sender: string
  content: string
  created_at: string
  read: boolean
}

interface Conversation {
  id: number
  created_at: string
  participants: ChatUser[]
  unread_count: number
  latest_message: LatestMessage | null
}

interface Message {
  id: number
  conversation_id: number
  sender_id: number
  sender_name: string
  content: string
  created_at: string
  read: boolean
}

function getDisplayName(user: ChatUser): string {
  if (user.name && user.name.trim().length > 0) return user.name
  const first = user.first_name || ""
  const last = user.last_name || ""
  const combined = `${first} ${last}`.trim()
  return combined || `User ${user.id}`
}

function useCurrentUserId(): number | null {
  const [userId, setUserId] = useState<number | null>(null)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user")
      if (stored) {
        const parsed = JSON.parse(stored) as { id?: number | string | null }
        if (parsed?.id != null) {
          const idNum = typeof parsed.id === "string" ? parseInt(parsed.id, 10) : parsed.id
          if (!Number.isNaN(idNum)) setUserId(idNum)
        }
      }
    } catch {
      // ignore
    }
  }, [])
  return userId
}

export default function ChatPage() {
  const userId = useCurrentUserId()

  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filtered, setFiltered] = useState<Conversation[]>([])
  const [search, setSearch] = useState("")

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [sending, setSending] = useState(false)
  const [fetchingMessages, setFetchingMessages] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const [unseenCount, setUnseenCount] = useState(0)

  const [searching, setSearching] = useState(false)
  const [messagesCache, setMessagesCache] = useState<Record<number, Message[]>>({})

  const listPollRef = useRef<number | null>(null)
  const msgPollRef = useRef<number | null>(null)
  const virtuosoRef = useRef<VirtuosoHandle | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const prevMsgCountRef = useRef(0)
  const searchTimeoutRef = useRef<number | null>(null)
  const searchRunIdRef = useRef(0)

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId]
  )

  const otherParticipantName = useMemo(() => {
    if (!selectedConversation || userId == null) return ""
    const others = selectedConversation.participants
    if (!others || others.length === 0) return ""
    return getDisplayName(others[0])
  }, [selectedConversation, userId])

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 144) + "px"
  }, [messageInput])

  // Track unseen messages when not at bottom
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && !atBottom) {
      setUnseenCount((c) => c + (messages.length - prevMsgCountRef.current))
    }
    prevMsgCountRef.current = messages.length
  }, [messages, atBottom])

  const ensureMessagesCached = useCallback(async (conversationId: number) => {
    const cached = messagesCache[conversationId]
    if (Array.isArray(cached)) return cached
    if (cached === null) return [] as Message[]
    try {
      const resp = await fetch(`${API_URL}/api/messaging/conversation/${conversationId}/messages?user_id=${userId}`)
      if (!resp.ok) throw new Error("Failed to fetch messages for search")
      const data = (await resp.json()) as { success: boolean; messages?: Message[] | null }
      if (data && data.success) {
        const arr = Array.isArray(data.messages) ? data.messages : []
        setMessagesCache((prev) => ({ ...prev, [conversationId]: arr }))
        return arr
      }
    } catch (e) {
      console.error(e)
    }
    return [] as Message[]
  }, [API_URL, userId, messagesCache])

  const loadConversations = useCallback(async (initial = false) => {
    if (userId == null) return
    try {
      if (initial) setLoading(true)
      const resp = await fetch(`${API_URL}/api/messaging/conversations/${userId}`, { cache: "no-store" })
      if (!resp.ok) throw new Error(`Failed to load conversations: ${resp.status}`)
      const data = (await resp.json()) as { success: boolean; conversations: Conversation[] }
      if (data.success) {
        const sorted = [...data.conversations].sort((a, b) => {
          const aTime = new Date(a.latest_message?.created_at || a.created_at).getTime()
          const bTime = new Date(b.latest_message?.created_at || b.created_at).getTime()
          return bTime - aTime
        })
        setConversations(sorted)
      }
    } catch (e) {
      // optional: toast
      console.error(e)
    } finally {
      if (initial) setLoading(false)
    }
  }, [userId])

  const loadMessages = useCallback(async (conversationId: number) => {
    if (userId == null || !conversationId) return
    try {
      setFetchingMessages(true)
      const resp = await fetch(`${API_URL}/api/messaging/conversation/${conversationId}/messages?user_id=${userId}`)
      if (!resp.ok) throw new Error(`Failed to load messages: ${resp.status}`)
      const data = (await resp.json()) as { success: boolean; messages: Message[] }
      if (data.success) {
        setMessages(data.messages)
      }
    } catch (e) {
      console.error(e)
      setMessages([])
    } finally {
      setFetchingMessages(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId == null) return
    void loadConversations(true)
    if (listPollRef.current) window.clearInterval(listPollRef.current)
    listPollRef.current = window.setInterval(() => void loadConversations(false), 8000)
    return () => {
      if (listPollRef.current) window.clearInterval(listPollRef.current)
    }
  }, [userId, loadConversations])

  useEffect(() => {
    if (!selectedId) return
    void loadMessages(selectedId)
    if (msgPollRef.current) window.clearInterval(msgPollRef.current)
    msgPollRef.current = window.setInterval(() => void loadMessages(selectedId), 5000)
    return () => {
      if (msgPollRef.current) window.clearInterval(msgPollRef.current)
    }
  }, [selectedId, loadMessages])

  // Replace simple name/latest search with global message-content search when query present
  useEffect(() => {
    const q = search.trim().toLowerCase()

    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current)

    if (!q) {
      setSearching(false)
      setFiltered(conversations)
      return
    }

    setSearching(true)
    const runId = ++searchRunIdRef.current

    const run = async () => {
      // First, quick pre-filter by participant name or latest message
      const prelim = conversations.filter((c) => {
        const name = getDisplayName(c.participants?.[0] || ({} as ChatUser)).toLowerCase()
        const last = (c.latest_message?.content || "").toLowerCase()
        return name.includes(q) || last.includes(q)
      })

      // Then, search message contents across remaining conversations
      const remaining = conversations.filter((c) => !prelim.includes(c))

      // Concurrency limit
      const BATCH = 6
      const found: Conversation[] = [...prelim]
      for (let i = 0; i < remaining.length; i += BATCH) {
        // If a newer search started, abort
        if (searchRunIdRef.current !== runId) return
        const batch = remaining.slice(i, i + BATCH)
        const results = await Promise.all(
          batch.map(async (c) => {
            const msgs = await ensureMessagesCached(c.id)
            const list = Array.isArray(msgs) ? msgs : []
            const has = list.some((m) => (m.content || "").toLowerCase().includes(q))
            return has ? c : null
          })
        )
        results.forEach((r) => {
          if (r) found.push(r)
        })
      }

      if (searchRunIdRef.current !== runId) return
      // Sort as usual
      const sorted = [...found].sort((a, b) => {
        const aTime = new Date(a.latest_message?.created_at || a.created_at).getTime()
        const bTime = new Date(b.latest_message?.created_at || b.created_at).getTime()
        return bTime - aTime
      })
      setFiltered(sorted)
      setSearching(false)
    }

    searchTimeoutRef.current = window.setTimeout(run, 300)

    return () => {
      if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current)
    }
  }, [search, conversations, ensureMessagesCached])

  const handleSelectConversation = (id: number) => {
    setSelectedId(id)
  }

  const handleSend = async () => {
    if (sending || !messageInput.trim() || userId == null || !selectedId) return
    try {
      setSending(true)
      const resp = await fetch(`${API_URL}/api/messaging/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: selectedId, sender_id: userId, content: messageInput.trim() }),
      })
      const data = await resp.json()
      if (!resp.ok || !data?.success) throw new Error(data?.message || "Failed to send message")

      setMessageInput("")
      // Optimistically append new message and refresh lists
      const created = data.message as Message
      setMessages((prev) => [...prev, created])
      void loadConversations(false)
      // Virtuoso will follow output automatically when at bottom
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const renderConversation = (c: Conversation) => {
    const participant = c.participants?.[0] || ({} as ChatUser)
    const name = getDisplayName(participant)
    const last = c.latest_message?.content || ""
    const active = c.id === selectedId
    const time = new Date(c.latest_message?.created_at || c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const avatarUrl = participant.avatar_url || ""
    return (
      <button
        key={c.id}
        onClick={() => {
          handleSelectConversation(c.id)
          setListOpen(false)
        }}
        className={`w-full text-left rounded-xl p-3 transition-colors ${
          active ? "bg-accent/70 ring-1 ring-accent-foreground/10" : "hover:bg-accent/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="truncate font-medium">{name}</div>
              <span className="ml-auto shrink-0 text-2xs text-muted-foreground">{time}</span>
              {c.unread_count > 0 && (
                <span className="ml-2 shrink-0 rounded-full bg-primary px-1.5 text-2xs font-medium text-primary-foreground">
                  {c.unread_count}
                </span>
              )}
            </div>
            <div className="truncate text-sm text-muted-foreground">{last}</div>
          </div>
        </div>
      </button>
    )
  }

  const renderMessage = (m: Message, index: number) => {
    const isMine = m.sender_id === userId
    const time = new Date(m.created_at)
    const prev = index > 0 ? messages[index - 1] : null
    const prevTime = prev ? new Date(prev.created_at) : null
    const prevSameSender = prev && prev.sender_id === m.sender_id
    const minutesDiff = prevTime ? (time.getTime() - prevTime.getTime()) / 60000 : Number.POSITIVE_INFINITY
    const isNewGroup = !prev || !prevSameSender || minutesDiff > 5
    const isNewDay = !prevTime || prevTime.toDateString() !== time.toDateString()

    const next = index < messages.length - 1 ? messages[index + 1] : null
    const nextTime = next ? new Date(next.created_at) : null
    const nextSameSender = next && next.sender_id === m.sender_id
    const nextMinutesDiff = nextTime ? (nextTime.getTime() - time.getTime()) / 60000 : Number.POSITIVE_INFINITY
    const isLastInGroup = !next || !nextSameSender || nextMinutesDiff > 5

    const participant = selectedConversation?.participants?.[0]
    const name = participant ? getDisplayName(participant) : ""
    const avatarUrl = participant?.avatar_url || ""

    const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    return (
      <>
        {isNewDay && (
          <div className="my-3 text-center text-2xs text-muted-foreground">
            {time.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}
          </div>
        )}
        <div className={`flex ${isMine ? "justify-end" : "justify-start"} ${isNewGroup ? "mt-2" : "mt-0.5"}`}>
          {!isMine && (
            <div className="mr-2 flex w-6 items-end justify-center">
              {isNewGroup ? (
                <Avatar className="size-6">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                  <AvatarFallback className="text-[10px]">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="size-6" />
              )}
            </div>
          )}
          <div
            className={`max-w-[72%] rounded-3xl px-3 py-2 text-sm ${
              isMine ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            <div className="whitespace-pre-wrap break-words">{m.content}</div>
            {isLastInGroup && (
              <div className={`mt-1 flex items-center gap-1 text-2xs ${isMine ? "text-primary-foreground/75" : "text-muted-foreground"} justify-end`}>
                <span>{timeStr}</span>
                {isMine && (
                  <span className="ml-1 inline-flex items-center">{m.read && <IconChecks className="size-3" />}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] w-full overflow-hidden p-2 md:p-3 lg:p-4">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md bg-muted/30">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2 p-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setListOpen(true)} title="Conversations">
              <IconMessageCircle className="size-5" />
            </Button>
            <div className="truncate font-semibold">
              {selectedConversation ? otherParticipantName : "Conversations"}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative w-40 sm:w-56 md:w-72">
                <Input
                  placeholder={`Search${searching ? " (searching...)" : ""}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 rounded-full pl-8"
                />
                <IconSearch className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
              <Button size="icon" variant="outline" title="New Chat" className="hidden md:inline-flex rounded-full">
                <IconPlus className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 min-w-0 md:grid-cols-[340px_1fr]">
          <aside className="hidden min-h-0 min-w-0 md:flex md:flex-col md:overflow-y-auto md:p-3">
            {loading ? (
              <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <IconLoader2 className="size-4 animate-spin" /> Loading conversations...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No conversations</div>
            ) : (
              <div className="flex flex-col gap-1">
                {filtered.map(renderConversation)}
              </div>
            )}
          </aside>

          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            {!selectedConversation ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
                <IconMessageCircle className="size-6" />
                <div className="text-sm">Select a conversation to start chatting</div>
              </div>
            ) : (
              <>
                <div className="relative flex-1 min-h-0 p-3 md:p-4 lg:p-5">
                  {fetchingMessages && messages.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IconLoader2 className="size-4 animate-spin" /> Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No messages yet</div>
                  ) : (
                    <Virtuoso
                      ref={virtuosoRef}
                      data={messages}
                      className="[&>*]:!px-0"
                      style={{ height: "100%" }}
                      followOutput="smooth"
                      atBottomStateChange={(b) => {
                        setAtBottom(b)
                        if (b) setUnseenCount(0)
                      }}
                      itemContent={(index, item) => renderMessage(item, index)}
                    />
                  )}
                  {!atBottom && unseenCount > 0 && (
                    <button
                      onClick={() => {
                        virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: "end", behavior: "smooth" })
                        setUnseenCount(0)
                      }}
                      className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-2xs font-medium text-primary-foreground shadow"
                      title="Jump to latest"
                    >
                      <IconChevronDown className="size-4" /> {unseenCount} new
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={textareaRef}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          void handleSend()
                        }
                      }}
                      className="min-h-[2.25rem] max-h-36 w-full resize-none overflow-hidden rounded-2xl bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <Button onClick={() => void handleSend()} disabled={sending || !messageInput.trim()} className="shrink-0 rounded-full">
                      {sending ? <IconLoader2 className="size-4 animate-spin" /> : <IconSend className="size-4" />}
                      <span className="hidden sm:inline">Send</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {listOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setListOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-background shadow-xl flex flex-col">
            <div className="flex items-center gap-2 p-3">
              <div className="font-medium">Conversations</div>
              <div className="ml-auto" />
              <Button size="icon" variant="ghost" onClick={() => setListOpen(false)}>
                <IconX className="size-5" />
              </Button>
            </div>
            <div className="p-3">
              <div className="relative">
                <Input
                  placeholder={`Search${searching ? " (searching...)" : ""}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 rounded-full pl-8"
                />
                <IconSearch className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                  <IconLoader2 className="size-4 animate-spin" /> Loading conversations...
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No conversations</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filtered.map(renderConversation)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 