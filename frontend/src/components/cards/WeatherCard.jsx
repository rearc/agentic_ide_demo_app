const gradientText = {
  backgroundImage: 'linear-gradient(135deg, var(--a), var(--b))',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
}

export default function WeatherCard({ data }) {
  if (data?.fallback) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <p className="text-4xl mb-2">🌤️</p>
        <p className="text-sm text-text-muted">{data.description}</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-6xl font-extrabold tracking-tighter leading-none" style={gradientText}>
            {Math.round(data.temp)}°
          </p>
          <p className="text-sm text-text-secondary capitalize mt-2">{data.description}</p>
        </div>
        {data.icon_emoji && (
          <span className="text-6xl leading-none drop-shadow-lg">{data.icon_emoji}</span>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-text-muted pt-3 mt-3 border-t border-border-subtle/60">
        <span className="font-semibold text-text-secondary">{data.city}</span>
        {data.humidity != null && <span>💧 {data.humidity}% humidity</span>}
      </div>
    </div>
  )
}
