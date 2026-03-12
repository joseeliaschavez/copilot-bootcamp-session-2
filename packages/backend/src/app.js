const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateOnly = (value) => {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
};

const normalizeDueDateInput = (value) => {
  if (value === undefined) {
    return { provided: false };
  }

  if (value === null || value === '') {
    return { provided: true, value: null };
  }

  if (!isValidDateOnly(value)) {
    return { provided: true, error: 'Due date must be in YYYY-MM-DD format' };
  }

  return { provided: true, value };
};

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    due_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert some initial data
const initialItems = ['Item 1', 'Item 2', 'Item 3'];
const insertStmt = db.prepare('INSERT INTO items (name, due_date) VALUES (?, ?)');

initialItems.forEach(item => {
  insertStmt.run(item, null);
});

const getItemByIdStmt = db.prepare('SELECT * FROM items WHERE id = ?');
const getItemsStmt = db.prepare(`
  SELECT *
  FROM items
  ORDER BY
    CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
    due_date DESC,
    datetime(created_at) DESC,
    id DESC
`);
const deleteItemStmt = db.prepare('DELETE FROM items WHERE id = ?');
const updateItemStmt = db.prepare('UPDATE items SET name = ?, due_date = ? WHERE id = ?');

console.log('In-memory database initialized with sample data');

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// API Routes
app.get('/api/items', (req, res) => {
  try {
    const items = getItemsStmt.all();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const { name, dueDate } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const normalizedDueDate = normalizeDueDateInput(dueDate);
    if (normalizedDueDate.error) {
      return res.status(400).json({ error: normalizedDueDate.error });
    }

    const result = insertStmt.run(name.trim(), normalizedDueDate.value ?? null);
    const id = result.lastInsertRowid;

    const newItem = getItemByIdStmt.get(id);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = getItemByIdStmt.get(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const result = deleteItemStmt.run(id);

    if (result.changes > 0) {
      res.json({ message: 'Item deleted successfully', id: parseInt(id) });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.patch('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, dueDate } = req.body;

    if (!id || Number.isNaN(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const hasName = Object.prototype.hasOwnProperty.call(req.body, 'name');
    const normalizedDueDate = normalizeDueDateInput(dueDate);

    if (!hasName && !normalizedDueDate.provided) {
      return res.status(400).json({ error: 'At least one field (name or dueDate) is required' });
    }

    if (hasName && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'Item name must be a non-empty string' });
    }

    if (normalizedDueDate.error) {
      return res.status(400).json({ error: normalizedDueDate.error });
    }

    const existingItem = getItemByIdStmt.get(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updatedName = hasName ? name.trim() : existingItem.name;
    const updatedDueDate = normalizedDueDate.provided ? normalizedDueDate.value : existingItem.due_date;

    updateItemStmt.run(updatedName, updatedDueDate, id);

    const updatedItem = getItemByIdStmt.get(id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

module.exports = { app, db, insertStmt };