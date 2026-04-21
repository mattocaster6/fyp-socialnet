'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    const username = String(formData.get('username') ?? '').trim()
    const full_name = String(formData.get('full_name') ?? '').trim()
    const bio = String(formData.get('bio') ?? '').trim()
    const avatar = formData.get('avatar') as File | null

    if (!USERNAME_RE.test(username)) {
        return { error: 'Username must be 3 to 20 characters, letters, numbers or underscores.' }
    }
    if (!full_name) return { error: 'Full name cannot be empty.' }
    if (bio.length > 300) return { error: 'Bio must be 300 characters or fewer.' }

    let avatar_url: string | undefined

    if (avatar && avatar.size > 0) {
        if (avatar.size > 2 * 1024 * 1024) {
            return { error: 'Avatar must be under 2 MB.' }
        }
        const ext = (avatar.name.split('.').pop() || 'jpg').toLowerCase()
        // deterministic path means a new upload replaces the old one thanks to upsert
        const path = `${user.id}/avatar.${ext}`

        const { error: uploadError } = await supabase
            .storage
            .from('avatars')
            .upload(path, avatar, { contentType: avatar.type, upsert: true })

        if (uploadError) return { error: uploadError.message }

        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        // cache-bust so the new image shows up immediately
        avatar_url = `${data.publicUrl}?v=${Date.now()}`
    }

    const update: Record<string, string> = { username, full_name, bio }
    if (avatar_url) update.avatar_url = avatar_url

    const { error } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', user.id)

    if (error) {
        if (error.code === '23505') return { error: 'That username is already taken.' }
        return { error: error.message }
    }

    revalidatePath('/profile')
    revalidatePath('/discover')
    return { ok: true }
}