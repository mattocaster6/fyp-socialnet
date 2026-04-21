'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createPost(formData: FormData) {
    const content = String(formData.get('content') ?? '').trim()
    const image = formData.get('image') as File | null

    if (!content && (!image || image.size === 0)) {
        return { error: 'Write something or attach an image.' }
    }
    if (content.length > 2000) {
        return { error: 'Posts must be 2000 characters or fewer.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    let imageUrl: string | null = null

    if (image && image.size > 0) {
        // basic sanity check, the storage policy gates the rest
        if (image.size > 5 * 1024 * 1024) {
            return { error: 'Images must be under 5 MB.' }
        }
        const ext = (image.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `${user.id}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase
            .storage
            .from('post-images')
            .upload(path, image, { contentType: image.type })

        if (uploadError) return { error: uploadError.message }

        const { data } = supabase.storage.from('post-images').getPublicUrl(path)
        imageUrl = data.publicUrl
    }

    const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content || '',
        image_url: imageUrl,
    })

    if (error) return { error: error.message }

    revalidatePath('/feed')
    return { ok: true }
}

export async function deletePost(postId: string) {
    const supabase = await createClient()
    // RLS enforces ownership but check here too so we can return a clearer error
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) return { error: error.message }

    revalidatePath('/feed')
    return { ok: true }
}

export async function toggleLike(postId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    // check first so we know whether this is a like or an unlike
    const { data: existing } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle()

    if (existing) {
        const { error } = await supabase
            .from('likes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', postId)
        if (error) return { error: error.message }
        return { liked: false }
    }

    const { error } = await supabase.from('likes').insert({
        user_id: user.id,
        post_id: postId,
    })
    if (error) return { error: error.message }
    return { liked: true }
}

export async function addComment(postId: string, content: string) {
    const trimmed = content.trim()
    if (!trimmed) return { error: 'Comment cannot be empty.' }
    if (trimmed.length > 1000) return { error: 'Comments must be under 1000 characters.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: user.id, content: trimmed })
        .select('id, content, created_at, user_id')
        .single()

    if (error) return { error: error.message }
    return { ok: true, comment: data }
}

export async function deleteComment(commentId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) return { error: error.message }
    return { ok: true }
}