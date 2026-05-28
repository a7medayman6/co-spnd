# Split Percentages — Design Spec

**Date:** 2026-05-28  
**Status:** Approved  
**Scope:** Backend API additions + Frontend MembersPage update

---

## Overview

Enable workspace members to configure how shared expenses are split between them. Each member has a percentage that represents their expected share of total spending. The Members page shows current splits, lets the creator edit them, and displays a "Balance this month" section showing who overpaid and who owes.

---

## Backend

### Remove

Remove `@Post(':id/update')` from `WorkspacesController` and `update()` from `WorkspacesService`. It accepts `any` body with no validation or auth restriction and is replaced by the typed endpoints below.

### New Endpoints

Both endpoints added to `WorkspacesController` under `@Controller('workspaces')` with class-level `@UseGuards(AuthGuard('jwt'))`.

---

#### GET Splitting Config

```
GET /workspaces/:workspaceId/splitting-config
```

Guards: `WorkspaceMemberGuard` (workspace member required).

Response:

```json
[
  { "userId": "...", "name": "Ahmed", "percentage": 60 },
  { "userId": "...", "name": "Sara", "percentage": 40 }
]
```

Implementation: populate workspace members, then map `splittingConfig` entries to `{ userId, name, percentage }` by looking up names from populated members.

---

#### PATCH Splitting Config

```
PATCH /workspaces/:workspaceId/splitting-config
```

Guards: `WorkspaceMemberGuard`. Additional creator-only check: compare `req.user.userId` with `workspace.createdBy.toString()` — throw `ForbiddenException` if not creator.

Body DTO (`UpdateSplittingConfigDto`):

```typescript
class SplitEntryDto {
  @IsNotEmpty() @IsString()
  userId: string

  @IsNotEmpty() @IsNumber() @Min(0) @Max(100)
  percentage: number
}

class UpdateSplittingConfigDto {
  @ValidateNested({ each: true })
  @Type(() => SplitEntryDto)
  @ArrayMinSize(1)
  splittingConfig: SplitEntryDto[]
}
```

Validation (in service, after DTO validation):
1. All `userId` values must be current workspace members — throw `BadRequestException` if not.
2. `sum(percentages)` must equal 100 within ±0.01 tolerance — throw `BadRequestException('Percentages must sum to 100')` if not.
3. Each percentage must be ≥ 0 (enforced by `@Min(0)` in DTO).

On success: replace `workspace.splittingConfig` atomically and return the updated config in the same shape as the GET response.

---

### Workspace List — Add `createdBy`

Update `GET /workspaces` mapper in `WorkspacesController.findAll()` to include `createdBy`:

```typescript
return workspaces.map((w) => ({
  id: w._id,
  name: w.name,
  currency: w.currency,
  membersCount: w.members.length,
  createdBy: w.createdBy,
}))
```

The frontend `Workspace` type already has `createdBy?: string` — no type change needed.

---

## Frontend

### New types (append to `src/types/index.ts`)

```typescript
export interface SplitEntry {
  userId: string
  name: string
  percentage: number
}

export interface BalanceEntry {
  userId: string
  name: string
  percentage: number
  expectedShare: number
  actualSpend: number
  balance: number  // positive = overpaid (is owed), negative = underpaid (owes)
}
```

### New service method (append to `src/services/workspaces.service.ts`)

```typescript
getSplittingConfig(workspaceId: string): Promise<SplitEntry[]>
updateSplittingConfig(workspaceId: string, splittingConfig: { userId: string; percentage: number }[]): Promise<SplitEntry[]>
```

### MembersPage Update (`src/pages/workspaces/MembersPage.tsx`)

**On load:** fetch in parallel:
1. `workspacesService.getMembers(workspaceId)` — existing
2. `workspacesService.getSplittingConfig(workspaceId)` — new
3. `analyticsService.get(workspaceId, from, to)` — current calendar month, for byUser totals + total
4. `workspacesService.list()` — to get `createdBy` for edit permission check

**State additions:**
- `splitConfig: SplitEntry[]`
- `isEditing: boolean`
- `editValues: Record<string, string>` — string inputs keyed by userId (allows "4" → 40)
- `saving: boolean`
- `saveError: string`

**Balance computation (derived, not state):**

```typescript
const total = analytics?.total ?? 0
const balances: BalanceEntry[] = members.map((m) => {
  const split = splitConfig.find((s) => s.userId === m.id)
  const percentage = split?.percentage ?? 0
  const expectedShare = (total * percentage) / 100
  const actualSpend = analytics?.byUser.find((u) => u.userId === m.id)?.total ?? 0
  return {
    userId: m.id,
    name: m.name,
    percentage,
    expectedShare,
    actualSpend,
    balance: actualSpend - expectedShare,
  }
})
```

**Creator check:**

```typescript
const isCreator = workspace?.createdBy?.toString() === user?.id
```

Where `workspace` is found from `workspacesService.list()` and `user` comes from `useAuth()`.

**Edit mode flow:**
1. Creator sees "Edit splits" button in header.
2. Tapping sets `isEditing = true` and populates `editValues` from current `splitConfig` (percentage as string).
3. Each member row shows a number input (`0`–`100`).
4. Running sum displayed below list — red if not 100, green if 100.
5. Save button: disabled unless sum === 100. On tap, calls `updateSplittingConfig`, sets `splitConfig` from response, exits edit mode.
6. Cancel button: exits edit mode without saving.

**Member row layout (read mode):**
```
[Avatar] [Name / Email]    [60%]
```

**Balance section** (below member list, shown when `analytics.total > 0`):

```
Balance this month
[Avatar] [Name]    +120.00  (green, they overpaid)
[Avatar] [Name]    -80.00   (red, they owe)
```

---

## Data Flow

```
MembersPage mount
  → Promise.all([getMembers, getSplittingConfig, analyticsService.get, list])
  → compute balances client-side
  → render member rows with % badges + balance section

Creator taps "Edit splits"
  → edit mode: percentage inputs
  → save → PATCH /splitting-config
  → update splitConfig state, exit edit mode
```

---

## Out of Scope

- Non-creator members editing splits
- Split history / audit log
- Per-transaction overrides of split percentages
- Balance settlement (marking debts as paid)
- Balance across all time (only current month)

---

## Success Criteria

- GET/PATCH splitting-config endpoints return correct data and enforce creator-only on PATCH
- Sum validation rejects configurations that don't total 100
- Frontend correctly shows percentages on member rows
- Edit mode only visible to creator
- Balance section correctly reflects expected vs actual spend
- No TypeScript errors, builds clean
