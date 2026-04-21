'use client'

import { useState, useTransition } from 'react'
import { signIn, signUp } from './actions/auth'

type Mode = 'signin' | 'signup'

export default function AuthCard() {
  const [mode, setMode] = useState<Mode>('signin')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const fn = mode === 'signin' ? signIn : signUp
      const result = await fn(formData)
      // on success the action redirects, we only get here on failure
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
      <div className="flex rounded-lg bg-neutral-100 p-1 mb-6" role="tablist">
        <TabButton active={mode === 'signin'} onClick={() => { setMode('signin'); setError(null) }}>
          Sign in
        </TabButton>
        <TabButton active={mode === 'signup'} onClick={() => { setMode('signup'); setError(null) }}>
          Sign up
        </TabButton>
      </div>

      <form action={submit} className="space-y-4">
        {mode === 'signup' && (
          <>
            <Field name="full_name" label="Full name" required autoComplete="name" />
            <Field
              name="username"
              label="Username"
              required
              pattern="[a-zA-Z0-9_]{3,20}"
              title="3 to 20 characters. Letters, numbers and underscores only."
              autoComplete="off"
            />
          </>
        )}
        <Field name="email" label="Email" type="email" required autoComplete="email" />
        <Field
          name="password"
          label="Password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        />

        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 font-medium disabled:opacity-60 transition-colors"
        >
          {pending
            ? 'Please wait...'
            : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  )
}

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-neutral-900 shadow-sm'
          : 'text-neutral-500 hover:text-neutral-700'
      }`}
    >
      {children}
    </button>
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
        className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
        {...rest}
      />
    </label>
  )
}