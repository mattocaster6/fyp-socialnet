import { createClient } from '@/lib/supabase/server'
import DiscoverList from './discover-list'

export const dynamic = 'force-dynamic'

export type DiscoverUser = {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    post_count: number
    follower_count: number
}

export default async function DiscoverPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // one fetch, we shape the three sections in JS. cheaper than three separate profile fetches.
    const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      id, username, full_name, avatar_url, created_at,
      posts:posts!posts_user_id_fkey(count),
      followers:follows!follows_following_id_fkey(count)
    `)

    if (error) {
        return <p className="text-red-600">Could not load discover. {error.message}</p>
    }

    const { data: myFollows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

    const followedSet = new Set((myFollows ?? []).map(f => f.following_id))

    const users: (DiscoverUser & { created_at: string })[] = (profiles ?? [])
        .filter(p => p.id !== user.id)
        .map((p: any) => ({
            id: p.id,
            username: p.username,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            created_at: p.created_at,
            post_count: p.posts?.[0]?.count ?? 0,
            follower_count: p.followers?.[0]?.count ?? 0,
        }))

    const mightKnow = users
        .filter(u => !followedSet.has(u.id))
        .sort((a, b) => b.post_count - a.post_count)
        .slice(0, 12)

    const recent = [...users]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)

    const popular = [...users]
        .sort((a, b) => b.follower_count - a.follower_count)
        .slice(0, 10)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Discover</h1>
                <p className="text-sm text-neutral-500 mt-1">Find people to follow.</p>
            </div>

            <DiscoverList
                all={users}
                sections={{ mightKnow, recent, popular }}
                initiallyFollowedIds={Array.from(followedSet)}
            />
        </div>
    )
}