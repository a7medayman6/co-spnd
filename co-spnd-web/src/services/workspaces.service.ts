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
