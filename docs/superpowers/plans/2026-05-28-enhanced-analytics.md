# Enhanced Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four new analytics endpoints (trends, top expenses, comparison, category trends) and integrate them into a richer single-scroll AnalyticsPage with area charts, comparison card, top expenses list, and grouped category trend chart.

**Architecture:** Four new `@Get()` routes added to the existing `AnalyticsController` (inheriting its JWT + workspace-member guards). Each route delegates to a new method on `AnalyticsService` that runs a MongoDB aggregation. On the frontend, `AnalyticsPage` fetches all four new endpoints in parallel alongside the existing summary call, then renders four new components below the existing cards.

**Tech Stack:** NestJS + Mongoose aggregations (backend); React + Recharts v3 + TailwindCSS (frontend).

---

## File Map

**Backend — modify only:**
- `co-spnd-api/src/analytics/analytics.controller.ts` — 4 new `@Get()` routes
- `co-spnd-api/src/analytics/analytics.service.ts` — 4 new service methods

**Frontend — create:**
- `co-spnd-web/src/pages/analytics/ComparisonCard.tsx`
- `co-spnd-web/src/pages/analytics/TrendChart.tsx`
- `co-spnd-web/src/pages/analytics/TopExpensesList.tsx`
- `co-spnd-web/src/pages/analytics/CategoryTrendChart.tsx`

**Frontend — modify:**
- `co-spnd-web/src/types/index.ts` — 4 new response type interfaces
- `co-spnd-web/src/services/analytics.service.ts` — 4 new API calls
- `co-spnd-web/src/pages/analytics/AnalyticsPage.tsx` — integrate new components + parallel fetch

**Docs — modify:**
- `docs/api-contract.md` — add 4 new endpoint entries

---

## Task 1: Add new TypeScript types (frontend)

**Files:**
- Modify: `co-spnd-web/src/types/index.ts`

- [ ] **Step 1: Add analytics response types**

Open `co-spnd-web/src/types/index.ts` and append the following after the existing `Analytics` interface (after line 61):

```typescript
export interface TrendDataPoint {
  date: string
  total: number
}

export interface TrendsResponse {
  granularity: 'day' | 'month'
  data: TrendDataPoint[]
}

export interface TopExpense {
  id: string
  amount: number
  category: string
  description?: string
  date: string
  spenderName: string
}

export interface TopExpensesResponse {
  expenses: TopExpense[]
}

export interface ComparisonPeriod {
  total: number
  from: string
  to: string
}

export interface ComparisonResponse {
  current: ComparisonPeriod
  previous: ComparisonPeriod
  delta: number
  deltaPercent: number | null
}

export interface CategoryTrendSeries {
  category: string
  data: number[]
}

export interface CategoryTrendsResponse {
  months: string[]
  series: CategoryTrendSeries[]
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
cd co-spnd-web && git add src/types/index.ts && git commit -m "feat(types): add analytics response types for enhanced analytics"
```

---

## Task 2: Backend — Trends endpoint

**Files:**
- Modify: `co-spnd-api/src/analytics/analytics.service.ts`
- Modify: `co-spnd-api/src/analytics/analytics.controller.ts`

- [ ] **Step 1: Add `getTrends` to analytics service**

Open `co-spnd-api/src/analytics/analytics.service.ts`. Add this method after `getAnalytics`:

```typescript
async getTrends(
  workspaceId: string,
  granularity: 'day' | 'month' = 'day',
  from?: string,
  to?: string,
) {
  const matchStage: any = { workspaceId: new Types.ObjectId(workspaceId) };
  if (from || to) {
    matchStage.date = {};
    if (from) matchStage.date.$gte = new Date(from);
    if (to) matchStage.date.$lte = new Date(to);
  }

  const dateFormat = granularity === 'month' ? '%Y-%m' : '%Y-%m-%d';

  const data = await this.transactionModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$date' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', total: 1, _id: 0 } },
  ]);

  return { granularity, data };
}
```

- [ ] **Step 2: Add `trends` route to controller**

