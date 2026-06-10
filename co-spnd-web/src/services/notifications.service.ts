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

  async getVapidPublicKey(): Promise<string | null> {
    const { data } = await api.get<{ publicKey: string | null }>('/notifications/vapid-public-key')
    return data.publicKey
  },

  async subscribePush(sub: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
    await api.post('/notifications/subscribe', {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    })
  },

  async unsubscribePush(endpoint: string): Promise<void> {
    await api.delete('/notifications/subscribe', { data: { endpoint } })
  },
}
