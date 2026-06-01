# Custom Categories + CSV Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add custom workspace categories (inline creation + settings management) and a CSV import flow that auto-creates unrecognized categories and bulk-inserts transactions.

**Architecture:** `customCategories: string[]` lives on the Workspace MongoDB document. Two new workspace endpoints (GET/PATCH categories) and one new bulk import endpoint on transactions. The frontend fetches the merged category list where needed (AddTransactionSheet, MembersPage, import flow) and always displays default + custom categories together.

**Tech Stack:** NestJS, Mongoose, class-validator (backend) · React, Tailwind, Axios (frontend) · lucide-react icons

---

## File Map

**Backend — modified:**
- `co-spnd-api/src/workspaces/workspace.schema.ts` — add `customCategories` prop
- `co-spnd-api/src/workspaces/workspace.dto.ts` — add `UpdateCategoriesDto`
- `co-spnd-api/src/workspaces/workspaces.service.ts` — add `getCategories`, `updateCategories`
- `co-spnd-api/src/workspaces/workspaces.controller.ts` — add GET/PATCH `:workspaceId/categories`
- `co-spnd-api/src/transactions/transaction.dto.ts` — add `ImportTransactionItemDto`, `BulkImportDto`
- `co-spnd-api/src/transactions/transactions.service.ts` — add `bulkImport`
- `co-spnd-api/src/transactions/transactions.controller.ts` — add POST `:workspaceId/transactions/import`

**Frontend — modified:**
- `co-spnd-web/src/services/workspaces.service.ts` — add `getCategories`, `updateCategories`
- `co-spnd-web/src/services/transactions.service.ts` — add `importTransactions`
- `co-spnd-web/src/utils/csv.ts` — add `parseImportCsv`
- `co-spnd-web/src/pages/transactions/AddTransactionSheet.tsx` — fetch workspace categories + inline "+" chip
- `co-spnd-web/src/pages/workspaces/MembersPage.tsx` — add Categories section
- `co-spnd-web/src/pages/transactions/TransactionsPage.tsx` — add upload FAB, import flow, result modal

---

## Task 1: Backend — Add customCategories to Workspace schema

**Files:**
- Modify: `co-spnd-api/src/workspaces/workspace.schema.ts`

- [ ] **Step 1: Add `customCategories` prop to the schema**

Open `co-spnd-api/src/workspaces/workspace.schema.ts`. Add the new prop after `splittingConfig`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkspaceDocument = Workspace & Document;

@Schema()
export class Workspace {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  currency: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members: Types.ObjectId[];

  @Prop({
    type: [
      {
        userId: { type: Types.ObjectId, ref: 'User' },
        percentage: { type: Number, required: true },
        _id: false,
      },
    ],
    default: [],
  })
  splittingConfig: { userId: Types.ObjectId; percentage: number }[];

  @Prop({ type: [String], default: [] })
  customCategories: string[];
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd co-spnd-api && npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors unrelated to this change).

- [ ] **Step 3: Commit**

```bash
git add co-spnd-api/src/workspaces/workspace.schema.ts
git commit -m "feat(api): add customCategories field to workspace schema"
```

---

## Task 2: Backend — Categories DTO + service methods

**Files:**
- Modify: `co-spnd-api/src/workspaces/workspace.dto.ts`
- Modify: `co-spnd-api/src/workspaces/workspaces.service.ts`

- [ ] **Step 1: Add `UpdateCategoriesDto` to workspace.dto.ts**

Append to the bottom of `co-spnd-api/src/workspaces/workspace.dto.ts`:

```typescript
import { IsArray, IsString, IsOptional } from 'class-validator';

export class UpdateCategoriesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  add?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  remove?: string[];
}
```

The full file after edit:

```typescript
import { IsNotEmpty, IsString, IsNumber, Min, Max, ValidateNested, ArrayMinSize, IsArray, IsOptional } from 'class-validator';
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

export class UpdateWorkspaceDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class UpdateSplittingConfigDto {
  @ValidateNested({ each: true })
  @Type(() => SplitEntryDto)
  @ArrayMinSize(1)
  splittingConfig: SplitEntryDto[];
}

export class UpdateCategoriesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  add?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  remove?: string[];
}
```

- [ ] **Step 2: Add `getCategories` and `updateCategories` to workspaces.service.ts**

Add these two methods to the `WorkspacesService` class (after the existing `leave` method):

