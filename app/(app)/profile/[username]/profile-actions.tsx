'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { follow, unfollow } from '@/app/actions/follows'

type Props = {
    targetUserId: string
    initiallyFollowing: boolean
}

export default function ProfileActions({ targetUserId, initiallyFollowing }: Props) {
    const [following, setFollowing] = useState(initiallyFollowing)
    const [pending, startTransition] = useTransition()

    function toggle() {
        const was = following
        setFollowing(!was)
        startTransition(async () => {
            const r = was ? await unfollow(targetUserId) : await follow(targetUserId)
            if ('error' in r && r.error) {
                setFollowing(was)
                alert(r.error)
            }
        })
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={toggle}
                disabled={pending}
                className={`text-sm font-medium rounded-lg px-4 py-2 transition-colors ${following
                        ? 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    } disabled:opacity-60`}
            >
                {following ? 'Following' : 'Follow'}
            </button>
            <Link
                href={`/messages/${targetUserId}`}
                className="text-sm font-medium rounded-lg px-4 py-2 border border-neutral-300 text-neutral-800 hover:bg-neutral-100"
            >
                Message
            </Link>
        </div>
    )
}