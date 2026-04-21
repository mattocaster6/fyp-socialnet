import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options: CookieOptions }

const PROTECTED = ['/feed', '/profile', '/discover', '/messages']

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: CookieToSet[]) {
                    for (const { name, value } of cookiesToSet) {
                        request.cookies.set(name, value)
                    }
                    response = NextResponse.next({ request })
                    for (const { name, value, options } of cookiesToSet) {
                        response.cookies.set(name, value, options)
                    }
                },
            },
        }
    )

    // must be getUser, getSession does not revalidate the JWT
    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const needsAuth = PROTECTED.some(p => path === p || path.startsWith(p + '/'))

    if (needsAuth && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // signed-in users hitting the landing page get sent on to the feed
    if (path === '/' && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/feed'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}