```typescript
async getCategories(workspaceId: string): Promise<string[]> {
  const workspace = await this.findById(workspaceId);
  if (!workspace) throw new NotFoundException('Workspace not found');
  return workspace.customCategories ?? [];
}

async updateCategories(
  workspaceId: string,
  add: string[] = [],
  remove: string[] = [],
): Promise<string[]> {
  const workspace = await this.findById(workspaceId);
  if (!workspace) throw new NotFoundException('Workspace not found');

  const existing = new Set(workspace.customCategories ?? []);
  for (const cat of add) {
    const trimmed = cat.trim();
    if (trimmed) existing.add(trimmed);
  }
  for (const cat of remove) {
    existing.delete(cat.trim());
  }

  workspace.customCategories = Array.from(existing);
  await workspace.save();
  return workspace.customCategories;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd co-spnd-api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add co-spnd-api/src/workspaces/workspace.dto.ts co-spnd-api/src/workspaces/workspaces.service.ts
git commit -m "feat(api): add getCategories and updateCategories to workspaces service"
```

---

## Task 3: Backend — Categories controller endpoints

**Files:**
- Modify: `co-spnd-api/src/workspaces/workspaces.controller.ts`

- [ ] **Step 1: Add GET and PATCH categories endpoints**

Add the import for `UpdateCategoriesDto` and two new methods to `WorkspacesController`. Insert after the `updateSplittingConfig` method:

```typescript
@Get(':workspaceId/categories')
@UseGuards(WorkspaceMemberGuard)
async getCategories(@Param('workspaceId') workspaceId: string) {
  const customCategories = await this.workspacesService.getCategories(workspaceId);
  return { customCategories };
}

@Patch(':workspaceId/categories')
@UseGuards(WorkspaceMemberGuard)
async updateCategories(
  @Param('workspaceId') workspaceId: string,
  @Body() dto: UpdateCategoriesDto,
) {
  const customCategories = await this.workspacesService.updateCategories(
    workspaceId,
    dto.add,
    dto.remove,
  );
  return { customCategories };
}
```

Also add `UpdateCategoriesDto` to the import line at the top:

```typescript
import { CreateWorkspaceDto, InviteUserDto, UpdateSplittingConfigDto, UpdateWorkspaceDto, UpdateCategoriesDto } from './workspace.dto';
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd co-spnd-api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add co-spnd-api/src/workspaces/workspaces.controller.ts
git commit -m "feat(api): add GET/PATCH categories endpoints for workspaces"
```

---

## Task 4: Backend — Bulk import endpoint

**Files:**
- Modify: `co-spnd-api/src/transactions/transaction.dto.ts`
- Modify: `co-spnd-api/src/transactions/transactions.service.ts`
- Modify: `co-spnd-api/src/transactions/transactions.controller.ts`

- [ ] **Step 1: Add import DTOs to transaction.dto.ts**

Append to the bottom of `co-spnd-api/src/transactions/transaction.dto.ts`:

```typescript
import { ValidateNested, ArrayMinSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class ImportTransactionItemDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ImportTransactionItemDto)
  transactions: ImportTransactionItemDto[];
}
```

The full updated file:

```typescript
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  spenderId?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  spenderId?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class ImportTransactionItemDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ImportTransactionItemDto)
  transactions: ImportTransactionItemDto[];
}
```

- [ ] **Step 2: Add `bulkImport` method to transactions.service.ts**

Add this method to `TransactionsService` after the `delete` method:

```typescript
async bulkImport(
  workspaceId: string,
  userId: string,
  items: ImportTransactionItemDto[],
): Promise<{ imported: number; errors: { row: number; message: string }[] }> {
  let imported = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const transaction = new this.transactionModel({
        amount: item.amount,
        category: item.category,
        description: item.description,
        date: item.date ? new Date(item.date) : new Date(),
        spenderId: new Types.ObjectId(userId),
        createdBy: new Types.ObjectId(userId),
        workspaceId: new Types.ObjectId(workspaceId),
        paymentMethod: 'CASH',
      });
      await transaction.save();
      imported++;
    } catch (err: any) {
      errors.push({ row: i + 1, message: err?.message ?? 'Unknown error' });
    }
  }

  return { imported, errors };
}
```

Also add `ImportTransactionItemDto` to the import line at the top of the service:

```typescript
import { CreateTransactionDto, UpdateTransactionDto, ImportTransactionItemDto } from './transaction.dto';
```

- [ ] **Step 3: Add POST import endpoint to transactions.controller.ts**

