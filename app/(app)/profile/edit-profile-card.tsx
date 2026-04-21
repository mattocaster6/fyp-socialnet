'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/app/actions/profile'

type Profile = {
    username: string
    full_name: string
    bio: string
    avatar_url: string | null
}

type Counts = { followers: number; following: number; posts: number }

export default function EditProfileCard({ profile, counts }: { profile: Profile; counts: Counts }) {
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()
    const formRef = useRef<HTMLFormElement>(null)

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        setAvatarPreview(f ? URL.createObjectURL(f) : null)
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        const fd = new FormData(e.currentTarget)

        startTransition(async () => {
            const r = await updateProfile(fd)
            if (r?.error) {
                setError(r.error)
                return
            }
            setEditing(false)
            setAvatarPreview(null)
            router.refresh()
        })
    }

    return (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            {!editing ? (
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                    <Avatar url={profile.avatar_url} name={profile.full_name} />

                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-semibold">{profile.full_name}</h1>
                        <p className="text-sm text-neutral-500">@{profile.username}</p>

                        {profile.bio && (
                            <p className="mt-2 text-neutral-700 whitespace-pre-wrap">{profile.bio}</p>
                        )}

                        <div className="mt-4 flex gap-5 text-sm">
                            <Stat label="Posts" value={counts.posts} />
                            <Stat label="Followers" value={counts.followers} />
                            <Stat label="Following" value={counts.following} />
                        </div>
                    </div>

                    <button
                        onClick={() => setEditing(true)}
                        className="bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-lg px-4 py-2"
                    >
                        Edit profile
                    </button>
                </div>
            ) : (
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar url={avatarPreview ?? profile.avatar_url} name={profile.full_name} />
                        <label className="text-sm text-indigo-600 cursor-pointer hover:underline">
                            <input
                                type="file"
                                name="avatar"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            Change photo
                        </label>
                    </div>

                    <Field
                        name="full_name"
                        label="Full name"
                        defaultValue={profile.full_name}
                        required
                    />
                    <Field
                        name="username"
                        label="Username"
                        defaultValue={profile.username}
                        required
                        pattern="[a-zA-Z0-9_]{3,20}"
                        title="3 to 20 characters. Letters, numbers and underscores only."
                    />
                    <label className="block">
                        <span className="text-sm font-medium text-neutral-700">Bio</span>
                        <textarea
                            name="bio"
                            defaultValue={profile.bio}
                            rows={3}
                            maxLength={300}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </label>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => { setEditing(false); setError(null); setAvatarPreview(null) }}
                            className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={pending}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2"
                        >
                            {pending ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </form>
            )}
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

function Field({
    name, label, ...rest
}: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="block">
            <span className="text-sm font-medium text-neutral-700">{label}</span>
            <input
                name={name}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                {...rest}
            />
        </label>
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