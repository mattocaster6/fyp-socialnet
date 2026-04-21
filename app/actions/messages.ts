'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function sendMessage(receiverId: string, content: string) {
    const trimmed = content.trim()
    if (!trimmed) return { error: 'Message cannot be empty.' }
    if (trimmed.length > 2000) return { error: 'Messages must be under 2000 characters.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }
    if (user.id === receiverId) return { error: 'You cannot message yourself.' }

    const { data, error } = await supabase
        .from('messages')
        .insert({ sender_id: user.id, receiver_id: receiverId, content: trimmed })
        .select('id, sender_id, receiver_id, content, created_at, read_at')
        .single()

    if (error) return { error: error.message }

    // refresh the conversations list so the preview updates. the active chat is handled by realtime.
    revalidatePath('/messages')
    return { ok: true, message: data }
}

export async function markAsRead(otherUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .is('read_at', null)

    if (error) return { error: error.message }

    revalidatePath('/messages')
    return { ok: true }
}