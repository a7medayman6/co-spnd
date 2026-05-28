const key = (workspaceId: string) => `co_spnd_budget_${workspaceId}`

export function getBudget(workspaceId: string): number | null {
  const val = localStorage.getItem(key(workspaceId))
  return val !== null ? parseFloat(val) : null
}

export function setBudget(workspaceId: string, amount: number): void {
  localStorage.setItem(key(workspaceId), amount.toString())
}

export function clearBudget(workspaceId: string): void {
  localStorage.removeItem(key(workspaceId))
}
