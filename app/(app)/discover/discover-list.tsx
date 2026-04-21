'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { follow, unfollow } from '@/app/actions/follows'
import type { DiscoverUser } from './page'

type Props = {
    all: DiscoverUser[]
    sections: {
        mightKnow: DiscoverUser[]
        recent: DiscoverUser[]
        popular: DiscoverUser[]
    }
    initiallyFollowedIds: string[]
}

export default function DiscoverList({ all, sections, initiallyFollowedIds }: Props) {
    const [query, setQuery] = useState('')
    const [followedSet, setFollowedSet] = useState<Set<string>>(new Set(initiallyFollowedIds))

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return null
        return all.filter(u =>
            u.username.toLowerCase().includes(q) ||
            u.full_name.toLowerCase().includes(q)
        ).slice(0, 30)
    }, [query, all])

    return (
        <div className="space-y-8">
            <div className="relative">
                <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search by name or username"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-neutral-300 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>

            {filtered ? (
                <Section title={`Results (${filtered.length})`} users={filtered} followedSet={followedSet} setFollowedSet={setFollowedSet} />
            ) : (
                <>
                    <Section title="People you might know" users={sections.mightKnow} followedSet={followedSet} setFollowedSet={setFollowedSet} />
                    <Section title="Recently joined" users={sections.recent} followedSet={followedSet} setFollowedSet={setFollowedSet} />
                    <Section title="Popular" users={sections.popular} followedSet={followedSet} setFollowedSet={setFollowedSet} />
                </>
            )}
        </div>
    )
}

function Section({
    title, users, followedSet, setFollowedSet,
}: {
    title: string
    users: DiscoverUser[]
    followedSet: Set<string>
    setFollowedSet: React.Dispatch<React.SetStateAction<Set<string>>>
}) {
    if (users.length === 0) {
        return (
            <section>
                <h2 className="text-lg font-semibold mb-3">{title}</h2>
                <p className="text-sm text-neutral-500">Nobody to show here yet.</p>
            </section>
        )
    }

    return (
        <section>
            <h2 className="text-lg font-semibold mb-3">{title}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                {users.map(u => (
                    <UserCard
                        key={u.id}
                        user={u}
                        isFollowing={followedSet.has(u.id)}
                        onChange={(nowFollowing) => {
                            setFollowedSet(prev => {
                                const next = new Set(prev)
                                if (nowFollowing) next.add(u.id)
                                else next.delete(u.id)
                                return next
                            })
                        }}
                    />
                ))}
            </div>
        </section>
    )
}

function UserCard({
    user, isFollowing, onChange,
}: {
    user: DiscoverUser
    isFollowing: boolean
    onChange: (nowFollowing: boolean) => void
}) {
    const [pending, startTransition] = useTransition()

    function toggle() {
        const was = isFollowing
        onChange(!was)
        startTransition(async () => {
            const r = was ? await unfollow(user.id) : await follow(user.id)
            if ('error' in r && r.error) {
                onChange(was)
            }
        })
    }

    return (
        <div className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-shadow flex items-center gap-3">
            <Link href={`/profile/${user.username}`} className="shrink-0">
                <Avatar url={user.avatar_url} name={user.full_name} />
            </Link>
            <div className="flex-1 min-w-0">
                <Link href={`/profile/${user.username}`} className="block">
                    <p className="text-sm font-medium truncate">{user.full_name}</p>
                    <p className="text-xs text-neutral-500 truncate">@{user.username}</p>
                </Link>
            </div>
            <button
                onClick={toggle}
                disabled={pending}
                className={`text-xs font-medium rounded-lg px-3 py-1.5 transition-colors ${isFollowing
                        ? 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    } disabled:opacity-60`}
            >
                {isFollowing ? 'Following' : 'Follow'}
            </button>
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

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <circle cx={11} cy={11} r={7} strokeWidth={1.8} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 20l-3.5-3.5" />
        </svg>
    )
}