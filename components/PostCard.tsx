'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils/time'
import { toggleLike, deletePost, addComment, deleteComment } from '@/app/actions/posts'
import type { FeedPost } from '@/app/(app)/feed/page'

type CommentRow = {
  id: string
  content: string
  created_at: string
  user_id: string
  author: {
    username: string
    full_name: string
    avatar_url: string | null
  }
}

type Props = {
  post: FeedPost
  currentUserId: string
}

export default function PostCard({ post, currentUserId }: Props) {
  const router = useRouter()

  const [liked, setLiked] = useState(post.liked_by_me)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [commentCount, setCommentCount] = useState(post.comment_count)

  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)

  const [commentText, setCommentText] = useState('')
  const [, startCommentTransition] = useTransition()

  const isAuthor = post.user_id === currentUserId

  function handleLike() {
    // optimistic, revert on failure
    const prev = { liked, likeCount }
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)

    startCommentTransition(async () => {
      const r = await toggleLike(post.id)
      if (r && 'error' in r && r.error) {
        setLiked(prev.liked)
        setLikeCount(prev.likeCount)
      }
    })
  }

  async function toggleComments() {
    if (!expanded && !commentsLoaded) {
      setLoadingComments(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('comments')
        .select(`
          id, content, created_at, user_id,
          author:profiles!comments_user_id_fkey ( username, full_name, avatar_url )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })

      // supabase sometimes hands back the join as an array
      const shaped: CommentRow[] = (data ?? []).map((c: any) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        author: Array.isArray(c.author) ? c.author[0] : c.author,
      }))
      setComments(shaped)
      setCommentsLoaded(true)
      setLoadingComments(false)
    }
    setExpanded(v => !v)
  }

  function handleAddComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = commentText.trim()
    if (!text) return

    // optimistic insert, we'll fix up the id when the action responds
    const tempId = `tmp-${Date.now()}`
    const tempRow: CommentRow = {
      id: tempId,
      content: text,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      // we don't have the current user's profile in this component, leave blank-ish
      author: { username: 'you', full_name: 'You', avatar_url: null },
    }
    setComments(c => [...c, tempRow])
    setCommentCount(n => n + 1)
    setCommentText('')

    startCommentTransition(async () => {
      const r = await addComment(post.id, text)
      if (r?.error) {
        setComments(c => c.filter(x => x.id !== tempId))
        setCommentCount(n => n - 1)
        return
      }
      if (r?.comment) {
        setComments(c => c.map(x => (x.id === tempId ? { ...x, id: r.comment!.id } : x)))
      }
    })
  }

  function handleDeleteComment(id: string) {
    if (!confirm('Delete this comment?')) return
    const backup = comments
    setComments(c => c.filter(x => x.id !== id))
    setCommentCount(n => Math.max(0, n - 1))
    startCommentTransition(async () => {
      const r = await deleteComment(id)
      if (r?.error) {
        setComments(backup)
        setCommentCount(n => n + 1)
      }
    })
  }

  function handleDeletePost() {
    if (!confirm('Delete this post? This cannot be undone.')) return
    startCommentTransition(async () => {
      const r = await deletePost(post.id)
      if (r?.error) {
        alert(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <article className="bg-white border border-neutral-200 rounded-xl p-4">
      <header className="flex items-center gap-3">
        <Link href={`/profile/${post.author.username}`} className="shrink-0">
          <Avatar url={post.author.avatar_url} name={post.author.full_name} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${post.author.username}`} className="block">
            <p className="text-sm font-medium text-neutral-900 truncate">{post.author.full_name}</p>
            <p className="text-xs text-neutral-500 truncate">
              @{post.author.username} . {timeAgo(post.created_at)}
            </p>
          </Link>
        </div>
        {isAuthor && (
          <button
            onClick={handleDeletePost}
            className="text-neutral-400 hover:text-red-600 text-sm"
            aria-label="Delete post"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </header>

      {post.content && (
        <p className="mt-3 text-neutral-800 whitespace-pre-wrap">{post.content}</p>
      )}

      {post.image_url && (
        <div className="mt-3 rounded-lg overflow-hidden border border-neutral-100">
          <img src={post.image_url} alt="" className="w-full max-h-[32rem] object-cover" />
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-5 text-sm">
        <button
          onClick={handleLike}
          className={`inline-flex items-center gap-1.5 transition-colors ${
            liked ? 'text-indigo-600' : 'text-neutral-500 hover:text-indigo-600'
          }`}
          aria-pressed={liked}
        >
          <HeartIcon filled={liked} className="w-5 h-5" />
          <span>{likeCount}</span>
        </button>

        <button
          onClick={toggleComments}
          className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-indigo-600 transition-colors"
          aria-expanded={expanded}
        >
          <SpeechIcon className="w-5 h-5" />
          <span>{commentCount}</span>
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-3 border-t border-neutral-100 space-y-3">
          {loadingComments ? (
            <p className="text-sm text-neutral-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-neutral-500">No comments yet. Be the first.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map(c => (
                <li key={c.id} className="flex gap-3">
                  <Avatar url={c.author?.avatar_url ?? null} name={c.author?.full_name ?? '?'} small />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {c.author?.full_name ?? 'Someone'}
                      </span>
                      <span className="text-xs text-neutral-500">{timeAgo(c.created_at)}</span>
                      {c.user_id === currentUserId && !c.id.startsWith('tmp-') && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="ml-auto text-xs text-neutral-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-neutral-800 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              maxLength={1000}
              className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-3"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </article>
  )
}

function Avatar({
  url, name, small,
}: { url: string | null; name: string; small?: boolean }) {
  const size = small ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  if (url) {
    return <img src={url} alt="" className={`${size} rounded-full object-cover`} />
  }
  return (
    <div className={`${size} rounded-full bg-indigo-100 text-indigo-700 font-medium flex items-center justify-center`}>
      {(name || '?').slice(0, 1).toUpperCase()}
    </div>
  )
}

function HeartIcon({ filled, ...rest }: { filled: boolean } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 20s-7-4.5-9.3-9.1C1 7.8 3 4.5 6.2 4.5c1.8 0 3.3 1 3.8 2.2h1c.5-1.2 2-2.2 3.8-2.2 3.2 0 5.2 3.3 3.5 6.4C19 15.5 12 20 12 20z" />
    </svg>
  )
}

function SpeechIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M21 11.5c0 3.6-4 6.5-9 6.5a11 11 0 01-3.8-.7L3 19l1.3-3.6A6.7 6.7 0 013 11.5C3 7.9 7 5 12 5s9 2.9 9 6.5z" />
    </svg>
  )
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
    </svg>
  )
}