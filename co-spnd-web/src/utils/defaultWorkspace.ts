const KEY = 'co_spnd_default_workspace'

export function getDefaultWorkspace(): string | null {
  return localStorage.getItem(KEY)
}

export function setDefaultWorkspace(workspaceId: string): void {
  localStorage.setItem(KEY, workspaceId)
}

export function clearDefaultWorkspace(): void {
  localStorage.removeItem(KEY)
}
