import api from './api'
import type { Notification } from '../types'

export const notificationsService = {
  async list(): Promise<Notification[]> {
    const { data } = await api.get<Notification[]>('/notifications')
    return data
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`)
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all')
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`)
  },
}
