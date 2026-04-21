import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SidebarNav from './sidebar-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <SidebarNav
        username={profile?.username ?? ''}
        fullName={profile?.full_name ?? ''}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="flex-1 min-w-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}