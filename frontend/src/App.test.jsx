import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

// Dashboard and the brand lockup have their own tests; stubbing them keeps this
// file about App's own job: the clock, and the lock toggle it owns.
vi.mock('./components/Dashboard', () => ({
  default: ({ locked }) => (
    <div data-testid="dashboard" data-locked={String(locked)} />
  ),
}))

vi.mock('./components/brand/AnimatedLabsLockup', () => ({
  default: ({ title }) => <div data-testid="lockup">{title}</div>,
}))

function dashboardLocked() {
  return screen.getByTestId('dashboard').dataset.locked
}

describe('chrome', () => {
  it('renders the brand lockup and product name', () => {
    render(<App />)

    expect(screen.getByTestId('lockup')).toHaveTextContent('Rearc AI Labs')
    expect(
      screen.getByRole('heading', { name: 'Control Center' }),
    ).toBeInTheDocument()
  })

  it('renders the dashboard', () => {
    render(<App />)

    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
  })
})

describe('lock toggle', () => {
  it('starts locked', () => {
    render(<App />)

    expect(dashboardLocked()).toBe('true')
    expect(
      screen.getByRole('button', { name: 'Customize layout' }),
    ).toBeInTheDocument()
  })

  it('unlocks the dashboard when clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Customize layout' }))

    expect(dashboardLocked()).toBe('false')
    expect(
      screen.getByRole('button', { name: 'Lock layout' }),
    ).toBeInTheDocument()
  })

  it('locks it again on a second click', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Customize layout' }))
    await user.click(screen.getByRole('button', { name: 'Lock layout' }))

    expect(dashboardLocked()).toBe('true')
  })

  it('shows the drag hint only while unlocked', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(
      screen.queryByText(/changes save automatically/),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Customize layout' }))

    expect(screen.getByText(/changes save automatically/)).toBeInTheDocument()
  })
})

describe('clock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T14:30:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the current time and date', () => {
    render(<App />)

    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
    expect(screen.getByText(/July 19/)).toBeInTheDocument()
  })

  it('advances as time passes', () => {
    render(<App />)
    const before = screen.getByText(/\d{1,2}:\d{2}/).textContent

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByText(/\d{1,2}:\d{2}/).textContent).not.toBe(before)
  })

  it('clears its interval on unmount', () => {
    /* FE-6: an interval left running after unmount leaks and keeps setting
       state on a dead component. */
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = render(<App />)

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
