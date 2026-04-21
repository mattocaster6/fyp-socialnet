'use client'

import { timeAgo } from '@/lib/utils/time'

type Row = {
  id: string
  content: string
  image_url: string | null
  created_at: string
}

export default function ProfilePostsGrid({ posts }: { posts: Row[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-600">
        No posts yet.
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {posts.map(p => (
        <div
          key={p.id}
          className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
        >
          {p.image_url && (
            <img
              src={p.image_url}
              alt=""
              className="w-full h-40 object-cover rounded-lg mb-3"
            />
          )}
          {p.content && (
            <p className="text-sm text-neutral-800 line-clamp-4 whitespace-pre-wrap">{p.content}</p>
          )}
          <p className="text-xs text-neutral-500 mt-2">{timeAgo(p.created_at)}</p>
        </div>
      ))}
    </div>
  )
}