Open `co-spnd-api/src/analytics/analytics.controller.ts`. Add `Query` to the existing import (it's already imported — check and add if missing). Then add this method after `getAnalytics`:

```typescript
@Get('trends')
async getTrends(
  @Param('workspaceId') workspaceId: string,
  @Query('granularity') granularity: 'day' | 'month' = 'day',
  @Query('from') from?: string,
  @Query('to') to?: string,
) {
  return this.analyticsService.getTrends(workspaceId, granularity, from, to);
}
```

- [ ] **Step 3: Build backend to verify no compile errors**

```bash
cd co-spnd-api && npm run build 2>&1 | tail -20
```

Expected: exits with code 0, no TypeScript errors.

- [ ] **Step 4: Start API and verify endpoint manually**

Start the API (`npm run start:dev` in co-spnd-api). Then test:

```bash
# Replace TOKEN and WORKSPACE_ID with real values from a login call
curl -s -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/workspaces/WORKSPACE_ID/analytics/trends?granularity=day&from=2026-05-01&to=2026-05-28" \
  | python3 -m json.tool
```

Expected shape:
```json
{
  "granularity": "day",
  "data": [
    { "date": "2026-05-01", "total": 120.5 }
  ]
}
```

- [ ] **Step 5: Commit**

```bash
cd co-spnd-api && git add src/analytics/analytics.service.ts src/analytics/analytics.controller.ts && git commit -m "feat(analytics): add trends endpoint with day/month granularity"
```

---

## Task 3: Backend — Top Expenses endpoint

**Files:**
- Modify: `co-spnd-api/src/analytics/analytics.service.ts`
- Modify: `co-spnd-api/src/analytics/analytics.controller.ts`

- [ ] **Step 1: Add `getTopExpenses` to analytics service**

Append after `getTrends` in `analytics.service.ts`:

```typescript
async getTopExpenses(
  workspaceId: string,
  limit: number = 10,
  from?: string,
  to?: string,
) {
  const matchStage: any = { workspaceId: new Types.ObjectId(workspaceId) };
  if (from || to) {
    matchStage.date = {};
    if (from) matchStage.date.$gte = new Date(from);
    if (to) matchStage.date.$lte = new Date(to);
  }

  const expenses = await this.transactionModel.aggregate([
    { $match: matchStage },
    { $sort: { amount: -1 } },
    { $limit: Math.min(limit, 50) },
    {
      $lookup: {
        from: 'users',
        localField: 'spenderId',
        foreignField: '_id',
        as: 'spender',
      },
    },
    { $unwind: '$spender' },
    {
      $project: {
        id: '$_id',
        amount: 1,
        category: 1,
        description: 1,
        date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        spenderName: '$spender.name',
        _id: 0,
      },
    },
  ]);

  return { expenses };
}
```

- [ ] **Step 2: Add `top-expenses` route to controller**

Append after `getTrends` in `analytics.controller.ts`:

```typescript
@Get('top-expenses')
async getTopExpenses(
  @Param('workspaceId') workspaceId: string,
  @Query('limit') limit: string = '10',
  @Query('from') from?: string,
  @Query('to') to?: string,
) {
  return this.analyticsService.getTopExpenses(workspaceId, parseInt(limit, 10), from, to);
}
```

- [ ] **Step 3: Build and verify**

```bash
cd co-spnd-api && npm run build 2>&1 | tail -20
```

Expected: exits 0.

- [ ] **Step 4: Test endpoint**

```bash
curl -s -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/workspaces/WORKSPACE_ID/analytics/top-expenses?limit=5" \
  | python3 -m json.tool
```

Expected shape:
```json
{
  "expenses": [
    {
      "id": "...",
      "amount": 850,
      "category": "Travel",
      "description": "Flight",
      "date": "2026-05-10",
      "spenderName": "Ahmed"
    }
  ]
}
```

- [ ] **Step 5: Commit**

```bash
cd co-spnd-api && git add src/analytics/analytics.service.ts src/analytics/analytics.controller.ts && git commit -m "feat(analytics): add top-expenses endpoint"
```

---

## Task 4: Backend — Comparison endpoint

**Files:**
- Modify: `co-spnd-api/src/analytics/analytics.service.ts`
- Modify: `co-spnd-api/src/analytics/analytics.controller.ts`

- [ ] **Step 1: Add `getComparison` to analytics service**

Append after `getTopExpenses` in `analytics.service.ts`:

```typescript
async getComparison(workspaceId: string) {
  const now = new Date();
  const currentFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentTo = now;
  const previousFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousTo = new Date(now.getFullYear(), now.getMonth(), 0);

  const workspaceObjectId = new Types.ObjectId(workspaceId);

  const [currentResult, previousResult] = await Promise.all([
    this.transactionModel.aggregate([
      {
        $match: {
          workspaceId: workspaceObjectId,
          date: { $gte: currentFrom, $lte: currentTo },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    this.transactionModel.aggregate([
      {
        $match: {
          workspaceId: workspaceObjectId,
          date: { $gte: previousFrom, $lte: previousTo },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const currentTotal = Math.round((currentResult[0]?.total ?? 0) * 100) / 100;
  const previousTotal = Math.round((previousResult[0]?.total ?? 0) * 100) / 100;
  const delta = Math.round((currentTotal - previousTotal) * 100) / 100;
  const deltaPercent =
    previousTotal === 0
      ? null
      : Math.round(((currentTotal - previousTotal) / previousTotal) * 10000) / 100;

  return {
    current: {
      total: currentTotal,
      from: currentFrom.toISOString().split('T')[0],
      to: currentTo.toISOString().split('T')[0],
    },
    previous: {
      total: previousTotal,
      from: previousFrom.toISOString().split('T')[0],
      to: previousTo.toISOString().split('T')[0],
    },
    delta,
    deltaPercent,
  };
}
```

- [ ] **Step 2: Add `comparison` route to controller**

Append after `getTopExpenses` in `analytics.controller.ts`:

```typescript
@Get('comparison')
async getComparison(@Param('workspaceId') workspaceId: string) {
  return this.analyticsService.getComparison(workspaceId);
}
```

- [ ] **Step 3: Build and verify**

```bash
cd co-spnd-api && npm run build 2>&1 | tail -20
```

Expected: exits 0.

- [ ] **Step 4: Test endpoint**

```bash
curl -s -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/workspaces/WORKSPACE_ID/analytics/comparison" \
  | python3 -m json.tool
```

Expected shape:
```json
{
  "current":  { "total": 2450, "from": "2026-05-01", "to": "2026-05-28" },
  "previous": { "total": 1980, "from": "2026-04-01", "to": "2026-04-30" },
  "delta": 470,
  "deltaPercent": 23.74
}
```

`deltaPercent` is `null` when previous total is 0.

- [ ] **Step 5: Commit**

```bash
cd co-spnd-api && git add src/analytics/analytics.service.ts src/analytics/analytics.controller.ts && git commit -m "feat(analytics): add month-over-month comparison endpoint"
```

---

## Task 5: Backend — Category Trends endpoint

**Files:**
- Modify: `co-spnd-api/src/analytics/analytics.service.ts`
- Modify: `co-spnd-api/src/analytics/analytics.controller.ts`

- [ ] **Step 1: Add `getCategoryTrends` to analytics service**

Append after `getComparison` in `analytics.service.ts`:

```typescript
async getCategoryTrends(workspaceId: string, from?: string, to?: string) {
  const matchStage: any = { workspaceId: new Types.ObjectId(workspaceId) };
  if (from || to) {
    matchStage.date = {};
    if (from) matchStage.date.$gte = new Date(from);
    if (to) matchStage.date.$lte = new Date(to);
  }

  const raw = await this.transactionModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          category: '$category',
          month: { $dateToString: { format: '%Y-%m', date: '$date' } },
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  if (raw.length === 0) return { months: [], series: [] };

  const monthSet = new Set<string>();
  const categoryTotals: Record<string, number> = {};
  const categoryMonthData: Record<string, Record<string, number>> = {};

  for (const item of raw) {
    const { category, month } = item._id;
    monthSet.add(month);
    categoryTotals[category] = (categoryTotals[category] ?? 0) + item.total;
    if (!categoryMonthData[category]) categoryMonthData[category] = {};
    categoryMonthData[category][month] = item.total;
  }

  const months = Array.from(monthSet).sort();

  const top3 = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  const series = top3.map((category) => ({
    category,
    data: months.map((m) => Math.round((categoryMonthData[category]?.[m] ?? 0) * 100) / 100),
  }));

  return { months, series };
}
```

- [ ] **Step 2: Add `category-trends` route to controller**

Append after `getComparison` in `analytics.controller.ts`:

```typescript
@Get('category-trends')
async getCategoryTrends(
  @Param('workspaceId') workspaceId: string,
  @Query('from') from?: string,
  @Query('to') to?: string,
) {
  return this.analyticsService.getCategoryTrends(workspaceId, from, to);
}
```

- [ ] **Step 3: Build and verify**

```bash
cd co-spnd-api && npm run build 2>&1 | tail -20
```

Expected: exits 0.

- [ ] **Step 4: Test endpoint**

```bash
curl -s -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/workspaces/WORKSPACE_ID/analytics/category-trends?from=2026-03-01&to=2026-05-28" \
  | python3 -m json.tool
```

Expected shape:
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

- [ ] **Step 5: Commit**

```bash
cd co-spnd-api && git add src/analytics/analytics.service.ts src/analytics/analytics.controller.ts && git commit -m "feat(analytics): add category-trends endpoint (top 3 categories by month)"
```

---

## Task 6: Frontend — Extend analytics service

**Files:**
- Modify: `co-spnd-web/src/services/analytics.service.ts`

- [ ] **Step 1: Replace analytics service with extended version**

Replace the entire content of `co-spnd-web/src/services/analytics.service.ts` with:

```typescript
import api from './api'
import type {
  Analytics,
  TrendsResponse,
  TopExpensesResponse,
  ComparisonResponse,
  CategoryTrendsResponse,
} from '../types'

export const analyticsService = {
  async get(workspaceId: string, from?: string, to?: string): Promise<Analytics> {
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<Analytics>(
      `/workspaces/${workspaceId}/analytics`,
      { params }
    )
    return data
  },

  async getTrends(
    workspaceId: string,
    granularity: 'day' | 'month' = 'day',
    from?: string,
    to?: string,
  ): Promise<TrendsResponse> {
    const params: Record<string, string> = { granularity }
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<TrendsResponse>(
      `/workspaces/${workspaceId}/analytics/trends`,
      { params }
    )
    return data
  },

  async getTopExpenses(
    workspaceId: string,
    from?: string,
    to?: string,
  ): Promise<TopExpensesResponse> {
    const params: Record<string, string> = { limit: '10' }
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<TopExpensesResponse>(
      `/workspaces/${workspaceId}/analytics/top-expenses`,
      { params }
    )
    return data
  },

  async getComparison(workspaceId: string): Promise<ComparisonResponse> {
    const { data } = await api.get<ComparisonResponse>(
      `/workspaces/${workspaceId}/analytics/comparison`
    )
    return data
  },

  async getCategoryTrends(
    workspaceId: string,
    from?: string,
    to?: string,
  ): Promise<CategoryTrendsResponse> {
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<CategoryTrendsResponse>(
      `/workspaces/${workspaceId}/analytics/category-trends`,
      { params }
    )
    return data
  },
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd co-spnd-web && git add src/services/analytics.service.ts && git commit -m "feat(analytics): extend analytics service with 4 new API calls"
```

---

## Task 7: Frontend — ComparisonCard component

**Files:**
- Create: `co-spnd-web/src/pages/analytics/ComparisonCard.tsx`

- [ ] **Step 1: Create the component**

Create `co-spnd-web/src/pages/analytics/ComparisonCard.tsx`:

```tsx
import type { ComparisonResponse } from '../../types'
import { formatCurrency } from '../../utils/date'
import { Card } from '../../components/ui/Card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  data: ComparisonResponse
  currency: string
}

export function ComparisonCard({ data, currency }: Props) {
  const isIncrease = data.delta > 0
  const isNeutral = data.delta === 0
  const percentAbs = data.deltaPercent !== null ? Math.abs(data.deltaPercent) : null

  const badgeClass = isNeutral
    ? 'bg-gray-100 text-gray-500'
    : isIncrease
      ? 'bg-red-50 text-red-600'
      : 'bg-green-50 text-green-600'

  const Icon = isNeutral ? Minus : isIncrease ? TrendingUp : TrendingDown

  return (
    <Card>
      <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-3">
        vs Last Month
      </p>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">This month</p>
          <p className="font-money text-xl font-semibold text-gray-950">
            {formatCurrency(data.current.total, currency)}
          </p>
        </div>

        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
          <Icon size={12} />
          {percentAbs !== null ? `${percentAbs}%` : '—'}
        </div>

        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Last month</p>
          <p className="font-money text-xl font-semibold text-gray-400">
            {formatCurrency(data.previous.total, currency)}
          </p>
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd co-spnd-web && git add src/pages/analytics/ComparisonCard.tsx && git commit -m "feat(analytics): add ComparisonCard component"
```

---

## Task 8: Frontend — TrendChart component

**Files:**
- Create: `co-spnd-web/src/pages/analytics/TrendChart.tsx`

- [ ] **Step 1: Create the component**

Create `co-spnd-web/src/pages/analytics/TrendChart.tsx`:

```tsx
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TrendsResponse } from '../../types'
import { formatCurrency } from '../../utils/date'
import { Card } from '../../components/ui/Card'

interface Props {
  data: TrendsResponse | null
  granularity: 'day' | 'month'
  onGranularityChange: (g: 'day' | 'month') => void
  currency: string
}

export function TrendChart({ data, granularity, onGranularityChange, currency }: Props) {
  const hasData = data && data.data.length > 0

  const formatXTick = (value: string) => {
    if (granularity === 'month') {
      return new Date(value + '-01').toLocaleDateString('en-US', { month: 'short' })
    }
    return value.slice(5) // "MM-DD"
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400">
          Spending trend
        </p>
        <div className="flex gap-1">
          {(['day', 'month'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGranularityChange(g)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${
                granularity === g
                  ? 'bg-gray-950 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {g === 'day' ? 'Daily' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data!.data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111827" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#111827" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXTick}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, '')}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value, currency), 'Spent']}
              labelStyle={{ fontSize: 12, color: '#374151' }}
              contentStyle={{
                borderRadius: '10px',
                border: '1px solid #F3F4F6',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#111827"
              strokeWidth={2}
              fill="url(#trendGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#111827' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-44 flex items-center justify-center text-sm text-gray-400">
          No trend data
        </div>
      )}
    </Card>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd co-spnd-web && git add src/pages/analytics/TrendChart.tsx && git commit -m "feat(analytics): add TrendChart component with day/month toggle"
```

---

## Task 9: Frontend — TopExpensesList component

**Files:**
- Create: `co-spnd-web/src/pages/analytics/TopExpensesList.tsx`

- [ ] **Step 1: Create the component**

Create `co-spnd-web/src/pages/analytics/TopExpensesList.tsx`:

```tsx
import type { TopExpense } from '../../types'
import { formatCurrency, formatDate } from '../../utils/date'
import { Card } from '../../components/ui/Card'

interface Props {
  expenses: TopExpense[]
  currency: string
}

export function TopExpensesList({ expenses, currency }: Props) {
  if (expenses.length === 0) return null

  return (
    <Card>
      <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-4">
        Top expenses
      </p>
      <div className="flex flex-col gap-3.5">
        {expenses.map((expense, i) => (
          <div key={expense.id} className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-300 w-4 shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {expense.description || expense.category}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {expense.spenderName} · {formatDate(expense.date)}
              </p>
            </div>
            <p className="font-money text-sm font-semibold text-gray-950 shrink-0">
              {formatCurrency(expense.amount, currency)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd co-spnd-web && git add src/pages/analytics/TopExpensesList.tsx && git commit -m "feat(analytics): add TopExpensesList component"
```

---

## Task 10: Frontend — CategoryTrendChart component

**Files:**
- Create: `co-spnd-web/src/pages/analytics/CategoryTrendChart.tsx`

- [ ] **Step 1: Create the component**

Create `co-spnd-web/src/pages/analytics/CategoryTrendChart.tsx`:

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { CategoryTrendsResponse } from '../../types'
import { formatCurrency } from '../../utils/date'
import { Card } from '../../components/ui/Card'

interface Props {
  data: CategoryTrendsResponse | null
  currency: string
}

const CATEGORY_COLORS = ['#111827', '#6B7280', '#D1D5DB']

export function CategoryTrendChart({ data, currency }: Props) {
  if (!data || data.months.length === 0 || data.series.length === 0) return null

  const chartData = data.months.map((month, i) => {
    const entry: Record<string, string | number> = {
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    }
    data.series.forEach((s) => {
      entry[s.category] = s.data[i]
    })
    return entry
  })

  return (
    <Card>
      <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-4">
        Category trend
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, '')}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid #F3F4F6',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          />
          {data.series.map((s, i) => (
            <Bar
              key={s.category}
              dataKey={s.category}
              fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd co-spnd-web && git add src/pages/analytics/CategoryTrendChart.tsx && git commit -m "feat(analytics): add CategoryTrendChart component (top 3 categories grouped by month)"
```

---

## Task 11: Frontend — Update AnalyticsPage

**Files:**
- Modify: `co-spnd-web/src/pages/analytics/AnalyticsPage.tsx`

- [ ] **Step 1: Replace AnalyticsPage with extended version**

Replace the entire content of `co-spnd-web/src/pages/analytics/AnalyticsPage.tsx` with:

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { analyticsService } from '../../services/analytics.service'
import { workspacesService } from '../../services/workspaces.service'
import type {
  Analytics,
  Workspace,
  TrendsResponse,
  TopExpensesResponse,
  ComparisonResponse,
  CategoryTrendsResponse,
} from '../../types'
import { formatCurrency, getMonthRange, getMonthLabel } from '../../utils/date'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ComparisonCard } from './ComparisonCard'
import { TrendChart } from './TrendChart'
import { TopExpensesList } from './TopExpensesList'
import { CategoryTrendChart } from './CategoryTrendChart'

const CHART_COLORS = [
  '#0C0A09', '#374151', '#6B7280', '#9CA3AF',
  '#D1D5DB', '#4B5563', '#1F2937', '#F3F4F6',
]

export function AnalyticsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [monthOffset, setMonthOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [trends, setTrends] = useState<TrendsResponse | null>(null)
  const [topExpenses, setTopExpenses] = useState<TopExpensesResponse | null>(null)
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null)
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrendsResponse | null>(null)
  const [granularity, setGranularity] = useState<'day' | 'month'>('day')

  const currentDate = new Date()
  currentDate.setMonth(currentDate.getMonth() + monthOffset)
  const { from, to } = getMonthRange(currentDate)
  const monthLabel = getMonthLabel(currentDate)
  const currency = workspace?.currency ?? 'USD'

  const load = useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const [data, wsList, trendsData, topData, compData, catData] = await Promise.all([
        analyticsService.get(workspaceId, from, to),
        workspacesService.list(),
        analyticsService.getTrends(workspaceId, granularity, from, to),
        analyticsService.getTopExpenses(workspaceId, from, to),
        analyticsService.getComparison(workspaceId),
        analyticsService.getCategoryTrends(workspaceId, from, to),
      ])
      setAnalytics(data)
      setWorkspace(wsList.find((w) => w.id === workspaceId) ?? null)
      setTrends(trendsData)
      setTopExpenses(topData)
      setComparison(compData)
      setCategoryTrends(catData)
    } catch {
      setAnalytics(null)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, from, to, granularity])

  useEffect(() => {
    load()
  }, [load])

  const pieData = analytics?.byCategory
    .filter((c) => c.total > 0)
    .map((c) => ({ name: c.category, value: c.total })) ?? []

  const hasData = analytics && analytics.total > 0

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="px-5 pt-14 pb-5">
        <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400">
          {workspace?.name ?? '···'}
        </p>
        <h1 className="text-[1.75rem] font-extrabold text-gray-950 mt-1 tracking-tight">
          Analytics
        </h1>
      </div>

      {/* Month navigation */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="p-1.5 -ml-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[15px] font-semibold text-gray-950 tracking-tight">
            {monthLabel}
          </span>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            disabled={monthOffset >= 0}
            className="p-1.5 -mr-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={<BarChart2 size={48} />}
          title="No data for this period"
          description="Add expenses to see analytics here."
        />
      ) : (
        <div className="px-5 flex flex-col gap-3 pb-8">
          {/* Total */}
          <Card>
            <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-1.5">
              Total spent
            </p>
            <p className="text-[2.25rem] font-money font-semibold text-gray-950 leading-none tracking-tight">
              {formatCurrency(analytics!.total, currency)}
            </p>
          </Card>

          {/* vs Last Month */}
          {comparison && <ComparisonCard data={comparison} currency={currency} />}

          {/* Spending trend */}
          <TrendChart
            data={trends}
            granularity={granularity}
            onGranularityChange={setGranularity}
            currency={currency}
          />

          {/* Pie chart */}
          {pieData.length > 0 && (
            <Card>
              <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-4">
                By category
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value), currency), '']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #F3F4F6',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '13px',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Category bars */}
          {analytics!.byCategory.filter((c) => c.total > 0).length > 0 && (
            <Card>
              <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-4">
                Breakdown
              </p>
              <div className="flex flex-col gap-3.5">
                {analytics!.byCategory
                  .filter((c) => c.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .map((c) => {
                    const pct =
                      analytics!.total > 0 ? (c.total / analytics!.total) * 100 : 0
                    return (
                      <div key={c.category}>
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-sm font-medium text-gray-700">{c.category}</span>
                          <span className="font-money text-sm font-semibold text-gray-950">
                            {formatCurrency(c.total, currency)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-800 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </Card>
          )}

          {/* Category trend (top 3 by month) */}
          <CategoryTrendChart data={categoryTrends} currency={currency} />

          {/* By person */}
          {analytics!.byUser.filter((u) => u.total > 0).length > 0 && (
            <Card>
              <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-4">
                By person
              </p>
              <div className="flex flex-col gap-3">
                {analytics!.byUser
                  .filter((u) => u.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .map((u) => (
                    <div key={u.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold text-gray-500">
                            {u.name?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{u.name}</span>
                      </div>
                      <span className="font-money text-sm font-semibold text-gray-950">
                        {formatCurrency(u.total, currency)}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Top expenses */}
          {topExpenses && <TopExpensesList expenses={topExpenses.expenses} currency={currency} />}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd co-spnd-web && git add src/pages/analytics/AnalyticsPage.tsx && git commit -m "feat(analytics): integrate new analytics sections into AnalyticsPage"
```

---

## Task 12: Update API contract

**Files:**
- Modify: `docs/api-contract.md`

- [ ] **Step 1: Add new endpoints to the contract**

Open `docs/api-contract.md`. After the existing `## 5. Analytics` section, append:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/api-contract.md && git commit -m "docs: add enhanced analytics endpoints to API contract"
```

---

## Task 13: Full build verification

- [ ] **Step 1: Build backend**

```bash
cd co-spnd-api && npm run build 2>&1 | tail -20
```

Expected: exits 0.

- [ ] **Step 2: Build frontend**

```bash
cd co-spnd-web && npm run build 2>&1 | tail -20
```

Expected: `✓ built in` message, exits 0, no TypeScript errors, no unused import warnings.

- [ ] **Step 3: Lint frontend**

```bash
cd co-spnd-web && npm run lint 2>&1
```

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Start both the API and the frontend dev server. Open the app on mobile viewport (375px). Navigate to a workspace → Analytics. Verify:

1. Comparison card appears with two amounts and a colored badge
2. Trend chart renders an area chart; toggling Daily/Monthly re-fetches and re-renders
3. Category trend grouped bar chart appears with up to 3 categories
4. Top expenses list shows ranked transactions at the bottom
5. No layout overflow on 375px width
6. Changing month via the navigation arrows re-fetches all sections

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "chore: verify enhanced analytics build and smoke test passed"
```
