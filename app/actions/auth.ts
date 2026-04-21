'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Please enter your email and password.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  redirect('/feed')
}

export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const username = String(formData.get('username') ?? '').trim()
  const full_name = String(formData.get('full_name') ?? '').trim()

  if (!USERNAME_RE.test(username)) {
    return { error: 'Username must be 3 to 20 characters, letters, numbers or underscores.' }
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }
  if (!full_name) {
    return { error: 'Please enter your full name.' }
  }

  const supabase = await createClient()

  // the db trigger reads username and full_name from metadata and creates the profile row
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, full_name } },
  })

  if (error) return { error: error.message }

  redirect('/feed')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}