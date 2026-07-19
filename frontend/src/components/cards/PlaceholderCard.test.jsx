import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import PlaceholderCard from './PlaceholderCard'

describe('PlaceholderCard', () => {
  it('invites the audience to pick a widget', () => {
    render(<PlaceholderCard />)

    expect(screen.getByText('What should we build here?')).toBeInTheDocument()
  })

  it('renders without any props, since it is the unknown-source fallback', () => {
    expect(() => render(<PlaceholderCard />)).not.toThrow()
  })
})
