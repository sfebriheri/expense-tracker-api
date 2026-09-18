import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';
import { createTestDb } from '../helpers/testDb';

describe('Expense Tracker API (integration)', () => {
  let app: Express;
  let token: string;

  beforeEach(async () => {
    const db = createTestDb();
    app = createApp(db);

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@example.com', password: 'password123' });
    token = registerRes.body.token;
  });

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('rejects registration with an invalid payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '123' });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('ValidationError');
  });

  it('rejects duplicate registration with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@example.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('logs in and receives a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(401);
  });

  it('rejects protected routes with a malformed token', async () => {
    const res = await request(app)
      .get('/api/expenses')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('creates a category, then an expense referencing it, then lists it', async () => {
    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Food' });
    expect(categoryRes.status).toBe(201);
    const categoryId = categoryRes.body.data.id;

    const expenseRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Lunch', amount: 12.5, spentAt: '2026-09-10', categoryId });
    expect(expenseRes.status).toBe(201);
    expect(expenseRes.body.data.title).toBe('Lunch');

    const listRes = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.pagination.total).toBe(1);
  });

  it('returns 404 when fetching a non-existent expense', async () => {
    const res = await request(app)
      .get('/api/expenses/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('updates and deletes an expense end-to-end', async () => {
    const createRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Taxi', amount: 8, spentAt: '2026-09-11' });
    const id = createRes.body.data.id;

    const updateRes = await request(app)
      .patch(`/api/expenses/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 9.5 });
    expect(updateRes.status).toBe(200);
    expect(Number(updateRes.body.data.amount)).toBe(9.5);

    const deleteRes = await request(app)
      .delete(`/api/expenses/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/expenses/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });

  it('returns a spending summary grouped by category', async () => {
    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Transport' });
    const categoryId = categoryRes.body.data.id;

    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bus', amount: 3, spentAt: '2026-09-01', categoryId });
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Train', amount: 7, spentAt: '2026-09-02', categoryId });

    const summaryRes = await request(app)
      .get('/api/expenses/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(summaryRes.status).toBe(200);
    expect(Number(summaryRes.body.data[0].total)).toBe(10);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
