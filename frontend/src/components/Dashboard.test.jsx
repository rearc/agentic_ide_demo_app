import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Dashboard from './Dashboard'
import { DRAG_HANDLE_CLASS } from './Card'
import { fetchCardData, fetchCards, fetchTodos, updateCard } from '../api'

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal()
  return Object.fromEntries(Object.keys(actual).map((name) => [name, vi.fn()]))
})

// react-grid-layout owns drag/resize maths and needs real layout boxes, which
// jsdom does not provide. Stub it so these tests cover Dashboard's own logic:
// which layout it computes, and when it decides to persist one.
//
// `emitOnMount` reproduces the real library's behavior of firing
// onLayoutChange as it mounts. It runs from the child's effect, which React
// flushes before the parent's, which is exactly the ordering the hasUnlocked
// guard exists to survive.
const grid = vi.hoisted(() => ({
  onLayoutChange: null,
  emitOnMount: false,
  mountLayout: null,
}))

vi.mock('react-grid-layout', async () => {
  const { useEffect } = await import('react')
  return {
    GridLayout: ({
      children,
      layout,
      dragConfig,
      resizeConfig,
      onLayoutChange,
    }) => {
      grid.onLayoutChange = onLayoutChange
      useEffect(() => {
        // Real react-grid-layout compacts as it mounts, so the layout it
        // echoes back differs from the one it was handed.
        if (grid.emitOnMount) onLayoutChange(grid.mountLayout ?? layout)
      }, [])
      return (
        <div
          data-testid="grid"
          data-layout={JSON.stringify(layout)}
          data-drag-enabled={String(dragConfig?.enabled)}
          data-drag-handle={dragConfig?.handle}
          data-resize-enabled={String(resizeConfig?.enabled)}
        >
          {children}
        </div>
      )
    },
    useContainerWidth: () => ({
      width: 1200,
      containerRef: { current: null },
      mounted: true,
    }),
  }
})

function cardRecord(overrides = {}) {
  return {
    id: 1,
    slug: 'placeholder',
    title: 'Coming Soon',
    description: 'Your next widget goes here',
    icon: '✨',
    source: 'placeholder',
    config: {},
    layout: { x: 0, y: 0, w: 4, h: 4 },
    position: 1,
    is_active: true,
    ...overrides,
  }
}

/** Render and flush the initial fetchCards promise. */
async function renderDashboard({
  locked = false,
  cards = [cardRecord()],
} = {}) {
  fetchCards.mockResolvedValue(cards)
  const utils = render(<Dashboard locked={locked} />)
  await act(async () => {})
  return utils
}

function renderedLayout() {
  return JSON.parse(screen.getByTestId('grid').dataset.layout)
}

beforeEach(() => {
  grid.onLayoutChange = null
  grid.emitOnMount = false
  grid.mountLayout = null
  fetchCards.mockResolvedValue([])
  fetchCardData.mockResolvedValue({})
  fetchTodos.mockResolvedValue([])
  updateCard.mockResolvedValue({})
})

