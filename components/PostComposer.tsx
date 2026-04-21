'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPost } from '@/app/actions/posts'

export default function PostComposer() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const disabled = pending || (content.trim().length === 0 && !image)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setImage(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  function clearImage() {
    setImage(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData()
    fd.set('content', content)
    if (image) fd.set('image', image)

    startTransition(async () => {
      const result = await createPost(fd)
      if (result?.error) {
        setError(result.error)
        return
      }
      setContent('')
      clearImage()
      formRef.current?.reset()
      router.refresh()
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-white border border-neutral-200 rounded-xl p-4"
    >
      <textarea
        name="content"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What's happening?"
        rows={3}
        maxLength={2000}
        className="w-full resize-none outline-none placeholder:text-neutral-400"
      />

      {preview && (
        <div className="relative inline-block mt-2">
          {/* using plain img to keep image config small */}
          <img src={preview} alt="" className="max-h-64 rounded-lg" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
        <label className="text-sm text-neutral-600 cursor-pointer hover:text-indigo-600">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <span className="inline-flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4" />
            {image ? image.name.slice(0, 24) : 'Add image'}
          </span>
        </label>

        <button
          type="submit"
          disabled={disabled}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Posting...' : 'Post'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </form>
  )
}

function ImageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <rect x={3} y={4} width={18} height={16} rx={2} strokeWidth={1.7} />
      <circle cx={9} cy={10} r={1.6} strokeWidth={1.7} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M21 16l-5-5-8 8" />
    </svg>
  )
}