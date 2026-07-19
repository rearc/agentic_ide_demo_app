import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Dashboard from './Dashboard'
import { fetchCards, updateCard } from '../api'

vi.mock('../api', () => ({
  fetchCards: vi.fn(),
  updateCard: vi.fn(),
  fetchCardData: vi.fn(() => Promise.resolve({})),
  fetchTodos: vi.fn(() => Promise.resolve([])),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}))

// react-grid-layout owns drag/resize maths and needs real layout boxes, which
// jsdom does not provide. Stub it so these tests cover Dashboard's own logic:
// which layout it computes, and when it decides to persist one.
const grid = vi.hoisted(() => ({ onLayoutChange: null }))

vi.mock('react-grid-layout', () => ({
  GridLayout: ({
    children,
    layout,
    dragConfig,
    resizeConfig,
    onLayoutChange,
  }) => {
    grid.onLayoutChange = onLayoutChange
    return (
      <div
        data-testid="grid"
        data-layout={JSON.stringify(layout)}
        data-drag-enabled={String(dragConfig?.enabled)}
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
}))

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
  vi.clearAllMocks()
  grid.onLayoutChange = null
})

describe('loading and error states', () => {
  it('shows the cards once they load', async () => {
    await renderDashboard({ cards: [cardRecord({ title: 'Coming Soon' })] })

    expect(
      await screen.findByRole('heading', { name: 'Coming Soon' }),
    ).toBeInTheDocument()
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
    updateCard.mockResolvedValue({})

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
    updateCard.mockResolvedValue({})

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
    updateCard.mockResolvedValue({})

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
    updateCard.mockResolvedValue({})

    await changeLayoutAndSettle(MOVED)

    expect(renderedLayout()[0]).toMatchObject({
      i: '1',
      x: 5,
      y: 6,
      w: 3,
      h: 2,
    })
  })

  describe('while locked', () => {
    it('does not save layout changes', async () => {
      await renderDashboard({ locked: true })

      await changeLayoutAndSettle(MOVED)

      expect(updateCard).not.toHaveBeenCalled()
    })

    it('does not save changes fired before the user has ever unlocked', async () => {
      /* react-grid-layout emits an onLayoutChange on mount. The hasUnlocked
         guard exists so that initial echo is not written back to the API. */
      await renderDashboard({ locked: true })

      await changeLayoutAndSettle([{ i: '1', x: 9, y: 9, w: 2, h: 2 }])

      expect(updateCard).not.toHaveBeenCalled()
    })
  })
})
