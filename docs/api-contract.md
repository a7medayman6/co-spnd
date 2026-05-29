# Backend API Contract (MVP)

**Base URL**

```
/api/v1
```

**Auth**

* JWT (Bearer token)
* Access tokens expire after 30 days
* All routes except auth require authentication

---

## 1. Authentication

### Register

**POST** `/auth/register`

```json
{
  "email": "user@email.com",
  "password": "strongPassword",
  "name": "Ahmed"
}
```

**Response**

```json
{
  "accessToken": "jwt_token",
  "user": {
    "id": "userId",
    "email": "user@email.com",
    "name": "Ahmed"
  }
}
```

---

### Login

**POST** `/auth/login`

```json
{
  "email": "user@email.com",
  "password": "strongPassword"
}
```

**Response**

```json
{
  "accessToken": "jwt_token",
  "user": {
    "id": "userId",
    "email": "user@email.com",
    "name": "Ahmed"
  }
}
```

---

## 2. User

### Get Current User

**GET** `/users/me`

```json
{
  "id": "userId",
  "email": "user@email.com",
  "name": "Ahmed",
  "avatarUrl": null
}
```

---

### Update Profile

**PUT** `/users/me`

```json
{
  "name": "Ahmed Ayman",
  "avatarUrl": "https://..."
}
```

---

## 3. Workspaces

### Create Workspace

**POST** `/workspaces`

```json
{
  "name": "Trip to Dubai",
  "currency": "AED"
}
```

**Response**

```json
{
  "id": "workspaceId",
  "name": "Trip to Dubai",
  "currency": "AED",
  "createdBy": "userId"
}
```

> Currency is immutable after creation

---

### Get My Workspaces

**GET** `/workspaces`

```json
[
  {
    "id": "workspaceId",
    "name": "Trip to Dubai",
    "currency": "AED",
    "membersCount": 3,
    "createdBy": "userId"
  }
]
```

---

### Invite User to Workspace

**POST** `/workspaces/:workspaceId/invite`

```json
{
  "email": "friend@email.com"
}
```

```json
{
  "success": true
}
```

---

### Get Splitting Config

**GET** `/workspaces/:workspaceId/splitting-config`

Auth: workspace member required.

```json
[
  { "userId": "userId1", "name": "Ahmed", "percentage": 60 },
  { "userId": "userId2", "name": "Sara",  "percentage": 40 }
]
```

---

### Update Splitting Config

**PATCH** `/workspaces/:workspaceId/splitting-config`

Auth: workspace creator only. Percentages must sum to 100 (±0.01 tolerance).

```json
{
  "splittingConfig": [
    { "userId": "userId1", "percentage": 60 },
    { "userId": "userId2", "percentage": 40 }
  ]
}
```

Returns updated config in same shape as GET.

---

### Get Workspace Members

**GET** `/workspaces/:workspaceId/members`

```json
[
  {
    "id": "userId",
    "name": "Ahmed",
    "email": "user@email.com"
  }
]
```

---

## 4. Transactions

### Create Transaction

**POST** `/workspaces/:workspaceId/transactions`

```json
{
  "amount": 120.5,
  "category": "Food",
  "description": "Dinner",
  "date": "2026-01-30",
  "spenderId": "userId"
}
```

Rules:

* description, date, spenderId are optional
* spenderId defaults to logged-in user
* date defaults to today

---

### Get Transactions

**GET** `/workspaces/:workspaceId/transactions`

Query params:

```
?from=YYYY-MM-DD&to=YYYY-MM-DD
```

---

### Update Transaction

**PUT** `/transactions/:transactionId`

Rules:

* Only creator can update

---

### Delete Transaction

**DELETE** `/transactions/:transactionId`

Rules:

* Only creator can delete

---

## 5. Analytics

### My Analytics

**GET** `/analytics/me`

Query params:

```
?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Returns the logged-in user's own spending across all workspaces, grouped by
currency and by workspace.

```json
{
  "totalsByCurrency": [
    { "currency": "USD", "total": 2450, "transactionCount": 12 }
  ],
  "byCategory": [
    { "category": "Food", "currency": "USD", "total": 430 }
  ],
  "byWorkspace": [
    {
      "workspaceId": "workspaceId",
      "name": "Trip to Dubai",
      "currency": "AED",
      "userTotal": 1200,
      "workspaceTotal": 2450,
      "userTransactionCount": 6,
      "workspaceTransactionCount": 12,
      "byCategory": [
        { "category": "Food", "total": 430 }
      ]
    }
  ]
}

---

**GET** `/workspaces/:workspaceId/analytics`

Query params:

```
?from=YYYY-MM-DD&to=YYYY-MM-DD
```

```json
{
  "total": 2450,
  "byCategory": [],
  "byUser": []
}
```

---

### Trends

**GET** `/workspaces/:workspaceId/analytics/trends`

Query params:

```
?granularity=day|month&from=YYYY-MM-DD&to=YYYY-MM-DD
```

```json
{
  "granularity": "day",
  "data": [
    { "date": "2026-05-01", "total": 430.5 }
  ]
}
```

---

### Top Expenses

**GET** `/workspaces/:workspaceId/analytics/top-expenses`

Query params:

```
?limit=10&from=YYYY-MM-DD&to=YYYY-MM-DD
```

```json
{
  "expenses": [
    {
      "id": "txId",
      "amount": 850,
      "category": "Travel",
      "description": "Flight tickets",
      "date": "2026-05-10",
      "spenderName": "Ahmed"
    }
  ]
}
```

---

### Month Comparison

**GET** `/workspaces/:workspaceId/analytics/comparison`

No query params. Always compares current month-to-date vs full previous calendar month.

```json
{
  "current":  { "total": 2450, "from": "2026-05-01", "to": "2026-05-28" },
  "previous": { "total": 1980, "from": "2026-04-01", "to": "2026-04-30" },
  "delta": 470,
  "deltaPercent": 23.74
}
```

`deltaPercent` is `null` when previous total is 0.

---

### Category Trends

**GET** `/workspaces/:workspaceId/analytics/category-trends`

Query params:

```
?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Returns top 3 categories by total spend, broken down by month.

```json
{
  "months": ["2026-03", "2026-04", "2026-05"],
  "series": [
    { "category": "Food", "data": [430, 520, 380] },
    { "category": "Transport", "data": [120, 90, 150] },
    { "category": "Entertainment", "data": [0, 200, 50] }
  ]
}
```

---

## Authorization Rules

* User must belong to workspace
* Transactions editable by creator only

---

## Out of Scope

* Budgets
* Notifications
* Multi-currency per workspace
