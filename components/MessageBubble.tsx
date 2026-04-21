'use client'

type Props = {
    mine: boolean
    content: string
    showTimestamp: boolean
    timestamp: string
}

export default function MessageBubble({ mine, content, showTimestamp, timestamp }: Props) {
    return (
        <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
            {showTimestamp && (
                <p className="text-[11px] text-neutral-400 mb-1 px-1">{timestamp}</p>
            )}
            <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${mine
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
                    }`}
                title={timestamp}
            >
                {content}
            </div>
        </div>
    )
}