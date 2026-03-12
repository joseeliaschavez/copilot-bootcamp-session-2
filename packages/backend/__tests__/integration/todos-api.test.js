const request = require('supertest');
const { app, db } = require('../../src/app');

afterAll(() => {
  if (db) {
    db.close();
  }
});

describe('TODO API integration', () => {
  it('creates, updates, and fetches a task with due date', async () => {
    const createResponse = await request(app)
      .post('/api/items')
      .send({ name: 'Integration Task', dueDate: '2026-09-15' })
      .set('Accept', 'application/json');

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      name: 'Integration Task',
      due_date: '2026-09-15',
    });

    const updateResponse = await request(app)
      .patch(`/api/items/${createResponse.body.id}`)
      .send({ name: 'Integration Task Updated', dueDate: '2027-01-01' })
      .set('Accept', 'application/json');

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toMatchObject({
      id: createResponse.body.id,
      name: 'Integration Task Updated',
      due_date: '2027-01-01',
    });

    const listResponse = await request(app).get('/api/items');
    expect(listResponse.status).toBe(200);

    const updated = listResponse.body.find((item) => item.id === createResponse.body.id);
    expect(updated).toBeDefined();
    expect(updated.name).toBe('Integration Task Updated');
    expect(updated.due_date).toBe('2027-01-01');
  });

  it('returns validation errors for malformed due date', async () => {
    const response = await request(app)
      .post('/api/items')
      .send({ name: 'Invalid Date Item', dueDate: '09-15-2026' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Due date must be in YYYY-MM-DD format' });
  });
});
