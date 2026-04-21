import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { timeAgo } from '@/lib/utils/time'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read_at: string | null
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rows, error } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, content, created_at, read_at')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-2">Messages</h1>
        <p className="text-red-600">Could not load messages. {error.message}</p>
      </div>
    )
  }

  // collapse the flat list into one entry per other-user, keeping the most recent message
  type Summary = {
    otherId: string
    lastMessage: string
    lastAt: string
    lastFromMe: boolean
    unread: number
  }
  const byOther = new Map<string, Summary>()

  for (const m of (rows ?? []) as Row[]) {
    const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
    const existing = byOther.get(otherId)
    const isUnread = m.receiver_id === user.id && !m.read_at

    if (!existing) {
      byOther.set(otherId, {
        otherId,
        lastMessage: m.content,
        lastAt: m.created_at,
        lastFromMe: m.sender_id === user.id,
        unread: isUnread ? 1 : 0,
      })
    } else if (isUnread) {
      existing.unread += 1
    }
  }

  const otherIds = Array.from(byOther.keys())

  const { data: profiles } = otherIds.length
    ? await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', otherIds)
    : { data: [] as { id: string; username: string; full_name: string; avatar_url: string | null }[] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  const conversations = Array.from(byOther.values())
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Messages</h1>

      {conversations.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-neutral-600">
            No conversations yet. Head to Discover to find people, then say hi.
          </p>
        </div>
      ) : (
        <ul className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 overflow-hidden">
          {conversations.map(c => {
            const p = profileMap.get(c.otherId)
            const name = p?.full_name ?? 'Unknown'
            const username = p?.username ?? ''
            return (
              <li key={c.otherId}>
                <Link
                  href={`/messages/${c.otherId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
                >
                  <Avatar url={p?.avatar_url ?? null} name={name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-neutral-500 shrink-0">{timeAgo(c.lastAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs truncate flex-1 ${
                        c.unread > 0 ? 'text-neutral-900 font-medium' : 'text-neutral-500'
                      }`}>
                        {c.lastFromMe ? 'You: ' : ''}{c.lastMessage}
                      </p>
                      {c.unread > 0 && (
                        <span className="shrink-0 bg-indigo-600 text-white text-[11px] font-medium rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    {username && (
                      <p className="text-[11px] text-neutral-400 truncate">@{username}</p>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) return <img src={url} alt="" className="w-11 h-11 rounded-full object-cover" />
  return (
    <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium flex items-center justify-center">
      {(name || '?').slice(0, 1).toUpperCase()}
    </div>
  )
}