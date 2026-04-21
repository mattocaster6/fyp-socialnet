'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, markAsRead } from '@/app/actions/messages'
import MessageBubble from '@/components/MessageBubble'

type Message = {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
    read_at: string | null
}

type Props = {
    currentUserId: string
    otherUserId: string
    initialMessages: Message[]
}

const GAP_MS = 10 * 60 * 1000

export default function ConversationView({ currentUserId, otherUserId, initialMessages }: Props) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [text, setText] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [, startTransition] = useTransition()

    const scrollRef = useRef<HTMLDivElement>(null)
    const composerRef = useRef<HTMLTextAreaElement>(null)

    // mark anything from the other user as read on mount, and again when they send something new
    useEffect(() => {
        markAsRead(otherUserId).catch(() => { })
    }, [otherUserId])

    // realtime subscription. filter server-side so we only get messages for this conversation.
    useEffect(() => {
        const supabase = createClient()
        let channel: ReturnType<typeof supabase.channel> | null = null
        let cancelled = false

        async function setup() {
            // make sure realtime is using the authed session, otherwise RLS blocks the events
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.access_token) {
                await supabase.realtime.setAuth(session.access_token)
            }
            if (cancelled) return

            channel = supabase
                .channel(`dm-${currentUserId}-${otherUserId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                    },
                    (payload) => {
                        const m = payload.new as Message
                        const relevant =
                            (m.sender_id === otherUserId && m.receiver_id === currentUserId) ||
                            (m.sender_id === currentUserId && m.receiver_id === otherUserId)
                        if (!relevant) return

                        setMessages(prev => {
                            if (prev.some(x => x.id === m.id)) return prev
                            return [...prev, m]
                        })

                        if (m.sender_id === otherUserId) {
                            markAsRead(otherUserId).catch(() => { })
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('[realtime]', status)
                })
        }

        setup()

        return () => {
            cancelled = true
            if (channel) supabase.removeChannel(channel)
        }
    }, [currentUserId, otherUserId])

    // auto-scroll to bottom on mount and whenever the list grows
    useEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [messages.length])

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const trimmed = text.trim()
        if (!trimmed) return
        setError(null)

        // optimistic append
        const tempId = `tmp-${Date.now()}`
        const tempMessage: Message = {
            id: tempId,
            sender_id: currentUserId,
            receiver_id: otherUserId,
            content: trimmed,
            created_at: new Date().toISOString(),
            read_at: null,
        }
        setMessages(prev => [...prev, tempMessage])
        setText('')

        startTransition(async () => {
            const r = await sendMessage(otherUserId, trimmed)
            if (r?.error) {
                setMessages(prev => prev.filter(x => x.id !== tempId))
                setError(r.error)
                setText(trimmed)
                return
            }
            if (r?.message) {
                setMessages(prev => prev.map(x => (x.id === tempId ? (r.message as Message) : x)))
            }
        })
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        // enter to send, shift-enter for a newline. feels right on desktop at least.
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            composerRef.current?.form?.requestSubmit()
        }
    }

    return (
        <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-neutral-500 text-sm">Say hi to start a conversation.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {messages.map((m, i) => {
                            const prev = messages[i - 1]
                            const gap = !prev
                                || new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() > GAP_MS
                            return (
                                <MessageBubble
                                    key={m.id}
                                    mine={m.sender_id === currentUserId}
                                    content={m.content}
                                    showTimestamp={gap}
                                    timestamp={formatTimestamp(m.created_at)}
                                />
                            )
                        })}
                    </div>
                )}
            </div>

            <form
                onSubmit={handleSubmit}
                className="border-t border-neutral-200 p-3 flex items-end gap-2 shrink-0 bg-white"
            >
                <textarea
                    ref={composerRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    rows={1}
                    maxLength={2000}
                    className="flex-1 resize-none px-3 py-2 rounded-lg border border-neutral-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 max-h-32"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
                >
                    Send
                </button>
            </form>

            {error && <p className="text-sm text-red-600 px-4 pb-2">{error}</p>}
        </>
    )
}

function formatTimestamp(iso: string): string {
    const d = new Date(iso)
    const today = new Date()
    const sameDay =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()

    const hh = d.getHours().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    if (sameDay) return `${hh}:${mm}`

    const day = d.getDate().toString().padStart(2, '0')
    const month = d.toLocaleString('en-GB', { month: 'short' })
    return `${day} ${month} ${hh}:${mm}`
}