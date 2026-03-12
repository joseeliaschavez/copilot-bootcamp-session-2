const request = require('supertest');
const { app, db } = require('../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

// Test helpers
const createItem = async ({ name = 'Temp Item to Delete', dueDate } = {}) => {
  const response = await request(app)
    .post('/api/items')
    .send({ name, dueDate })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check if items have the expected structure
      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('due_date');
      expect(item).toHaveProperty('created_at');
    });

    it('should return items sorted by due date descending with undated items last', async () => {
      const newestDueDate = await createItem({ name: 'Due 2027', dueDate: '2027-12-31' });
      const middleDueDate = await createItem({ name: 'Due 2026', dueDate: '2026-06-15' });
      const withoutDueDate = await createItem({ name: 'No Due Date', dueDate: null });

      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);

      const ids = response.body.map((item) => item.id);
      expect(ids.indexOf(newestDueDate.id)).toBeLessThan(ids.indexOf(middleDueDate.id));
      expect(ids.indexOf(middleDueDate.id)).toBeLessThan(ids.indexOf(withoutDueDate.id));
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = { name: 'Test Item' };
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body.due_date).toBeNull();
      expect(response.body).toHaveProperty('created_at');
    });

    it('should create a new item with a due date', async () => {
      const newItem = { name: 'Task with due date', dueDate: '2026-11-01' };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newItem.name);
      expect(response.body.due_date).toBe(newItem.dueDate);
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if due date is invalid', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Invalid date', dueDate: '11/01/2026' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Due date must be in YYYY-MM-DD format');
    });
  });

  describe('PATCH /api/items/:id', () => {
    it('should update item name and due date', async () => {
      const item = await createItem({ name: 'Original', dueDate: '2026-01-01' });

      const response = await request(app)
        .patch(`/api/items/${item.id}`)
        .send({ name: 'Updated', dueDate: '2026-12-25' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: item.id,
        name: 'Updated',
        due_date: '2026-12-25',
      });
    });

    it('should allow clearing due date', async () => {
      const item = await createItem({ name: 'Task', dueDate: '2026-02-10' });

      const response = await request(app)
        .patch(`/api/items/${item.id}`)
        .send({ dueDate: null })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.due_date).toBeNull();
    });

    it('should return 400 when no fields are provided', async () => {
      const item = await createItem({ name: 'Task' });

      const response = await request(app)
        .patch(`/api/items/${item.id}`)
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'At least one field (name or dueDate) is required');
    });

    it('should return 400 for invalid due date format', async () => {
      const item = await createItem({ name: 'Task' });

      const response = await request(app)
        .patch(`/api/items/${item.id}`)
        .send({ dueDate: '2026/01/20' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Due date must be in YYYY-MM-DD format');
    });

    it('should return 404 when item does not exist', async () => {
      const response = await request(app)
        .patch('/api/items/999999')
        .send({ name: 'Updated' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an existing item', async () => {
      const item = await createItem('Item To Be Deleted');

      const deleteResponse = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: item.id });

      const deleteAgain = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 404 when item does not exist', async () => {
      const response = await request(app).delete('/api/items/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/items/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });
});