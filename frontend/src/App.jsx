import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import AnimatedLabsLockup from './components/brand/AnimatedLabsLockup'

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function App() {
  const now = useNow()
  const [locked, setLocked] = useState(true)
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border-subtle/70 bg-surface/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AnimatedLabsLockup markSize={34} wordSize={27} tone="navy" title="Rearc AI Labs" />
            <span className="hidden sm:block h-7 w-px bg-border-subtle" />
            <h1 className="hidden sm:block font-display text-lg font-semibold tracking-tight text-text-secondary">
              Control Center
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!locked && (
              <span className="hidden md:inline-flex items-center text-xs text-text-secondary bg-surface-raised/80 border border-border-subtle rounded-lg px-3 py-1.5">
                Drag &amp; resize — changes save automatically
              </span>
            )}
            <button
              onClick={() => setLocked(l => !l)}
              className={`inline-flex items-center gap-2 text-sm font-bold rounded-xl px-4 py-2.5 transition-all ${
                locked
                  ? 'text-surface bg-gradient-to-r from-card-placeholder to-card-space hover:opacity-90 shadow-lg shadow-card-space/20'
                  : 'text-text-primary border border-card-placeholder/60 bg-card-placeholder/10 hover:bg-card-placeholder/20'
              }`}
            >
              <span>{locked ? '🔓' : '🔒'}</span>
              {locked ? 'Customize layout' : 'Done — lock layout'}
            </button>
            <div className="text-right hidden sm:block">
              <p className="font-display text-2xl font-bold tracking-tight text-text-primary tabular-nums leading-none">
                {time}
              </p>
              <p className="text-text-muted text-xs mt-1.5">{date}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Dashboard locked={locked} />
      </main>
    </div>
  )
}
