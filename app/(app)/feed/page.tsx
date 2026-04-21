import { createClient } from '@/lib/supabase/server'
import PostComposer from '@/components/PostComposer'
import PostCard from '@/components/PostCard'

export const dynamic = 'force-dynamic'

type Author = {
  username: string
  full_name: string
  avatar_url: string | null
}

export type FeedPost = {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  author: Author
  like_count: number
  comment_count: number
  liked_by_me: boolean
}

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null // middleware should catch this, belt and braces

  // who does this user follow? if nobody, fall back to a global feed so first-run isn't empty
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followedIds = follows?.map(f => f.following_id) ?? []
  const showGlobal = followedIds.length === 0

  let query = supabase
    .from('posts')
    .select(`
      id, user_id, content, image_url, created_at,
      author:profiles!posts_user_id_fkey ( username, full_name, avatar_url ),
      likes ( count ),
      comments ( count )
    `)
    .order('created_at', { ascending: false })
    .limit(30)

  if (!showGlobal) {
    query = query.in('user_id', [...followedIds, user.id])
  }

  const { data: rawPosts, error } = await query

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-2">Feed</h1>
        <p className="text-red-600">Could not load the feed. {error.message}</p>
      </div>
    )
  }

  const postIds = (rawPosts ?? []).map(p => p.id)

  // which of these has the current user liked? one small query, keep it parallel-friendly
  const { data: myLikes } = postIds.length
    ? await supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds)
    : { data: [] as { post_id: string }[] }

  const likedSet = new Set((myLikes ?? []).map(l => l.post_id))

  const posts: FeedPost[] = (rawPosts ?? []).map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    content: p.content,
    image_url: p.image_url,
    created_at: p.created_at,
    author: Array.isArray(p.author) ? p.author[0] : p.author,
    like_count: p.likes?.[0]?.count ?? 0,
    comment_count: p.comments?.[0]?.count ?? 0,
    liked_by_me: likedSet.has(p.id),
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Feed</h1>
        {showGlobal && (
          <p className="text-sm text-neutral-500 mt-1">
            You are not following anyone yet, so here is what everyone has been posting.
          </p>
        )}
      </div>

      <PostComposer />

      {posts.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-neutral-600">Nothing here yet. Be the first to post something.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(p => (
            <PostCard key={p.id} post={p} currentUserId={user.id} />
          ))}
        </div>
      )}
    </div>
  )
}