describe('loading and error states', () => {
  it('shows a loading indicator before the cards arrive', () => {
    fetchCards.mockReturnValue(new Promise(() => {}))

    render(<Dashboard locked />)

    expect(
      screen.getByRole('status', { name: 'Loading dashboard' }),
    ).toBeInTheDocument()
  })

  it('shows the cards once they load', async () => {
    await renderDashboard({ cards: [cardRecord({ title: 'Coming Soon' })] })

    expect(
      await screen.findByRole('heading', { name: 'Coming Soon' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders one grid item per card', async () => {
    await renderDashboard({
      cards: [
        cardRecord({ id: 1, slug: 'a', title: 'First' }),
        cardRecord({ id: 2, slug: 'b', title: 'Second' }),
      ],
    })

    expect(
      await screen.findByRole('heading', { name: 'First' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Second' })).toBeInTheDocument()
  })

  it('shows an error when the cards cannot be loaded', async () => {
    fetchCards.mockRejectedValue(new Error('Failed to fetch cards'))
    render(<Dashboard locked />)

    expect(
      await screen.findByText('Unable to load dashboard'),
    ).toBeInTheDocument()
    expect(screen.getByText('Failed to fetch cards')).toBeInTheDocument()
  })

  it('tells the user the backend may be down', async () => {
    fetchCards.mockRejectedValue(new Error('Failed to fetch cards'))
    render(<Dashboard locked />)

    expect(
      await screen.findByText('Make sure the backend is running on port 5001'),
    ).toBeInTheDocument()
  })

  it('renders an empty grid when there are no cards', async () => {
    await renderDashboard({ cards: [] })

    expect(renderedLayout()).toEqual([])
  })
})

describe('layout computation', () => {
  it('uses the stored layout when the card has one', async () => {
    await renderDashboard({
      cards: [cardRecord({ id: 7, layout: { x: 2, y: 3, w: 6, h: 5 } })],
    })

    expect(renderedLayout()[0]).toMatchObject({
      i: '7',
      x: 2,
      y: 3,
      w: 6,
      h: 5,
    })
  })

  it('keeps stored zero coordinates instead of computing a fallback', async () => {
    /* A card dragged to the top-left legitimately stores x:0/y:0. Those are
       falsy, so a `||` fallback would silently relocate it on next load. The
       second and third cards are what make this detectable: their computed
       fallbacks differ from zero. */
    await renderDashboard({
      cards: [
        cardRecord({ id: 1, slug: 'a', layout: { x: 0, y: 0, w: 6, h: 4 } }),
        cardRecord({ id: 2, slug: 'b', layout: { x: 0, y: 0, w: 6, h: 4 } }),
        cardRecord({ id: 3, slug: 'c', layout: { x: 0, y: 0, w: 6, h: 4 } }),
      ],
    })

    expect(renderedLayout()).toMatchObject([
      { i: '1', x: 0, y: 0 },
      { i: '2', x: 0, y: 0 }, // a `||` fallback would put this at x:6
      { i: '3', x: 0, y: 0 }, // and this at y:4
    ])
  })

  it('keeps stored zero dimensions instead of computing a fallback', async () => {
    /* Guards the `??` operator rather than a reachable board state: minW/minH
       of 2 mean the grid will not itself store a zero width. Kept so the
       fallback operator stays consistent across all four coordinates. */
    await renderDashboard({
      cards: [cardRecord({ id: 1, layout: { x: 0, y: 0, w: 0, h: 0 } })],
    })

    expect(renderedLayout()[0]).toMatchObject({ i: '1', w: 0, h: 0 })
  })

  it('falls back to a computed position when the card has no layout', async () => {
    await renderDashboard({
      cards: [
        cardRecord({ id: 1, slug: 'a', layout: {} }),
        cardRecord({ id: 2, slug: 'b', layout: {} }),
        cardRecord({ id: 3, slug: 'c', layout: {} }),
      ],
    })

    expect(renderedLayout()).toMatchObject([
      { i: '1', x: 0, y: 0, w: 6, h: 4 },
      { i: '2', x: 6, y: 0, w: 6, h: 4 },
      { i: '3', x: 0, y: 4, w: 6, h: 4 },
    ])
  })

  it('applies minimum dimensions to every item', async () => {
    await renderDashboard()

    expect(renderedLayout()[0]).toMatchObject({ minW: 2, minH: 2 })
  })
})

describe('lock state', () => {
  it('disables dragging and resizing when locked', async () => {
    await renderDashboard({ locked: true })

    const gridEl = screen.getByTestId('grid')
    expect(gridEl.dataset.dragEnabled).toBe('false')
    expect(gridEl.dataset.resizeEnabled).toBe('false')
  })

  it('enables dragging and resizing when unlocked', async () => {
    await renderDashboard({ locked: false })

    const gridEl = screen.getByTestId('grid')
    expect(gridEl.dataset.dragEnabled).toBe('true')
    expect(gridEl.dataset.resizeEnabled).toBe('true')
  })
})

describe('persisting layout changes', () => {
  const MOVED = [{ i: '1', x: 5, y: 6, w: 3, h: 2 }]

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** Fire a layout change and let the debounce window elapse. */
  async function changeLayoutAndSettle(layout, { advanceBy = 500 } = {}) {
    await act(async () => {
      grid.onLayoutChange(layout)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(advanceBy)
    })
  }

  it('saves the new layout after the debounce window', async () => {
    await renderDashboard({ locked: false })

    await changeLayoutAndSettle(MOVED)

    expect(updateCard).toHaveBeenCalledWith(1, {
      layout: { x: 5, y: 6, w: 3, h: 2 },
    })
  })

  it('does not save before the debounce window elapses', async () => {
    await renderDashboard({ locked: false })

    await changeLayoutAndSettle(MOVED, { advanceBy: 499 })

    expect(updateCard).not.toHaveBeenCalled()
  })

  it('coalesces a burst of changes into a single save', async () => {
    await renderDashboard({ locked: false })

    await act(async () => {
      grid.onLayoutChange([{ i: '1', x: 1, y: 0, w: 3, h: 2 }])
      grid.onLayoutChange([{ i: '1', x: 2, y: 0, w: 3, h: 2 }])
      grid.onLayoutChange([{ i: '1', x: 3, y: 0, w: 3, h: 2 }])
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(updateCard).toHaveBeenCalledTimes(1)
    expect(updateCard).toHaveBeenCalledWith(1, {
      layout: { x: 3, y: 0, w: 3, h: 2 },
    })
  })

  it('does not save a layout identical to the stored one', async () => {
    await renderDashboard({
      locked: false,
      cards: [cardRecord({ id: 1, layout: { x: 0, y: 0, w: 4, h: 4 } })],
    })

    await changeLayoutAndSettle([{ i: '1', x: 0, y: 0, w: 4, h: 4 }])

    expect(updateCard).not.toHaveBeenCalled()
  })

  it('saves only the cards that actually moved', async () => {
    await renderDashboard({
      locked: false,
      cards: [
        cardRecord({ id: 1, slug: 'a', layout: { x: 0, y: 0, w: 4, h: 4 } }),
        cardRecord({ id: 2, slug: 'b', layout: { x: 4, y: 0, w: 4, h: 4 } }),
      ],
    })

    await changeLayoutAndSettle([
      { i: '1', x: 0, y: 0, w: 4, h: 4 },
      { i: '2', x: 8, y: 0, w: 4, h: 4 },
    ])

    expect(updateCard).toHaveBeenCalledTimes(1)
    expect(updateCard).toHaveBeenCalledWith(2, {
      layout: { x: 8, y: 0, w: 4, h: 4 },
    })
  })

  it('ignores layout items with no matching card', async () => {
    await renderDashboard({ locked: false })

    await changeLayoutAndSettle([{ i: '999', x: 5, y: 5, w: 2, h: 2 }])

    expect(updateCard).not.toHaveBeenCalled()
  })

  it('reflects the saved layout in the grid it renders next', async () => {
    await renderDashboard({ locked: false })

    await changeLayoutAndSettle(MOVED)

    expect(renderedLayout()[0]).toMatchObject({
      i: '1',
      x: 5,
      y: 6,
      w: 3,
      h: 2,
    })
  })

  it('does not leave the pending save running after unmount', async () => {
    /* The debounced callback is a queued write to the API. Unmounting inside
       the window must cancel it, not fire it against a dead component. */
    const { unmount } = await renderDashboard({ locked: false })

    await act(async () => {
      grid.onLayoutChange(MOVED)
    })
    unmount()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(updateCard).not.toHaveBeenCalled()
  })

  it('survives a failed save without an unhandled rejection', async () => {
    updateCard.mockRejectedValue(new Error('Failed to update card'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    await renderDashboard({ locked: false })

    await changeLayoutAndSettle(MOVED)

    expect(updateCard).toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalled()
  })

  describe('the lock guard', () => {
    it('does not save while locked, even after the user has unlocked once', async () => {
      const { rerender } = await renderDashboard({ locked: false })
      rerender(<Dashboard locked />)

      await changeLayoutAndSettle(MOVED)

      expect(updateCard).not.toHaveBeenCalled()
    })

    it('persists a layout the grid emits on mount', async () => {
      /* react-grid-layout compacts as it mounts and reports the result. That
         is treated like any other layout change, so storage ends up matching
         what is actually on screen. Deliberate, not incidental: an earlier
         `hasUnlocked` ref was meant to suppress this and could never fire,
         because the grid is only rendered once loading is done. */
      grid.emitOnMount = true
      grid.mountLayout = [{ i: '1', x: 7, y: 7, w: 2, h: 2 }]

      await renderDashboard({
        locked: false,
        cards: [cardRecord({ id: 1, layout: { x: 0, y: 0, w: 4, h: 4 } })],
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500)
      })

      expect(updateCard).toHaveBeenCalledWith(1, {
        layout: { x: 7, y: 7, w: 2, h: 2 },
      })
    })

    it('does not persist a mount echo that matches the stored layout', async () => {
      /* The unchanged-layout early return is what keeps the common case a
         no-op, so a plain page load writes nothing. */
      grid.emitOnMount = true

      await renderDashboard({
        locked: false,
        cards: [cardRecord({ id: 1, layout: { x: 0, y: 0, w: 4, h: 4 } })],
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500)
      })

      expect(updateCard).not.toHaveBeenCalled()
    })

    it('does not persist a mount echo while locked', async () => {
      grid.emitOnMount = true
      grid.mountLayout = [{ i: '1', x: 7, y: 7, w: 2, h: 2 }]

      await renderDashboard({
        locked: true,
        cards: [cardRecord({ id: 1, layout: { x: 0, y: 0, w: 4, h: 4 } })],
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500)
      })

      expect(updateCard).not.toHaveBeenCalled()
    })
  })
})

describe('drag handle wiring', () => {
  /* The selector Dashboard gives the grid and the class Card renders have to
     agree. They are separate files, so nothing but this test catches a drift
     that silently disables dragging in the browser. */

  it('hands the grid a selector matching the class Card renders', async () => {
    await renderDashboard({ locked: false })

    const handle = document.querySelector(`.${DRAG_HANDLE_CLASS}`)
    expect(handle).not.toBeNull()
    expect(screen.getByTestId('grid').dataset.dragHandle).toBe(
      `.${DRAG_HANDLE_CLASS}`,
    )
  })

  it('renders no drag handle while locked', async () => {
    await renderDashboard({ locked: true })

    expect(document.querySelector(`.${DRAG_HANDLE_CLASS}`)).toBeNull()
  })
})
