import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TodoCard from './TodoCard'
import { createTodo, deleteTodo, fetchTodos, updateTodo } from '../../api'

vi.mock('../../api', () => ({
  fetchTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}))

const CARD = { id: 5 }

function todo(overrides = {}) {
  return { id: 1, card_id: 5, text: 'A task', done: false, ...overrides }
}

/** Render and wait for the initial load to settle. */
async function renderCard(items = []) {
  fetchTodos.mockResolvedValue(items)
  const result = render(<TodoCard card={CARD} />)
  await waitFor(() => expect(fetchTodos).toHaveBeenCalled())
  return result
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('loading todos', () => {
  it('requests the todos for its own card', async () => {
    await renderCard()

    expect(fetchTodos).toHaveBeenCalledWith(5)
  })

  it('renders the todos it loaded', async () => {
    await renderCard([
      todo({ id: 1, text: 'First' }),
      todo({ id: 2, text: 'Second' }),
    ])

    expect(
      await screen.findByRole('button', { name: 'First' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Second' })).toBeInTheDocument()
  })

  it('shows an empty state when there are no todos', async () => {
    await renderCard([])

    expect(await screen.findByText('No tasks yet.')).toBeInTheDocument()
  })

  it('shows an error when loading fails', async () => {
    fetchTodos.mockRejectedValue(new Error('Card not found'))
    render(<TodoCard card={CARD} />)

    expect(await screen.findByText('Card not found')).toBeInTheDocument()
  })

  it('reflects the done state on the checkbox', async () => {
    await renderCard([todo({ done: true })])

    expect(await screen.findByRole('checkbox')).toBeChecked()
  })
})

describe('adding a todo', () => {
  it('creates the todo and appends it to the list', async () => {
    const user = userEvent.setup()
    await renderCard([])
    createTodo.mockResolvedValue(todo({ id: 2, text: 'Write tests' }))

    await user.type(screen.getByPlaceholderText('Add a task…'), 'Write tests')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(createTodo).toHaveBeenCalledWith(5, 'Write tests')
    expect(
      await screen.findByRole('button', { name: 'Write tests' }),
    ).toBeInTheDocument()
  })

  it('clears the input after a successful add', async () => {
    const user = userEvent.setup()
    await renderCard([])
    createTodo.mockResolvedValue(todo({ id: 2, text: 'Write tests' }))
    const input = screen.getByPlaceholderText('Add a task…')

    await user.type(input, 'Write tests')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(input).toHaveValue(''))
  })

  it('trims whitespace before sending', async () => {
    const user = userEvent.setup()
    await renderCard([])
    createTodo.mockResolvedValue(todo({ id: 2, text: 'Write tests' }))

    await user.type(
      screen.getByPlaceholderText('Add a task…'),
      '   Write tests   ',
    )
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(createTodo).toHaveBeenCalledWith(5, 'Write tests')
  })

  it('ignores an empty submission', async () => {
    const user = userEvent.setup()
    await renderCard([])

    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(createTodo).not.toHaveBeenCalled()
  })

  it('ignores a whitespace-only submission', async () => {
    const user = userEvent.setup()
    await renderCard([])

    await user.type(screen.getByPlaceholderText('Add a task…'), '   ')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(createTodo).not.toHaveBeenCalled()
  })

  it('surfaces a failure and keeps the typed text', async () => {
    const user = userEvent.setup()
    await renderCard([])
    createTodo.mockRejectedValue(new Error('text is required'))
    const input = screen.getByPlaceholderText('Add a task…')

    await user.type(input, 'Write tests')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('text is required')).toBeInTheDocument()
    expect(input).toHaveValue('Write tests')
  })
})

describe('toggling a todo', () => {
  it('marks an open todo done', async () => {
    const user = userEvent.setup()
    await renderCard([todo({ done: false })])
    updateTodo.mockResolvedValue(todo({ done: true }))

    await user.click(await screen.findByRole('checkbox'))

    expect(updateTodo).toHaveBeenCalledWith(1, { done: true })
    await waitFor(() => expect(screen.getByRole('checkbox')).toBeChecked())
  })

  it('reopens a completed todo', async () => {
    const user = userEvent.setup()
    await renderCard([todo({ done: true })])
    updateTodo.mockResolvedValue(todo({ done: false }))

    await user.click(await screen.findByRole('checkbox'))

    expect(updateTodo).toHaveBeenCalledWith(1, { done: false })
  })

  it('reverts the optimistic update when the request fails', async () => {
    const user = userEvent.setup()
    await renderCard([todo({ done: false })])
    updateTodo.mockRejectedValue(new Error('done must be a boolean'))

    await user.click(await screen.findByRole('checkbox'))

    expect(
      await screen.findByText('done must be a boolean'),
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('checkbox')).not.toBeChecked())
  })
})

describe('editing a todo', () => {
  /** Click a todo's text to open its inline editor, scoped to that list item.
   *  Scoping matters: the "add a task" field is also a textbox. */
  async function openEditor(user, text) {
    const item = (await screen.findByRole('button', { name: text })).closest(
      'li',
    )
    await user.click(within(item).getByRole('button', { name: text }))
    return { item, editor: within(item).getByRole('textbox') }
  }

  it('opens an editor seeded with the current text', async () => {
    const user = userEvent.setup()
    await renderCard([todo({ text: 'A task' })])

    const { editor } = await openEditor(user, 'A task')

    expect(editor).toHaveValue('A task')
  })

  it('commits the edit on Enter', async () => {
    const user = userEvent.setup()
    await renderCard([todo({ text: 'A task' })])
    updateTodo.mockResolvedValue(todo({ text: 'Edited' }))

    const { editor } = await openEditor(user, 'A task')
    await user.clear(editor)
    await user.type(editor, 'Edited{Enter}')

    expect(updateTodo).toHaveBeenCalledWith(1, { text: 'Edited' })
    expect(
      await screen.findByRole('button', { name: 'Edited' }),
    ).toBeInTheDocument()
  })

  it('trims whitespace from the edited text', async () => {
    const user = userEvent.setup()
    await renderCard([todo({ text: 'A task' })])
    updateTodo.mockResolvedValue(todo({ text: 'Edited' }))

    const { editor } = await openEditor(user, 'A task')
    await user.clear(editor)
    await user.type(editor, '   Edited   {Enter}')

    expect(updateTodo).toHaveBeenCalledWith(1, { text: 'Edited' })
  })

  it('abandons the edit on Escape', async () => {
    const user = userEvent.setup()
    await renderCard([todo({ text: 'A task' })])

    const { editor } = await openEditor(user, 'A task')
    await user.type(editor, ' changed{Escape}')

    expect(updateTodo).not.toHaveBeenCalled()
    expect(
      await screen.findByRole('button', { name: 'A task' }),
    ).toBeInTheDocument()
  })

  it('discards an edit that empties the text', async () => {
    const user = userEvent.setup()
    await renderCard([todo({ text: 'A task' })])

    const { editor } = await openEditor(user, 'A task')
    await user.clear(editor)
    await user.keyboard('{Enter}')

    expect(updateTodo).not.toHaveBeenCalled()
    expect(
      await screen.findByRole('button', { name: 'A task' }),
    ).toBeInTheDocument()
  })

  it('commits the edit when the editor loses focus', async () => {
    const user = userEvent.setup()
    await renderCard([todo({ text: 'A task' })])
    updateTodo.mockResolvedValue(todo({ text: 'A taskEdited' }))

    const { editor } = await openEditor(user, 'A task')
    await user.type(editor, 'Edited')
    await user.tab()

    await waitFor(() =>
      expect(updateTodo).toHaveBeenCalledWith(1, { text: 'A taskEdited' }),
    )
  })

  it('surfaces a failed edit', async () => {
    const user = userEvent.setup()
    await renderCard([todo({ text: 'A task' })])
    updateTodo.mockRejectedValue(new Error('text must be a non-empty string'))

    const { editor } = await openEditor(user, 'A task')
    await user.type(editor, '!{Enter}')

    expect(
      await screen.findByText('text must be a non-empty string'),
    ).toBeInTheDocument()
  })
})

describe('deleting a todo', () => {
  it('removes the todo from the list', async () => {
    const user = userEvent.setup()
    await renderCard([
      todo({ id: 1, text: 'First' }),
      todo({ id: 2, text: 'Second' }),
    ])
    deleteTodo.mockResolvedValue(undefined)

    const first = (
      await screen.findByRole('button', { name: 'First' })
    ).closest('li')
    await user.click(within(first).getByTitle('Delete'))

    expect(deleteTodo).toHaveBeenCalledWith(1)
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'First' }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: 'Second' })).toBeInTheDocument()
  })

  it('keeps the todo and shows an error when deletion fails', async () => {
    const user = userEvent.setup()
    await renderCard([todo({ text: 'A task' })])
    deleteTodo.mockRejectedValue(new Error('Todo not found'))

    const item = (
      await screen.findByRole('button', { name: 'A task' })
    ).closest('li')
    await user.click(within(item).getByTitle('Delete'))

    expect(await screen.findByText('Todo not found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'A task' })).toBeInTheDocument()
  })
})
