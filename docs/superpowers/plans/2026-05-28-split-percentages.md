# Split Percentages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let workspace members configure how shared expenses are split by percentage. The creator can edit splits; all members can see current splits and a balance section showing who overpaid/owes this month.

**Architecture:** New GET/PATCH `/workspaces/:workspaceId/splitting-config` endpoints in NestJS. `splittingConfig` already exists on the Workspace schema as `{ userId: ObjectId, percentage: number }[]`. Balance is computed client-side from existing analytics data — no new analytics endpoint needed. MembersPage is updated with percentage badges, an edit mode (creator-only), and a balance section.

**Tech Stack:** NestJS + MongoDB (backend), React + Tailwind + Lucide (frontend), class-validator DTOs, existing WorkspaceMemberGuard

---

## File Map

| Action | File |
|--------|------|
| Modify | `co-spnd-api/src/workspaces/workspace.dto.ts` |
| Modify | `co-spnd-api/src/workspaces/workspaces.service.ts` |
| Modify | `co-spnd-api/src/workspaces/workspaces.controller.ts` |
| Modify | `co-spnd-web/src/types/index.ts` |
| Modify | `co-spnd-web/src/services/workspaces.service.ts` |
| Modify | `co-spnd-web/src/pages/workspaces/MembersPage.tsx` |

---

### Task 1: Backend DTOs

**Files:**
- Modify: `co-spnd-api/src/workspaces/workspace.dto.ts`

The current file has `SplittingConfigDto` (no min/max validation) and `UpdateWorkspaceDto` (unused). Replace both with properly validated `SplitEntryDto` and `UpdateSplittingConfigDto`.

- [ ] **Step 1: Replace workspace.dto.ts**

Replace the full content of `co-spnd-api/src/workspaces/workspace.dto.ts` with:

```typescript
import { IsNotEmpty, IsString, IsNumber, Min, Max, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkspaceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  currency: string;
}

export class InviteUserDto {
  @IsNotEmpty()
  @IsString()
  email: string;
}

export class SplitEntryDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}

export class UpdateSplittingConfigDto {
  @ValidateNested({ each: true })
  @Type(() => SplitEntryDto)
  @ArrayMinSize(1)
  splittingConfig: SplitEntryDto[];
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd co-spnd-api && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add co-spnd-api/src/workspaces/workspace.dto.ts
git commit -m "feat: replace workspace DTOs with typed split config DTOs"
```

---

### Task 2: Backend Service — Splitting Config Methods

**Files:**
- Modify: `co-spnd-api/src/workspaces/workspaces.service.ts`

Add `getSplittingConfig()` and `updateSplittingConfig()`. Remove the unsafe `update()` method that accepts `any` body.

- [ ] **Step 1: Update imports**

The current import line is:
```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
```

Replace with:
```typescript
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
```

- [ ] **Step 2: Remove the unsafe update() method**

Delete the entire `update()` method (lines 25–27 in the current file):
```typescript
async update(id: string, updateData: any): Promise<WorkspaceDocument | null> {
  return this.workspaceModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
}
```

- [ ] **Step 3: Add getSplittingConfig() method**

Add this method after the `findById()` method:

```typescript
async getSplittingConfig(workspaceId: string): Promise<{ userId: string; name: string; percentage: number }[]> {
  const workspace = await this.workspaceModel
    .findById(workspaceId)
    .populate('splittingConfig.userId', '_id name')
    .exec();
  if (!workspace) {
    throw new NotFoundException('Workspace not found');
  }
  return workspace.splittingConfig.map((entry: any) => ({
    userId: entry.userId._id.toString(),
    name: entry.userId.name,
    percentage: entry.percentage,
  }));
}
```

- [ ] **Step 4: Add updateSplittingConfig() method**

Add this method after `getSplittingConfig()`:

