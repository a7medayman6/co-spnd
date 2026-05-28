# Enhanced Analytics — Design Spec

**Date:** 2026-05-28  
**Status:** Approved  
**Scope:** Backend API additions + Frontend `AnalyticsPage` update

---

## Overview

Extend Co-Spnd's analytics from a basic summary (total, by-category, by-user) to a rich set of insights: day-by-day and monthly spending trends, period comparison, and top expenses. All analytics remain workspace-scoped and date-filterable.

---

## API Design

### Approach

Three new sub-endpoints under `/workspaces/:workspaceId/analytics/`. The existing `GET /workspaces/:id/analytics` summary endpoint is **not modified**. All new endpoints share the same JWT + workspace-membership guard as existing analytics.

---

### 1. Trends

```
GET /workspaces/:workspaceId/analytics/trends
```

Query params:

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `granularity` | No | `day` | `day` or `month` |
| `from` | No | 30 days ago | ISO date string |
| `to` | No | today | ISO date string |

Response:

```json
{
  "granularity": "day",
  "data": [
    { "date": "2026-05-01", "total": 430.5 },
    { "date": "2026-05-02", "total": 0 },
    { "date": "2026-05-03", "total": 210.0 }
  ]
}
```

- Days/months with zero spending are included in the series (filled server-side or client-side).
- For `granularity=month`, `date` is `YYYY-MM` format.
- Implemented via MongoDB `$group` with `$dateToString` + `$sort`.

---

### 2. Top Expenses

```
GET /workspaces/:workspaceId/analytics/top-expenses
```

Query params:

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `limit` | No | `10` | Max 50 |
| `from` | No | — | ISO date |
| `to` | No | — | ISO date |

Response:

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

- Sorted descending by `amount`.
- `spenderName` resolved via `$lookup` on users collection.
- Respects workspace membership authorization.

---

### 3. Period Comparison

```
GET /workspaces/:workspaceId/analytics/comparison
```

No query params. Always compares the current calendar month (month-to-date) against the full previous calendar month.

Behavior:

- Current period: 1st of this month → today.
- Previous period: 1st of last month → last day of last month (full month).

Response:

```json
{
  "current": { "total": 2450, "from": "2026-05-01", "to": "2026-05-28" },
  "previous": { "total": 1980, "from": "2026-04-01", "to": "2026-04-28" },
  "delta": 470,
  "deltaPercent": 23.74
}
```

- `deltaPercent` is `((current - previous) / previous) * 100`. Returns `null` if previous total is 0.

---

## Backend Implementation

### Module Changes

All three endpoints are added to `AnalyticsController` and `AnalyticsService` — no new modules needed.

**Controller additions** (`analytics.controller.ts`):

```
GET /workspaces/:workspaceId/analytics/trends        → analyticsService.getTrends(...)
GET /workspaces/:workspaceId/analytics/top-expenses  → analyticsService.getTopExpenses(...)
GET /workspaces/:workspaceId/analytics/comparison    → analyticsService.getComparison(...)
```

All protected by existing `WorkspaceMemberGuard`.

**Service additions** (`analytics.service.ts`):

- `getTrends(workspaceId, granularity, from, to)` — MongoDB `$group` with `$dateToString`
- `getTopExpenses(workspaceId, limit, from, to)` — `$sort` by amount desc + `$lookup` for spender name
- `getComparison(workspaceId)` — two `$sum` aggregations: current month-to-date vs full previous calendar month

No new schemas required.

---

## Frontend Implementation

### `AnalyticsPage.tsx` Layout (single scrollable screen, top to bottom)

1. **Period picker** (existing, stays at top — controls all sections)
2. **Summary card** (existing — total for period)
3. **vs Last Period card** (new) — shows delta amount + color-coded percentage badge
4. **Spending trend chart** (new) — area or bar chart; toggle button for Day / Month granularity
5. **By Category** (existing, keep as-is)
6. **Top Expenses list** (new) — top 10 transactions, each row: amount, category, spender name, date
7. **Category trend** (new) — small grouped bar showing top 3 categories across months in range

### Data Fetching

All three new endpoints fetched in parallel via `Promise.all` on page mount (and on period filter change). Loading skeletons shown per-section independently.

### Chart Library

Use existing `Recharts` (already in the project per `system-prompt.md`). No new dependencies.

---

## Data Contract Additions (api-contract.md)

The following endpoints are added to the API contract after implementation:

```
GET /workspaces/:workspaceId/analytics/trends
GET /workspaces/:workspaceId/analytics/top-expenses
GET /workspaces/:workspaceId/analytics/comparison
```

The existing `GET /workspaces/:workspaceId/analytics` is unchanged.

---

## Out of Scope (this spec)

- Split/balance analytics (who owes whom) — separate spec
- Export of analytics data — separate spec
- Caching / performance optimization beyond MongoDB indexes

---

## Success Criteria

- All three new endpoints return correct data for date-filtered workspaces
- Frontend renders charts without layout breaking on 375px mobile width
- Period comparison renders green/red delta correctly for both increase and decrease
- Zero-spend days/months correctly appear as 0 (no gaps in trend chart)
- No TypeScript errors, no unused imports
