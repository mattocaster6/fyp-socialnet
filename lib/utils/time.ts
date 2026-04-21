// short relative time. anything older than a week falls back to a date.
export function timeAgo(iso: string): string {
    const then = new Date(iso).getTime()
    const diff = Math.floor((Date.now() - then) / 1000)

    if (diff < 30) return 'now'
    if (diff < 60) return `${diff}s`
    const m = Math.floor(diff / 60)
    if (m < 60) return `${m} m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} h`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d} d`

    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}