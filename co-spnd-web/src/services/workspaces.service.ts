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

  async invite(workspaceId: string, email: string): Promise<{ success: boolean }> {
    const { data } = await api.post<{ success: boolean }>(
      `/workspaces/${workspaceId}/invite`,
      { email }
    )
    return data
  },

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data } = await api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`)
    return data
  },

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
}
