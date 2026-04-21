import Link from 'next/link'

export default function NotFound() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-neutral-50">
            <div className="text-center max-w-sm">
                <p className="text-6xl font-semibold text-neutral-900">404</p>
                <h1 className="mt-2 text-lg font-medium text-neutral-800">We could not find that page.</h1>
                <p className="mt-2 text-sm text-neutral-500">
                    The link might be broken or the page may have been removed.
                </p>
                <Link
                    href="/feed"
                    className="inline-block mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2"
                >
                    Back to feed
                </Link>
            </div>
        </main>
    )
}