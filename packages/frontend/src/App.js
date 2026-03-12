import React, { useState, useEffect } from 'react';
import './App.css';

const sortItems = (items) => {
  const getDueTimestamp = (item) => {
    if (!item.due_date) {
      return null;
    }

    const timestamp = new Date(`${item.due_date}T00:00:00.000Z`).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  };

  return [...items].sort((left, right) => {
    const leftDue = getDueTimestamp(left);
    const rightDue = getDueTimestamp(right);

    if (leftDue === null && rightDue !== null) {
      return 1;
    }

    if (leftDue !== null && rightDue === null) {
      return -1;
    }

    if (leftDue !== null && rightDue !== null && leftDue !== rightDue) {
      return rightDue - leftDue;
    }

    const leftCreated = new Date(left.created_at).getTime();
    const rightCreated = new Date(right.created_at).getTime();
    return rightCreated - leftCreated;
  });
};

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDueDate, setNewItemDueDate] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setItems(sortItems(result));
      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newItemName.trim(),
          dueDate: newItemDueDate || null,
        }),
      });

      if (!response.ok) {
        const responseError = await response.json().catch(() => ({}));
        throw new Error(responseError.error || 'Failed to add item');
      }

      const result = await response.json();
      setItems((previousItems) => sortItems([...previousItems, result]));
      setNewItemName('');
      setNewItemDueDate('');
      setError(null);
    } catch (err) {
      setError('Error adding item: ' + err.message);
      console.error('Error adding item:', err);
    }
  };

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditDueDate(item.due_date || '');
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditName('');
    setEditDueDate('');
  };

  const handleEditSubmit = async (event, itemId) => {
    event.preventDefault();
    if (!editName.trim()) {
      setError('Error updating item: Item name must be a non-empty string');
      return;
    }

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName.trim(),
          dueDate: editDueDate || null,
        }),
      });

      if (!response.ok) {
        const responseError = await response.json().catch(() => ({}));
        throw new Error(responseError.error || 'Failed to update item');
      }

      const result = await response.json();
      setItems((previousItems) =>
        sortItems(previousItems.map((item) => (item.id === itemId ? result : item)))
      );
      cancelEdit();
      setError(null);
    } catch (err) {
      setError('Error updating item: ' + err.message);
      console.error('Error updating item:', err);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const responseError = await response.json().catch(() => ({}));
        throw new Error(responseError.error || 'Failed to delete item');
      }

      setItems((previousItems) => previousItems.filter((item) => item.id !== itemId));
      setError(null);

      if (editingItemId === itemId) {
        cancelEdit();
      }
    } catch (err) {
      setError('Error deleting item: ' + err.message);
      console.error('Error deleting item:', err);
    }
  };

  return (
    <div className="app-shell container">
      <header className="hero u-full-width">
        <p className="eyebrow">Task Planner</p>
        <h1>TODO Timeline</h1>
        <p className="hero-copy">Create, edit, and prioritize tasks with due dates in one place.</p>
      </header>

      <main className="grid-layout">
        <section className="panel add-item-panel" aria-label="Create task">
          <h2>Add Task</h2>
          <form className="task-form" onSubmit={handleCreateSubmit}>
            <label htmlFor="new-item-name">Task name</label>
            <input
              id="new-item-name"
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Enter task name"
              required
            />

            <label htmlFor="new-item-due-date">Due date</label>
            <input
              id="new-item-due-date"
              type="date"
              value={newItemDueDate}
              onChange={(e) => setNewItemDueDate(e.target.value)}
            />

            <button className="button-primary" type="submit">Add Task</button>
          </form>
        </section>

        <section className="panel items-panel" aria-label="Task list">
          <div className="list-heading">
            <h2>Tasks</h2>
            <p>Sorted by due date (latest first)</p>
          </div>

          {loading && <p>Loading data...</p>}
          {error && <p className="error" role="alert">{error}</p>}
          {!loading && (
            <ul className="task-list">
              {items.length > 0 ? (
                items.map((item) => (
                  <li key={item.id} className="task-item">
                    {editingItemId === item.id ? (
                      <form className="edit-form" onSubmit={(event) => handleEditSubmit(event, item.id)}>
                        <label htmlFor={`edit-name-${item.id}`}>Task name</label>
                        <input
                          id={`edit-name-${item.id}`}
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />

                        <label htmlFor={`edit-due-date-${item.id}`}>Due date</label>
                        <input
                          id={`edit-due-date-${item.id}`}
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                        />

                        <div className="action-row">
                          <button className="button-primary" type="submit">Save</button>
                          <button className="button-secondary" type="button" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="task-content">
                          <p className="task-name">{item.name}</p>
                          <p className="task-meta">Due: {item.due_date || 'No due date'}</p>
                        </div>
                        <div className="action-row">
                          <button className="button-secondary" type="button" onClick={() => startEdit(item)}>Edit</button>
                          <button className="button-danger" type="button" onClick={() => handleDelete(item.id)}>Delete</button>
                        </div>
                      </>
                    )}
                  </li>
                ))
              ) : (
                <p>No items found. Add some!</p>
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;