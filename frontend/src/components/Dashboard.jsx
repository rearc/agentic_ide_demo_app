import { useState, useEffect, useCallback, useRef } from 'react'
import { GridLayout, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { fetchCards, updateCard } from '../api'
import Card from './Card'

function buildLayout(cards, locked) {
  return cards.map((card, i) => ({
    i: String(card.id),
    x: card.layout?.x ?? (i % 2) * 6,
    y: card.layout?.y ?? Math.floor(i / 2) * 4,
    w: card.layout?.w ?? 6,
    h: card.layout?.h ?? 4,
    minW: 2,
    minH: 2,
  }))
}

export default function Dashboard({ locked }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const hasUnlocked = useRef(false)
  const saveTimer = useRef(null)
  const { width, containerRef, mounted } = useContainerWidth()

  useEffect(() => {
    fetchCards()
      .then(setCards)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!locked) hasUnlocked.current = true
  }, [locked])

  const handleLayoutChange = useCallback((newLayout) => {
    if (locked || !hasUnlocked.current) return

    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      newLayout.forEach((item) => {
        const card = cards.find(c => String(c.id) === item.i)
        if (!card) return
        const prev = card.layout || {}
        if (prev.x === item.x && prev.y === item.y && prev.w === item.w && prev.h === item.h) return
        updateCard(card.id, { layout: { x: item.x, y: item.y, w: item.w, h: item.h } })
      })
      setCards(prev => prev.map(card => {
        const item = newLayout.find(l => l.i === String(card.id))
        if (!item) return card
        return { ...card, layout: { x: item.x, y: item.y, w: item.w, h: item.h } }
      }))
    }, 500)
  }, [locked, cards])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-text-muted animate-subtle-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-text-secondary text-lg">Unable to load dashboard</p>
        <p className="text-text-muted text-sm mt-2">{error}</p>
        <p className="text-text-muted text-sm mt-1">
          Make sure the backend is running on port 5001
        </p>
      </div>
    )
  }

  const layout = buildLayout(cards, locked)

  return (
    <div>
      <div ref={containerRef}>
        {mounted && (
          <GridLayout
            width={width}
            layout={layout}
            onLayoutChange={handleLayoutChange}
            gridConfig={{ cols: 12, rowHeight: 40, margin: [16, 16] }}
            dragConfig={{ enabled: !locked, handle: '.card-drag-handle' }}
            resizeConfig={{ enabled: !locked }}
          >
            {cards.map((card, i) => (
              <div
                key={String(card.id)}
                className="animate-card-enter"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <Card card={card} locked={locked} />
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </div>
  )
}