```typescript
async updateSplittingConfig(
  workspaceId: string,
  requestingUserId: string,
  entries: { userId: string; percentage: number }[],
): Promise<{ userId: string; name: string; percentage: number }[]> {
  const workspace = await this.workspaceModel.findById(workspaceId).exec();
  if (!workspace) {
    throw new NotFoundException('Workspace not found');
  }
  if (workspace.createdBy.toString() !== requestingUserId) {
    throw new ForbiddenException('Only the workspace creator can update splitting config');
  }

  const memberIds = workspace.members.map((m) => m.toString());
  for (const entry of entries) {
    if (!memberIds.includes(entry.userId)) {
      throw new BadRequestException(`User ${entry.userId} is not a member of this workspace`);
    }
  }

  const sum = entries.reduce((acc, e) => acc + e.percentage, 0);
  if (Math.abs(sum - 100) > 0.01) {
    throw new BadRequestException('Percentages must sum to 100');
  }

  workspace.splittingConfig = entries.map((e) => ({
    userId: new Types.ObjectId(e.userId),
    percentage: e.percentage,
  }));
  await workspace.save();

  return this.getSplittingConfig(workspaceId);
}
```

- [ ] **Step 5: Verify TypeScript compiles cleanly**

```bash
cd co-spnd-api && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add co-spnd-api/src/workspaces/workspaces.service.ts
git commit -m "feat: add getSplittingConfig and updateSplittingConfig service methods"
```

---

### Task 3: Backend Controller — New Routes

**Files:**
- Modify: `co-spnd-api/src/workspaces/workspaces.controller.ts`

Add GET and PATCH routes for splitting config, remove the unsafe `@Post(':id/update')` route, and add `createdBy` to the `findAll` mapper.

- [ ] **Step 1: Update imports**

The current import is:
```typescript
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
```

Replace with:
```typescript
import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
```

Also update the DTO import:
```typescript
import { CreateWorkspaceDto, InviteUserDto } from './workspace.dto';
```

Replace with:
```typescript
import { CreateWorkspaceDto, InviteUserDto, UpdateSplittingConfigDto } from './workspace.dto';
```

- [ ] **Step 2: Remove the unsafe @Post(':id/update') route**

Delete the entire method (lines 28–33 in the current file):
```typescript
@Post(':id/update') // Using Post for simplicity, usually Patch/Put
async update(@Param('id') id: string, @Body() updateData: any) {
  // In a real app, validate that percentages sum to 100 if splittingConfig is present
  const workspace = await this.workspacesService.update(id, updateData);
  return workspace;
}
```

- [ ] **Step 3: Add createdBy to findAll mapper**

Find the `findAll` method's return statement:
```typescript
return workspaces.map((w) => ({
  id: w._id,
  name: w.name,
  currency: w.currency,
  membersCount: w.members.length,
}));
```

Replace with:
```typescript
return workspaces.map((w) => ({
  id: w._id,
  name: w.name,
  currency: w.currency,
  membersCount: w.members.length,
  createdBy: w.createdBy,
}));
```

- [ ] **Step 4: Add the splitting config routes**

Add these two methods after the `getMembers` method:

```typescript
@Get(':workspaceId/splitting-config')
@UseGuards(WorkspaceMemberGuard)
async getSplittingConfig(@Param('workspaceId') workspaceId: string) {
  return this.workspacesService.getSplittingConfig(workspaceId);
}

@Patch(':workspaceId/splitting-config')
@UseGuards(WorkspaceMemberGuard)
async updateSplittingConfig(
  @Param('workspaceId') workspaceId: string,
  @Request() req: any,
  @Body() dto: UpdateSplittingConfigDto,
) {
  return this.workspacesService.updateSplittingConfig(workspaceId, req.user.userId, dto.splittingConfig);
}
```

- [ ] **Step 5: Verify TypeScript compiles cleanly**

```bash
cd co-spnd-api && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add co-spnd-api/src/workspaces/workspaces.controller.ts
git commit -m "feat: add splitting-config GET/PATCH routes, remove unsafe update route"
```

---

### Task 4: Frontend Types and Service

**Files:**
- Modify: `co-spnd-web/src/types/index.ts`
- Modify: `co-spnd-web/src/services/workspaces.service.ts`

- [ ] **Step 1: Add SplitEntry and BalanceEntry to types**

