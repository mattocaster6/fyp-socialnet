'use client'

import { useEffect } from 'react'

type Props = {
    error: Error & { digest?: string }
    reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
    useEffect(() => {
        // surface it in the console for dev, production logs end up server-side anyway
        console.error(error)
    }, [error])

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-neutral-50">
            <div className="text-center max-w-sm">
                <h1 className="text-lg font-semibold text-neutral-900">Something has gone wrong.</h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Try again in a moment. If it keeps happening, refresh the page.
                </p>
                <button
                    onClick={reset}
                    className="inline-block mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2"
                >
                    Try again
                </button>
            </div>
        </main>
    )
}