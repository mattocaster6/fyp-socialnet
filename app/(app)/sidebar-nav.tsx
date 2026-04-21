'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from '../actions/auth'

const NAV = [
  { href: '/feed', label: 'Feed', Icon: FeedIcon },
  { href: '/discover', label: 'Discover', Icon: DiscoverIcon },
  { href: '/messages', label: 'Messages', Icon: MessagesIcon },
  { href: '/profile', label: 'Profile', Icon: ProfileIcon },
]

type Props = {
  username: string
  fullName: string
  avatarUrl: string | null
}

export default function SidebarNav({ username, fullName, avatarUrl }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const panel = (
    <nav className="p-4 flex flex-col h-full">
      <Link
        href="/feed"
        onClick={() => setOpen(false)}
        className="px-3 py-2 text-2xl font-semibold tracking-tight mb-6"
      >
        Circlr
      </Link>

      <ul className="space-y-1 flex-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="pt-4 border-t border-neutral-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar url={avatarUrl} name={fullName || username} />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{fullName || username}</p>
            <p className="text-xs text-neutral-500 truncate">@{username}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full text-left px-3 py-2 mt-1 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )

  return (
    <>
      {/* mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-neutral-200 flex items-center justify-between px-4 h-14">
        <Link href="/feed" className="text-xl font-semibold">Circlr</Link>
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          className="p-2 rounded-lg hover:bg-neutral-100"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>

      {/* mobile drawer */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(false)}
        >
          <aside
            onClick={e => e.stopPropagation()}
            className="fixed top-0 left-0 bottom-0 w-72 bg-white shadow-xl"
          >
            {panel}
          </aside>
        </div>
      )}

      {/* desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 bg-white border-r border-neutral-200 sticky top-0 h-screen">
        {panel}
      </aside>
    </>
  )
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    // next/image would be nicer but plain img avoids config fuss for now
    return <img src={url} alt="" className="w-9 h-9 rounded-full object-cover" />
  }
  return (
    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium flex items-center justify-center">
      {(name || '?').slice(0, 1).toUpperCase()}
    </div>
  )
}

function FeedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  )
}

function DiscoverIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <circle cx={12} cy={12} r={9} strokeWidth={1.8} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M15.5 8.5l-2.2 5.3-5.3 2.2 2.2-5.3z" />
    </svg>
  )
}

function MessagesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M21 11.5c0 3.6-4 6.5-9 6.5a11 11 0 01-3.8-.7L3 19l1.3-3.6A6.7 6.7 0 013 11.5C3 7.9 7 5 12 5s9 2.9 9 6.5z" />
    </svg>
  )
}

function ProfileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <circle cx={12} cy={8.5} r={3.5} strokeWidth={1.8} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M5 20c1.3-3.4 4-5 7-5s5.7 1.6 7 5" />
    </svg>
  )
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}