Add the import for `BulkImportDto` and the new endpoint. The full updated controller:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto, BulkImportDto } from './transaction.dto';
import { WorkspaceMemberGuard } from '../workspaces/workspace-member.guard';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  private serializeTransaction(t: any) {
    const spender = t.spenderId as any;
    const creator = t.createdBy as any;
    return {
      id: t._id,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
      spenderId: spender?._id?.toString() ?? spender?.toString() ?? '',
      spenderName: spender?.name ?? '',
      createdBy: creator?._id?.toString() ?? creator?.toString() ?? '',
      workspaceId: t.workspaceId,
      paymentMethod: t.paymentMethod,
    };
  }

  @Post('workspaces/:workspaceId/transactions')
  @UseGuards(WorkspaceMemberGuard)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Request() req: any,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    const transaction = await this.transactionsService.create(
      workspaceId,
      req.user.userId,
      createTransactionDto,
    );
    return this.serializeTransaction(transaction);
  }

  @Post('workspaces/:workspaceId/transactions/import')
  @UseGuards(WorkspaceMemberGuard)
  async bulkImport(
    @Param('workspaceId') workspaceId: string,
    @Request() req: any,
    @Body() dto: BulkImportDto,
  ) {
    return this.transactionsService.bulkImport(workspaceId, req.user.userId, dto.transactions);
  }

  @Get('workspaces/:workspaceId/transactions')
  @UseGuards(WorkspaceMemberGuard)
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const transactions = await this.transactionsService.findByWorkspace(workspaceId, from, to);
    return transactions.map((t) => this.serializeTransaction(t));
  }

  @Put('transactions/:transactionId')
  async update(
    @Param('transactionId') transactionId: string,
    @Request() req: any,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    const transaction = await this.transactionsService.update(
      transactionId,
      req.user.userId,
      updateTransactionDto,
    );
    if (!transaction) return null;
    return this.serializeTransaction(transaction);
  }

  @Delete('transactions/:transactionId')
  async delete(@Param('transactionId') transactionId: string, @Request() req: any) {
    await this.transactionsService.delete(transactionId, req.user.userId);
    return { success: true };
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd co-spnd-api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add co-spnd-api/src/transactions/transaction.dto.ts co-spnd-api/src/transactions/transactions.service.ts co-spnd-api/src/transactions/transactions.controller.ts
git commit -m "feat(api): add bulk import endpoint for transactions"
```

---

## Task 5: Frontend — Service layer (categories + import)

**Files:**
- Modify: `co-spnd-web/src/services/workspaces.service.ts`
- Modify: `co-spnd-web/src/services/transactions.service.ts`

- [ ] **Step 1: Add `getCategories` and `updateCategories` to workspaces.service.ts**

The full updated `co-spnd-web/src/services/workspaces.service.ts`:

```typescript
import api from './api'
import type { Workspace, WorkspaceMember, SplitEntry } from '../types'

export const workspacesService = {
  async list(): Promise<Workspace[]> {
    const { data } = await api.get<Workspace[]>('/workspaces')
    return data
  },

  async create(name: string, currency: string): Promise<Workspace> {
    const { data } = await api.post<Workspace>('/workspaces', { name, currency })
    return data
  },

  async updateName(workspaceId: string, name: string): Promise<Workspace> {
    const { data } = await api.patch<Workspace>(`/workspaces/${workspaceId}`, { name })
    return data
  },

  async invite(workspaceId: string, email: string): Promise<void> {
    await api.post(`/workspaces/${workspaceId}/invite`, { email })
  },

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data } = await api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`)
    return data
  },

  async getSplittingConfig(workspaceId: string): Promise<SplitEntry[]> {
    const { data } = await api.get<SplitEntry[]>(`/workspaces/${workspaceId}/splitting-config`)
    return data
  },

  async updateSplittingConfig(workspaceId: string, entries: { userId: string; percentage: number }[]): Promise<SplitEntry[]> {
    const { data } = await api.patch<SplitEntry[]>(`/workspaces/${workspaceId}/splitting-config`, { splittingConfig: entries })
    return data
  },

  async leave(workspaceId: string): Promise<{ deleted: boolean }> {
    const { data } = await api.delete<{ deleted: boolean }>(`/workspaces/${workspaceId}/leave`)
    return data
  },

  async getCategories(workspaceId: string): Promise<string[]> {
    const { data } = await api.get<{ customCategories: string[] }>(`/workspaces/${workspaceId}/categories`)
    return data.customCategories
  },

  async updateCategories(workspaceId: string, add: string[], remove: string[]): Promise<string[]> {
    const { data } = await api.patch<{ customCategories: string[] }>(`/workspaces/${workspaceId}/categories`, { add, remove })
    return data.customCategories
  },
}
```

- [ ] **Step 2: Add `importTransactions` to transactions.service.ts**

The full updated `co-spnd-web/src/services/transactions.service.ts`:

```typescript
import api from './api'
import type { Transaction, CreateTransactionDto, UpdateTransactionDto } from '../types'

export interface ImportTransactionItem {
  amount: number
  category: string
  description?: string
  date?: string
}

export interface ImportResult {
  imported: number
  errors: { row: number; message: string }[]
}

export const transactionsService = {
  async list(workspaceId: string, from?: string, to?: string): Promise<Transaction[]> {
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<Transaction[]>(
      `/workspaces/${workspaceId}/transactions`,
      { params }
    )
    return data
  },

  async create(workspaceId: string, dto: CreateTransactionDto): Promise<Transaction> {
    const { data } = await api.post<Transaction>(
      `/workspaces/${workspaceId}/transactions`,
      dto
    )
    return data
  },

  async update(transactionId: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const { data } = await api.put<Transaction>(`/transactions/${transactionId}`, dto)
    return data
  },

  async delete(transactionId: string): Promise<void> {
    await api.delete(`/transactions/${transactionId}`)
  },

  async importTransactions(workspaceId: string, transactions: ImportTransactionItem[]): Promise<ImportResult> {
    const { data } = await api.post<ImportResult>(
      `/workspaces/${workspaceId}/transactions/import`,
      { transactions }
    )
    return data
  },
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add co-spnd-web/src/services/workspaces.service.ts co-spnd-web/src/services/transactions.service.ts
git commit -m "feat(web): add categories and import endpoints to service layer"
```

---

## Task 6: Frontend — CSV parser utility

**Files:**
- Modify: `co-spnd-web/src/utils/csv.ts`

- [ ] **Step 1: Add `parseImportCsv` to csv.ts**

Replace the full contents of `co-spnd-web/src/utils/csv.ts` with:

```typescript
import type { Transaction } from '../types'

export function exportTransactionsToCsv(
  transactions: Transaction[],
  currency: string,
  filename: string,
): void {
  const header = ['Date', 'Amount', 'Currency', 'Category', 'Description', 'Spender']
  const rows = transactions.map((t) => [
    t.date.slice(0, 10),
    t.amount.toString(),
    currency,
    t.category,
    t.description ?? '',
    t.spenderName ?? '',
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export interface ParsedCsvRow {
  date: string       // YYYY-MM-DD
  description: string
  amount: number
  category: string
}

export interface CsvParseError {
  row: number        // 1-indexed data row (excludes header)
  message: string
}

export interface CsvParseResult {
  rows: ParsedCsvRow[]
  errors: CsvParseError[]
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function parseImportCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) {
    return { rows: [], errors: [{ row: 0, message: 'File is empty or has no data rows' }] }
  }

  const headerCells = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''))
  const colIndex = (name: string) => headerCells.indexOf(name)

  const dateIdx = colIndex('date')
  const descIdx = colIndex('description')
  const amountIdx = colIndex('amount')
  const categoryIdx = colIndex('category')

  if (dateIdx === -1 || amountIdx === -1 || categoryIdx === -1) {
    return {
      rows: [],
      errors: [{ row: 0, message: 'CSV must have Date, Amount, and Category columns' }],
    }
  }

  const rows: ParsedCsvRow[] = []
  const errors: CsvParseError[] = []

  for (let i = 1; i < lines.length; i++) {
    const dataRow = i // 1-indexed data row number
    const cells = parseCsvLine(lines[i])

    const rawAmount = cells[amountIdx] ?? ''
    const rawDate = cells[dateIdx] ?? ''
    const rawCategory = cells[categoryIdx] ?? ''
    const rawDescription = descIdx !== -1 ? (cells[descIdx] ?? '') : ''

    const amount = parseFloat(rawAmount)
    if (isNaN(amount) || amount <= 0) {
      errors.push({ row: dataRow, message: `Row ${dataRow}: invalid amount "${rawAmount}"` })
      continue
    }

    const dateValue = rawDate.trim()
    if (!dateValue || isNaN(Date.parse(dateValue))) {
      errors.push({ row: dataRow, message: `Row ${dataRow}: invalid date "${rawDate}"` })
      continue
    }

    // Normalize date to YYYY-MM-DD
    const date = new Date(dateValue).toISOString().slice(0, 10)

    const category = rawCategory.trim()
    if (!category) {
      errors.push({ row: dataRow, message: `Row ${dataRow}: missing category` })
      continue
    }

    // Skip rows with 'null' description (exported as string "null")
    const description = rawDescription === 'null' ? '' : rawDescription.trim()

    rows.push({ date, description, amount, category })
  }

  return { rows, errors }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add co-spnd-web/src/utils/csv.ts
git commit -m "feat(web): add parseImportCsv utility"
```

---

## Task 7: Frontend — AddTransactionSheet with workspace categories + inline "+"

**Files:**
- Modify: `co-spnd-web/src/pages/transactions/AddTransactionSheet.tsx`

- [ ] **Step 1: Rewrite AddTransactionSheet to support workspace categories**

Replace the full contents of `co-spnd-web/src/pages/transactions/AddTransactionSheet.tsx`:

```typescript
import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, Clipboard, X, AlertTriangle, Sparkles, Plus, Check } from 'lucide-react'
import { transactionsService } from '../../services/transactions.service'
import { workspacesService } from '../../services/workspaces.service'
import { useAuth } from '../../hooks/useAuth'
import type { Transaction, WorkspaceMember } from '../../types'
import { CATEGORIES } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { toInputDateValue } from '../../utils/date'
import { parseMessage, getParserKeywords } from '../../utils/messageParser'

interface AddTransactionSheetProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  currency: string
  onAdded: (tx: Transaction) => void
  openWithPaste?: boolean
}

export function AddTransactionSheet({
  isOpen,
  onClose,
  workspaceId,
  currency,
  onAdded,
  openWithPaste = false,
}: AddTransactionSheetProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(toInputDateValue())
  const [spenderId, setSpenderId] = useState('')
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [showMore, setShowMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Inline new category creation
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)
  const newCatInputRef = useRef<HTMLInputElement>(null)

  // paste-to-fill state
  const [parsedFrom, setParsedFrom] = useState(false)
  const [isCreditWarning, setIsCreditWarning] = useState(false)
  const [showPasteArea, setShowPasteArea] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const pasteRef = useRef<HTMLTextAreaElement>(null)

  const allCategories = [...CATEGORIES, ...customCategories]

  useEffect(() => {
    if (isOpen && user) {
      setSpenderId(user.id)
      workspacesService.getMembers(workspaceId).then(setMembers).catch(() => {})
      workspacesService.getCategories(workspaceId).then(setCustomCategories).catch(() => {})
    }
  }, [isOpen, workspaceId, user])

  useEffect(() => {
    if (showPasteArea) {
      setTimeout(() => pasteRef.current?.focus(), 50)
    }
  }, [showPasteArea])

  useEffect(() => {
    if (addingCategory) {
      setTimeout(() => newCatInputRef.current?.focus(), 50)
    }
  }, [addingCategory])

  useEffect(() => {
    if (isOpen && openWithPaste) {
      setTimeout(() => handleClipboardPaste(), 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openWithPaste])

  function applyParsed(text: string) {
    if (!text.trim()) return
    const result = parseMessage(text, getParserKeywords())
    if (result.amount !== null) setAmount(result.amount.toString())
    setCategory(result.category)
    if (result.description) setDescription(result.description)
    setDate(result.date)
    setParsedFrom(true)
    setIsCreditWarning(result.isCredit)
    setShowPasteArea(false)
    setPasteText('')
    if (result.amount === null) setError('Could not detect an amount. Please enter it manually.')
  }

  async function handleClipboardPaste() {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        applyParsed(text)
      } else {
        setShowPasteArea(true)
      }
    } catch {
      setShowPasteArea(true)
    }
  }

  function clearParsed() {
    setParsedFrom(false)
    setIsCreditWarning(false)
    setAmount('')
    setCategory(CATEGORIES[0])
    setDescription('')
    setDate(toInputDateValue())
  }

  function reset() {
    setAmount('')
    setCategory(CATEGORIES[0])
    setDescription('')
    setDate(toInputDateValue())
    setSpenderId(user?.id ?? '')
    setShowMore(false)
    setError('')
    setParsedFrom(false)
    setIsCreditWarning(false)
    setShowPasteArea(false)
    setPasteText('')
    setAddingCategory(false)
    setNewCategoryInput('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSaveNewCategory() {
    const trimmed = newCategoryInput.trim()
    if (!trimmed) return
    if (allCategories.includes(trimmed)) {
      setCategory(trimmed)
      setAddingCategory(false)
      setNewCategoryInput('')
      return
    }
    setSavingCategory(true)
    try {
      const updated = await workspacesService.updateCategories(workspaceId, [trimmed], [])
      setCustomCategories(updated)
      setCategory(trimmed)
    } catch {
      // silently fall back — category still gets selected locally
      setCustomCategories((prev) => [...prev, trimmed])
      setCategory(trimmed)
    } finally {
      setSavingCategory(false)
      setAddingCategory(false)
      setNewCategoryInput('')
    }
  }

  async function handleSubmit() {
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid amount.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      const tx = await transactionsService.create(workspaceId, {
        amount: parsed,
        category,
        description: description.trim() || undefined,
        date,
        spenderId: spenderId || undefined,
      })
      onAdded(tx)
      handleClose()
    } catch {
      setError('Failed to add transaction.')
    } finally {
      setIsLoading(false)
    }
  }

  const currencySymbol = (() => {
    try {
      return (
        new Intl.NumberFormat('en-US', { style: 'currency', currency })
          .formatToParts(0)
          .find((p) => p.type === 'currency')?.value ?? currency
      )
    } catch {
      return currency
    }
  })()

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Add expense">
      <div className="flex flex-col gap-5">

        {/* ── Paste-to-fill zone ─────────────────────────────────────── */}
        {!parsedFrom && !showPasteArea && (
          <button
            type="button"
            onClick={handleClipboardPaste}
            className="flex items-center gap-2.5 w-full px-4 py-3 bg-[#F3F0FF] border border-[#DDD5FF] rounded-2xl text-left hover:bg-[#EBE5FF] transition-colors active:scale-[0.98]"
          >
            <Clipboard size={16} className="text-[#863bff] shrink-0" />
            <span className="text-sm font-semibold text-[#863bff]">Paste a bank message to auto-fill</span>
          </button>
        )}

        {/* Paste textarea fallback */}
        {showPasteArea && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400">
              Paste your message
            </label>
            <textarea
              ref={pasteRef}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'e.g. "Your account was debited EGP 245.50 at Costa Coffee on 28-May-2026"'}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 outline-none focus:border-[#863bff] focus:ring-2 focus:ring-[#F3F0FF] transition-all resize-none leading-relaxed"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setShowPasteArea(false); setPasteText('') }}
                className="flex-1"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => applyParsed(pasteText)}
                disabled={!pasteText.trim()}
                className="flex-1 py-2 px-4 bg-[#863bff] text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-[#7333e0] transition-colors active:scale-95"
              >
                Fill fields
              </button>
            </div>
          </div>
        )}

        {/* Parsed badge */}
        {parsedFrom && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-[#F3F0FF] border border-[#DDD5FF] rounded-2xl">
            <Sparkles size={15} className="text-[#863bff] shrink-0 mt-0.5" />
            <p className="text-sm text-[#5A3DB5] font-medium flex-1">Fields filled from message — review before saving.</p>
            <button onClick={clearParsed} className="text-[#863bff] hover:text-[#5A3DB5] transition-colors shrink-0">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Credit warning */}
        {isCreditWarning && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 font-medium">
              This looks like a credit or refund. Log it anyway?
            </p>
          </div>
        )}

        {/* ── Amount ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400">
            Amount
          </label>
          <div className="relative flex items-center bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition-all duration-150">
            <span className="pl-4 text-2xl text-gray-400 font-money select-none">
              {currencySymbol}
            </span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-2 py-4 text-4xl font-money font-semibold text-gray-950 bg-transparent outline-none placeholder-gray-200 min-w-0"
            />
          </div>
        </div>

        {/* ── Category chips ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {allCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all duration-150 active:scale-95 truncate ${
                  category === cat
                    ? 'bg-gray-950 text-white border-gray-950 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}

            {/* Inline new category */}
            {addingCategory ? (
              <div className="col-span-3 flex items-center gap-2 mt-1">
                <input
                  ref={newCatInputRef}
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNewCategory()
                    if (e.key === 'Escape') { setAddingCategory(false); setNewCategoryInput('') }
                  }}
                  placeholder="Category name"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSaveNewCategory}
                  disabled={!newCategoryInput.trim() || savingCategory}
                  className="w-9 h-9 flex items-center justify-center bg-gray-950 text-white rounded-xl disabled:opacity-40 transition-colors"
                >
                  {savingCategory ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingCategory(false); setNewCategoryInput('') }}
                  className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingCategory(true)}
                className="py-2.5 px-3 rounded-xl text-sm font-semibold border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all duration-150 active:scale-95 flex items-center justify-center gap-1"
              >
                <Plus size={13} />
                New
              </button>
            )}
          </div>
        </div>

        {/* ── More details ────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-400 hover:text-gray-600 self-start transition-colors"
        >
          {showMore ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {showMore ? 'Less details' : 'More details'}
        </button>

        {showMore && (
          <div className="flex flex-col gap-4 pt-1 border-t border-gray-100">
            <Input
              label="Description"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {members.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-600 tracking-tight">
                  Paid by
                </label>
                <select
                  value={spenderId}
                  onChange={(e) => setSpenderId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-950 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all duration-150"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.id === user?.id ? ' (you)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl">
            {error}
          </p>
        )}

        <Button onClick={handleSubmit} isLoading={isLoading} size="lg" className="w-full">
          Add expense
        </Button>
      </div>
    </BottomSheet>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add co-spnd-web/src/pages/transactions/AddTransactionSheet.tsx
git commit -m "feat(web): add custom categories support and inline category creation to AddTransactionSheet"
```

---

## Task 8: Frontend — MembersPage categories section

**Files:**
- Modify: `co-spnd-web/src/pages/workspaces/MembersPage.tsx`

- [ ] **Step 1: Add categories state and load logic**

In `MembersPage.tsx`, add these state variables after the `budget` state declarations:

```typescript
// Categories
const [customCategories, setCustomCategories] = useState<string[]>([])
const [newCategoryInput, setNewCategoryInput] = useState('')
const [addingCategory, setAddingCategory] = useState(false)
const [categoryLoading, setCategoryLoading] = useState(false)
```

Add `workspacesService.getCategories(workspaceId)` to the `load` function's `Promise.all` call and set it:

```typescript
const load = useCallback(async () => {
  if (!workspaceId) return
  setIsError(false)
  const now = new Date()
  const { from, to } = getMonthRange(now)
  try {
    const [membersData, splitData, analyticsData, workspaces, categoriesData] = await Promise.all([
      workspacesService.getMembers(workspaceId),
      workspacesService.getSplittingConfig(workspaceId),
      analyticsService.get(workspaceId, from, to),
      workspacesService.list(),
      workspacesService.getCategories(workspaceId),
    ])
    setMembers(membersData)
    setSplitConfig(splitData)
    setAnalytics(analyticsData)
    const ws = workspaces.find((w) => w.id === workspaceId) ?? null
    setWorkspace(ws)
    setCurrency(ws?.currency ?? 'USD')
    setIsCreator(ws?.createdBy?.toString() === user?.id)
    setCustomCategories(categoriesData)
  } catch {
    setIsError(true)
  }
}, [workspaceId, user?.id])
```

- [ ] **Step 2: Add category handler functions**

Add these functions after the `handleCloseInvite` function:

```typescript
async function handleAddCategory() {
  const trimmed = newCategoryInput.trim()
  if (!trimmed || !workspaceId) return
  setCategoryLoading(true)
  try {
    const updated = await workspacesService.updateCategories(workspaceId, [trimmed], [])
    setCustomCategories(updated)
    setNewCategoryInput('')
    setAddingCategory(false)
  } catch {
    // keep input open, user can retry
  } finally {
    setCategoryLoading(false)
  }
}

async function handleRemoveCategory(cat: string) {
  if (!workspaceId) return
  try {
    const updated = await workspacesService.updateCategories(workspaceId, [], [cat])
    setCustomCategories(updated)
  } catch {
    // silently ignore
  }
}
```

- [ ] **Step 3: Add Categories section to JSX**

Insert this section in the JSX `<div className="px-5 flex flex-col gap-6">` block, after the Budget section:

```tsx
{/* ── Categories ──────────────────────────────────── */}
<section>
  <div className="flex items-center justify-between mb-3">
    <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#B5ADA4]">Custom Categories</p>
    {!addingCategory && (
      <button
        onClick={() => setAddingCategory(true)}
        className="text-xs font-semibold text-[#8C8479] hover:text-[#0E0C0A] transition-colors flex items-center gap-1"
      >
        <Plus size={12} />
        Add
      </button>
    )}
  </div>

  <div className="bg-white rounded-2xl border border-[#EDE9E1] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
    {customCategories.length === 0 && !addingCategory ? (
      <div className="px-4 py-4 text-sm text-[#B5ADA4] text-center">No custom categories yet</div>
    ) : (
      <div className="divide-y divide-[#F2F0EB]">
        {customCategories.map((cat) => (
          <div key={cat} className="px-4 py-3 flex items-center justify-between">
            <span className="text-[15px] font-medium text-[#0E0C0A]">{cat}</span>
            <button
              onClick={() => handleRemoveCategory(cat)}
              className="w-7 h-7 flex items-center justify-center text-[#B5ADA4] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    )}

    {addingCategory && (
      <div className="px-4 py-3 border-t border-[#F2F0EB] flex items-center gap-2">
        <input
          autoFocus
          value={newCategoryInput}
          onChange={(e) => setNewCategoryInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddCategory()
            if (e.key === 'Escape') { setAddingCategory(false); setNewCategoryInput('') }
          }}
          placeholder="e.g. Groceries"
          className="flex-1 text-sm text-[#0E0C0A] bg-transparent outline-none"
        />
        <button
          onClick={handleAddCategory}
          disabled={!newCategoryInput.trim() || categoryLoading}
          className="w-7 h-7 flex items-center justify-center bg-[#0E0C0A] text-white rounded-lg disabled:opacity-40 transition-colors"
        >
          {categoryLoading ? (
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check size={12} />
          )}
        </button>
        <button
          onClick={() => { setAddingCategory(false); setNewCategoryInput('') }}
          className="w-7 h-7 flex items-center justify-center text-[#B5ADA4] hover:text-[#8C8479] rounded-lg transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    )}
  </div>
</section>
```

- [ ] **Step 4: Add missing imports to MembersPage.tsx**

Ensure these are in the lucide-react import line at the top:

```typescript
import { UserPlus, Users, CheckCircle2, Wallet, Pencil, Check, X, Plus } from 'lucide-react'
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add co-spnd-web/src/pages/workspaces/MembersPage.tsx
git commit -m "feat(web): add custom categories management to workspace settings page"
```

---

## Task 9: Frontend — CSV import FAB + flow + result modal in TransactionsPage

**Files:**
- Modify: `co-spnd-web/src/pages/transactions/TransactionsPage.tsx`

- [ ] **Step 1: Add import state variables and hidden file input ref**

Add these state declarations after the existing state in `TransactionsPage`:

```typescript
const [importing, setImporting] = useState(false)
const [importResult, setImportResult] = useState<{ imported: number; errors: { row: number; message: string }[] } | null>(null)
const fileInputRef = useRef<HTMLInputElement>(null)
```

Also add `useRef` to the React import if not already present:
```typescript
import { useState, useEffect, useCallback, useRef } from 'react'
```

- [ ] **Step 2: Add the import handler function**

Add this function after `handleExport`:

```typescript
async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!fileInputRef.current) return
  fileInputRef.current.value = ''
  if (!file || !workspaceId) return

  setImporting(true)
  try {
    const text = await file.text()
    const { rows, errors: parseErrors } = parseImportCsv(text)

    if (rows.length === 0) {
      setImportResult({ imported: 0, errors: parseErrors })
      return
    }

    // Collect unrecognized categories and auto-create them
    const knownCategories = new Set([
      ...CATEGORIES,
      ...(await workspacesService.getCategories(workspaceId)),
    ])
    const newCats = [...new Set(rows.map((r) => r.category).filter((c) => !knownCategories.has(c)))]
    if (newCats.length > 0) {
      await workspacesService.updateCategories(workspaceId, newCats, [])
    }

    const result = await transactionsService.importTransactions(
      workspaceId,
      rows.map((r) => ({
        amount: r.amount,
        category: r.category,
        description: r.description || undefined,
        date: r.date,
      })),
    )

    setImportResult({
      imported: result.imported,
      errors: [...parseErrors, ...result.errors],
    })

    if (result.imported > 0) {
      load()
    }
  } catch {
    setImportResult({ imported: 0, errors: [{ row: 0, message: 'Failed to import. Please try again.' }] })
  } finally {
    setImporting(false)
  }
}
```

- [ ] **Step 3: Add the upload FAB button and hidden file input**

Find the FAB cluster in the JSX (the `<div className="fixed bottom-24 right-5...">`) and add the upload button as a third FAB above the clipboard button:

```tsx
{/* FAB cluster */}
<div className="fixed bottom-24 right-5 lg:bottom-8 flex flex-col items-center gap-2.5 z-30">
  <button
    onClick={() => fileInputRef.current?.click()}
    disabled={importing}
    className="w-12 h-12 bg-white border border-[#EDE9E1] text-emerald-600 rounded-2xl shadow-md hover:bg-emerald-50 active:scale-95 transition-all duration-150 flex items-center justify-center disabled:opacity-50"
    aria-label="Import CSV"
  >
    {importing ? (
      <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    ) : (
      <Upload size={18} />
    )}
  </button>
  <button
    onClick={() => { setPasteMode(true); setShowAdd(true) }}
    className="w-12 h-12 bg-white border border-[#EDE9E1] text-[#863bff] rounded-2xl shadow-md hover:bg-[#F3F0FF] active:scale-95 transition-all duration-150 flex items-center justify-center"
    aria-label="Paste bank message"
  >
    <Clipboard size={18} />
  </button>
  <button
    onClick={() => { setPasteMode(false); setShowAdd(true) }}
    className="w-14 h-14 bg-[#0E0C0A] text-white rounded-2xl shadow-lg hover:bg-[#2A2724] active:scale-95 transition-all duration-150 flex items-center justify-center"
    aria-label="Add expense"
  >
    <Plus size={22} />
  </button>
</div>

{/* Hidden file input for CSV import */}
<input
  ref={fileInputRef}
  type="file"
  accept=".csv,text/csv"
  className="hidden"
  onChange={handleImportFile}
/>
```

- [ ] **Step 4: Add the import result modal**

Add this modal at the bottom of the JSX, after the delete confirmation modal:

```tsx
{/* Import result modal */}
<Modal
  isOpen={Boolean(importResult)}
  onClose={() => setImportResult(null)}
  title="Import complete"
>
  {importResult && (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
        <p className="text-sm font-semibold text-emerald-700">
          {importResult.imported} transaction{importResult.imported !== 1 ? 's' : ''} imported successfully
        </p>
      </div>
      {importResult.errors.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#B5ADA4]">
            {importResult.errors.length} row{importResult.errors.length !== 1 ? 's' : ''} skipped
          </p>
          <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5">
            {importResult.errors.map((err, i) => (
              <p key={i} className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">
                {err.message}
              </p>
            ))}
          </div>
        </div>
      )}
      <Button onClick={() => setImportResult(null)} className="w-full">Done</Button>
    </div>
  )}
</Modal>
```

- [ ] **Step 5: Update imports in TransactionsPage.tsx**

Ensure the import lines include everything new:

```typescript
import { Plus, Trash2, Pencil, Receipt, Download, ChevronLeft, ChevronRight, SlidersHorizontal, X, Clipboard, Upload, CheckCircle2 } from 'lucide-react'
import { transactionsService } from '../../services/transactions.service'
import { workspacesService } from '../../services/workspaces.service'
import { parseImportCsv } from '../../utils/csv'
import { CATEGORIES } from '../../types'
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Verify the app builds**

```bash
cd co-spnd-web && npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add co-spnd-web/src/pages/transactions/TransactionsPage.tsx
git commit -m "feat(web): add CSV import FAB, import flow, and result modal to TransactionsPage"
```
