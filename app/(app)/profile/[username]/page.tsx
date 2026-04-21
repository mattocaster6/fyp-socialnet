import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileActions from './profile-actions'
import ProfilePostsGrid from '../profile-posts-grid'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, bio, avatar_url, created_at')
    .eq('username', username)
    .maybeSingle()

  if (!profile) notFound()

  // looking at our own profile via the /profile/[username] route, bounce to /profile
  if (profile.id === user.id) redirect('/profile')

  const [
    { count: followerCount },
    { count: followingCount },
    { count: postCount },
    { data: following },
    { data: posts },
  ] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
    supabase.from('follows').select('follower_id')
      .eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle(),
    supabase.from('posts')
      .select('id, content, image_url, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(60),
  ])

  const isFollowing = !!following

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row gap-5 items-start">
        <Avatar url={profile.avatar_url} name={profile.full_name} />

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">{profile.full_name}</h1>
          <p className="text-sm text-neutral-500">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-2 text-neutral-700 whitespace-pre-wrap">{profile.bio}</p>
          )}

          <div className="mt-4 flex gap-5 text-sm">
            <Stat label="Posts" value={postCount ?? 0} />
            <Stat label="Followers" value={followerCount ?? 0} />
            <Stat label="Following" value={followingCount ?? 0} />
          </div>
        </div>

        <ProfileActions
          targetUserId={profile.id}
          initiallyFollowing={isFollowing}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Posts</h2>
        <ProfilePostsGrid posts={posts ?? []} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="font-semibold">{value}</span>{' '}
      <span className="text-neutral-500">{label}</span>
    </div>
  )
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return <img src={url} alt="" className="w-20 h-20 rounded-full object-cover" />
  }
  return (
    <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 text-2xl font-medium flex items-center justify-center">
      {(name || '?').slice(0, 1).toUpperCase()}
    </div>
  )
}