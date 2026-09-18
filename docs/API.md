# API Reference

Base URL (local Docker): `http://localhost:3000`

All request/response bodies are JSON. Protected routes require:

```
Authorization: Bearer <token>
```

Validation errors return `422` with a `details` array. Auth failures return `401`.
Not-found resources return `404`. Duplicate resources return `409`.

---

## Health

### `GET /health`
No auth required. Returns `{ "status": "ok" }` — used by the Docker healthcheck.

---

## Auth

### `POST /api/auth/register`
```json
{ "email": "user@example.com", "password": "password123" }
```
`201` → `{ "token": "...", "user": { "id": 1, "email": "user@example.com" } }`
`409` if the email is already registered.

### `POST /api/auth/login`
```json
{ "email": "user@example.com", "password": "password123" }
```
`200` → same shape as register. `401` on bad credentials.

---

## Categories
*(all require `Authorization`)*

| Method | Path                | Body                      | Notes                          |
|--------|---------------------|---------------------------|---------------------------------|
| GET    | `/api/categories`   | –                         | List the user's categories      |
| POST   | `/api/categories`   | `{ "name": "Food" }`      | `409` if name already exists    |
| PATCH  | `/api/categories/:id` | `{ "name": "Groceries" }` | Partial update                |
| DELETE | `/api/categories/:id` | –                       | `204` on success                |

---

## Expenses
*(all require `Authorization`)*

### `GET /api/expenses`
Query params (all optional): `page` (default 1), `pageSize` (default 20, max 100),
`categoryId`, `from` (`YYYY-MM-DD`), `to` (`YYYY-MM-DD`).

```json
{
  "data": [ { "id": 1, "title": "Lunch", "amount": "12.50", "spent_at": "2026-09-10", "category_id": 3, "notes": null } ],
  "pagination": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
}
```

### `GET /api/expenses/summary`
Total spend grouped by category for the current user.
```json
{ "data": [ { "categoryId": 3, "categoryName": "Food", "total": "42.00" } ] }
```

### `POST /api/expenses`
```json
{ "title": "Lunch", "amount": 12.5, "spentAt": "2026-09-10", "categoryId": 3, "notes": "with team" }
```
`categoryId` and `notes` are optional. `201` with the created expense.

### `GET /api/expenses/:id`
`200` with the expense, or `404` if it doesn't belong to the caller.

### `PATCH /api/expenses/:id`
Same shape as create, all fields optional (partial update).

### `DELETE /api/expenses/:id`
`204` on success.

---

## Error shape

```json
{ "error": "ValidationError", "message": "Invalid request payload", "details": [ { "path": "email", "message": "Invalid email" } ] }
```

`details` is only present for validation errors.
