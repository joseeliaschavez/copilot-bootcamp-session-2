import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

let items = [];

// Mock server to intercept API requests
const server = setupServer(
  rest.get('/api/items', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(items));
  }),
  
  rest.post('/api/items', (req, res, ctx) => {
    const { name, dueDate } = req.body;
    
    if (!name || name.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }

    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return res(ctx.status(400), ctx.json({ error: 'Due date must be in YYYY-MM-DD format' }));
    }

    const newItem = {
      id: Math.max(...items.map((item) => item.id), 0) + 1,
      name,
      due_date: dueDate || null,
      created_at: '2026-03-12T00:00:00.000Z',
    };

    items = [...items, newItem];
    return res(ctx.status(201), ctx.json(newItem));
  }),

  rest.patch('/api/items/:id', (req, res, ctx) => {
    const id = Number(req.params.id);
    const { name, dueDate } = req.body;

    const target = items.find((item) => item.id === id);
    if (!target) {
      return res(ctx.status(404), ctx.json({ error: 'Item not found' }));
    }

    const updated = {
      ...target,
      name: typeof name === 'string' ? name : target.name,
      due_date: dueDate === undefined ? target.due_date : dueDate,
    };

    items = items.map((item) => (item.id === id ? updated : item));
    return res(ctx.status(200), ctx.json(updated));
  }),

  rest.delete('/api/items/:id', (req, res, ctx) => {
    const id = Number(req.params.id);
    const exists = items.some((item) => item.id === id);

    if (!exists) {
      return res(ctx.status(404), ctx.json({ error: 'Item not found' }));
    }

    items = items.filter((item) => item.id !== id);
    return res(ctx.status(200), ctx.json({ message: 'Item deleted successfully', id }));
  })
);

const resetItems = () => {
  items = [
    { id: 1, name: 'High Priority', due_date: '2027-01-15', created_at: '2026-01-01T00:00:00.000Z' },
    { id: 2, name: 'Medium Priority', due_date: '2026-08-20', created_at: '2026-01-02T00:00:00.000Z' },
    { id: 3, name: 'No Deadline Yet', due_date: null, created_at: '2026-01-03T00:00:00.000Z' },
  ];
};

beforeAll(() => server.listen());
beforeEach(() => resetItems());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the updated header', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'TODO Timeline' })).toBeInTheDocument();
    expect(screen.getByText('Create, edit, and prioritize tasks with due dates in one place.')).toBeInTheDocument();
  });

  test('loads and displays items in descending due date order', async () => {
    render(<App />);

    const listedItems = await screen.findAllByRole('listitem');
    expect(within(listedItems[0]).getByText('High Priority')).toBeInTheDocument();
    expect(within(listedItems[1]).getByText('Medium Priority')).toBeInTheDocument();
    expect(within(listedItems[2]).getByText('No Deadline Yet')).toBeInTheDocument();
  });

  test('adds a new item with due date', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('High Priority');

    await user.type(screen.getByLabelText('Task name'), 'New Planned Task');
    await user.type(screen.getByLabelText('Due date'), '2028-02-14');
    await user.click(screen.getByRole('button', { name: 'Add Task' }));

    expect(await screen.findByText('New Planned Task')).toBeInTheDocument();
    expect(screen.getByText('Due: 2028-02-14')).toBeInTheDocument();
  });

  test('edits an existing item', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Medium Priority');

    const targetItem = screen.getByText('Medium Priority').closest('li');
    await user.click(within(targetItem).getByRole('button', { name: 'Edit' }));

    const nameInput = within(targetItem).getByLabelText('Task name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Medium Priority Updated');

    const dueInput = within(targetItem).getByLabelText('Due date');
    await user.clear(dueInput);
    await user.type(dueInput, '2029-03-01');

    await user.click(within(targetItem).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Medium Priority Updated')).toBeInTheDocument();
    expect(screen.getByText('Due: 2029-03-01')).toBeInTheDocument();
  });

  test('deletes an item', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('No Deadline Yet');

    const targetItem = screen.getByText('No Deadline Yet').closest('li');
    await user.click(within(targetItem).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.queryByText('No Deadline Yet')).not.toBeInTheDocument();
    });
  });

  test('handles API error on initial load', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to fetch data');
  });
});