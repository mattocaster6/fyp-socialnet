import { createClient } from '@/lib/supabase/server'
import EditProfileCard from './edit-profile-card'
import ProfilePostsGrid from './profile-posts-grid'

export const dynamic = 'force-dynamic'

export default async function OwnProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [
        { data: profile },
        { count: followerCount },
        { count: followingCount },
        { count: postCount },
        { data: posts },
    ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('posts')
            .select('id, content, image_url, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(60),
    ])

    if (!profile) {
        return <p className="text-red-600">Could not load your profile.</p>
    }

    return (
        <div className="space-y-6">
            <EditProfileCard
                profile={{
                    username: profile.username,
                    full_name: profile.full_name,
                    bio: profile.bio ?? '',
                    avatar_url: profile.avatar_url,
                }}
                counts={{
                    followers: followerCount ?? 0,
                    following: followingCount ?? 0,
                    posts: postCount ?? 0,
                }}
            />

            <div>
                <h2 className="text-lg font-semibold mb-3">Your posts</h2>
                <ProfilePostsGrid posts={posts ?? []} />
            </div>
        </div>
    )
}