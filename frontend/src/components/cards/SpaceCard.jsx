export default function SpaceCard({ data }) {
  if (data?.fallback) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <p className="text-4xl mb-2">🔭</p>
        <p className="text-sm text-text-muted">{data.explanation}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.url && data.media_type === 'image' ? (
        <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10">
          <img
            src={data.url}
            alt={data.title}
            className="w-full h-48 object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-raised/70 to-transparent" />
        </div>
      ) : data.url && data.media_type === 'video' ? (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-10 bg-surface rounded-xl text-card-space hover:text-card-space/80 transition-colors ring-1 ring-white/5"
        >
          <span>▶</span> Watch today&apos;s space video
        </a>
      ) : null}
      <h3 className="text-sm font-bold text-text-primary">{data.title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed">{data.explanation}</p>
      {data.date && (
        <p className="text-xs text-text-muted">{data.date}</p>
      )}
    </div>
  )
}