At the end of `co-spnd-web/src/types/index.ts`, before the `CATEGORIES` constant, add:

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
  balance: number
}
```

- [ ] **Step 2: Add service methods to workspaces.service.ts**

In `co-spnd-web/src/services/workspaces.service.ts`, update the import line:
```typescript
import type { Workspace, WorkspaceMember } from '../types'
```

Replace with:
```typescript
import type { Workspace, WorkspaceMember, SplitEntry } from '../types'
```

Then add two new methods inside the `workspacesService` object, after `getMembers`:

```typescript
  async getSplittingConfig(workspaceId: string): Promise<SplitEntry[]> {
    const { data } = await api.get<SplitEntry[]>(`/workspaces/${workspaceId}/splitting-config`)
    return data
  },

  async updateSplittingConfig(
    workspaceId: string,
    splittingConfig: { userId: string; percentage: number }[],
  ): Promise<SplitEntry[]> {
    const { data } = await api.patch<SplitEntry[]>(
      `/workspaces/${workspaceId}/splitting-config`,
      { splittingConfig },
    )
    return data
  },
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add co-spnd-web/src/types/index.ts co-spnd-web/src/services/workspaces.service.ts
git commit -m "feat: add SplitEntry/BalanceEntry types and splitting config service methods"
```

---

### Task 5: MembersPage — Splits, Edit Mode, and Balance Section

**Files:**
- Modify: `co-spnd-web/src/pages/workspaces/MembersPage.tsx`

This is a full rewrite of the component. Preserve all existing invite modal logic. Add:
- Parallel data loading (members + split config + analytics + workspace list)
- Percentage badge on each member row
- "Edit splits" button in header (creator only)
- Edit mode: number inputs per member, running sum, save/cancel
- Balance section below member list (when total > 0)

- [ ] **Step 1: Replace the full MembersPage.tsx**

Write the complete new file:

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { UserPlus, Users, CheckCircle2 } from 'lucide-react'
import { workspacesService } from '../../services/workspaces.service'
import { analyticsService } from '../../services/analytics.service'
import { useAuth } from '../../hooks/useAuth'
import type { WorkspaceMember, SplitEntry, BalanceEntry, Analytics } from '../../types'
import { formatCurrency, getMonthRange } from '../../utils/date'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export function MembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { user } = useAuth()

  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [splitConfig, setSplitConfig] = useState<SplitEntry[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [currency, setCurrency] = useState('USD')
  const [isCreator, setIsCreator] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    const now = new Date()
    const { from, to } = getMonthRange(now)
    const [membersData, splitData, analyticsData, workspaces] = await Promise.all([
      workspacesService.getMembers(workspaceId),
      workspacesService.getSplittingConfig(workspaceId),
      analyticsService.get(workspaceId, from, to),
      workspacesService.list(),
    ])
    setMembers(membersData)
    setSplitConfig(splitData)
    setAnalytics(analyticsData)
    const workspace = workspaces.find((w) => w.id === workspaceId)
    setCurrency(workspace?.currency ?? 'USD')
    setIsCreator(workspace?.createdBy?.toString() === user?.id)
  }, [workspaceId, user?.id])

  useEffect(() => {
    load().finally(() => setIsLoading(false))
  }, [load])

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

  function startEditing() {
    const vals: Record<string, string> = {}
    members.forEach((m) => {
      const split = splitConfig.find((s) => s.userId === m.id)
      vals[m.id] = (split?.percentage ?? 0).toString()
    })
    setEditValues(vals)
    setSaveError('')
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setSaveError('')
  }

  const editSum = Object.values(editValues).reduce((acc, v) => acc + (parseFloat(v) || 0), 0)

  async function handleSave() {
    if (!workspaceId) return
    setSaving(true)
    setSaveError('')
    try {
      const entries = members.map((m) => ({
        userId: m.id,
        percentage: parseFloat(editValues[m.id] ?? '0') || 0,
      }))
      const updated = await workspacesService.updateSplittingConfig(workspaceId, entries)
      setSplitConfig(updated)
      setIsEditing(false)
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleInvite() {
    if (!email.trim() || !workspaceId) return
    setInviting(true)
    setInviteError('')
    try {
      await workspacesService.invite(workspaceId, email.trim())
      setInviteSuccess(true)
      const [membersData, splitData] = await Promise.all([
        workspacesService.getMembers(workspaceId),
        workspacesService.getSplittingConfig(workspaceId),
      ])
      setMembers(membersData)
      setSplitConfig(splitData)
    } catch {
      setInviteError('Could not invite this user. Check the email and try again.')
    } finally {
      setInviting(false)
    }
  }

  function handleCloseInvite() {
    setShowInvite(false)
    setEmail('')
    setInviteError('')
    setInviteSuccess(false)
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-start justify-between">
        <div>
          <h1 className="text-[1.75rem] font-extrabold text-gray-950 tracking-tight">
            Members
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {isCreator && !isEditing && members.length > 0 && (
            <Button onClick={startEditing} variant="secondary" size="sm">
              Edit splits
            </Button>
          )}
          <Button
            onClick={() => setShowInvite(true)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <UserPlus size={14} />
            Invite
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="px-5">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="No members yet"
            description="Invite your friends to this workspace."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((m) => {
              const split = splitConfig.find((s) => s.userId === m.id)
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-gray-500">
                      {m.name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-950 text-[15px]">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{m.email}</p>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editValues[m.id] ?? '0'}
                        onChange={(e) =>
                          setEditValues((v) => ({ ...v, [m.id]: e.target.value }))
                        }
                        className="w-16 px-2 py-1.5 text-sm text-right border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors"
                      />
                      <span className="text-sm text-gray-400">%</span>
                    </div>
                  ) : (
                    split !== undefined && (
                      <span className="text-sm font-semibold text-gray-500 shrink-0">
                        {split.percentage}%
                      </span>
                    )
                  )}
                </div>
              )
            })}

            {/* Edit mode controls */}
            {isEditing && (
              <div className="mt-1 pb-2">
                <p
                  className={`text-center text-sm font-semibold mb-3 ${
                    Math.abs(editSum - 100) < 0.01 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  Total: {editSum.toFixed(editSum % 1 === 0 ? 0 : 1)}%
                </p>
                {saveError && (
                  <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl mb-3">
                    {saveError}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={cancelEditing} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    isLoading={saving}
                    disabled={Math.abs(editSum - 100) > 0.01}
                    className="flex-1"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}

            {/* Balance section */}
            {!isEditing && total > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-3">
                  Balance this month
                </p>
                <div className="flex flex-col gap-2">
                  {balances.map((b) => (
                    <div
                      key={b.userId}
                      className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-gray-500">
                          {b.name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <span className="flex-1 font-semibold text-gray-950 text-[15px]">
                        {b.name}
                      </span>
                      <span
                        className={`font-money text-sm font-semibold shrink-0 ${
                          b.balance >= 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {b.balance >= 0 ? '+' : ''}
                        {formatCurrency(b.balance, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite modal */}
      <Modal isOpen={showInvite} onClose={handleCloseInvite} title="Invite member">
        <div className="flex flex-col gap-4">
          {inviteSuccess ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <CheckCircle2 size={40} className="text-emerald-500" />
              <p className="text-[15px] font-semibold text-gray-950">Invitation sent!</p>
              <p className="text-sm text-gray-400 text-center">
                They'll appear here once they join.
              </p>
              <Button onClick={handleCloseInvite} className="w-full mt-2">
                Done
              </Button>
            </div>
          ) : (
            <>
              <Input
                label="Email address"
                type="email"
                placeholder="friend@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              {inviteError && (
                <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl">
                  {inviteError}
                </p>
              )}
              <Button
                onClick={handleInvite}
                isLoading={inviting}
                className="w-full"
                size="lg"
              >
                Send invite
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add co-spnd-web/src/pages/workspaces/MembersPage.tsx
git commit -m "feat: add split percentages, edit mode, and balance section to MembersPage"
```
