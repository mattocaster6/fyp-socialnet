'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function follow(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }
    if (user.id === targetUserId) return { error: 'You cannot follow yourself.' }

    const { error } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: targetUserId,
    })

    // 23505 is a duplicate PK, which just means we were already following. treat as success.
    if (error && error.code !== '23505') return { error: error.message }

    revalidatePath('/discover')
    revalidatePath('/profile')
    return { following: true }
}

export async function unfollow(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)

    if (error) return { error: error.message }

    revalidatePath('/discover')
    revalidatePath('/profile')
    return { following: false }
}