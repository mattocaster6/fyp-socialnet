import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuthCard from './auth-card'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // middleware already handles this but belt and braces
  if (user) redirect('/feed')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-neutral-50">
      <div className="w-full max-w-md">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-semibold tracking-tight text-neutral-900">
            Circlr
          </h1>
          <p className="mt-3 text-neutral-600">
            Discover people, share moments.
          </p>
        </header>

        <AuthCard />

        <p className="mt-6 text-center text-xs text-neutral-500">
          By continuing you agree to be nice to one another.
        </p>
      </div>

      <footer className="mt-16 text-xs text-neutral-400">
        A final year project. Loughborough University.
      </footer>
    </main>
  )
}