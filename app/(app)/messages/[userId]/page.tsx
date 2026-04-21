import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConversationView from './conversation-view'

export const dynamic = 'force-dynamic'

type PageProps = {
    params: Promise<{ userId: string }>
}

export default async function ConversationPage({ params }: PageProps) {
    const { userId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    if (user.id === userId) redirect('/messages')

    const { data: other } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', userId)
        .maybeSingle()

    if (!other) notFound()

    const { data: messages } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, created_at, read_at')
        .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),` +
            `and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })
        .limit(200)

    return (
        <div className="-mx-4 -my-6 md:-my-10 h-[calc(100vh-3.5rem)] md:h-screen flex flex-col bg-white md:rounded-none">
            <header className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 shrink-0">
                <Link
                    href="/messages"
                    className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-neutral-100"
                    aria-label="Back to messages"
                >
                    <BackIcon className="w-5 h-5" />
                </Link>
                <Link href={`/profile/${other.username}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar url={other.avatar_url} name={other.full_name} />
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{other.full_name}</p>
                        <p className="text-xs text-neutral-500 truncate">@{other.username}</p>
                    </div>
                </Link>
            </header>

            <ConversationView
                currentUserId={user.id}
                otherUserId={other.id}
                initialMessages={messages ?? []}
            />
        </div>
    )
}

function Avatar({ url, name }: { url: string | null; name: string }) {
    if (url) return <img src={url} alt="" className="w-9 h-9 rounded-full object-cover" />
    return (
        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium flex items-center justify-center">
            {(name || '?').slice(0, 1).toUpperCase()}
        </div>
    )
}

function BackIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
        </svg>
    )
}