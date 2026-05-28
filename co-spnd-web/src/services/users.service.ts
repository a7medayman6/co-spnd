import api from './api'
import type { User } from '../types'

export const usersService = {
  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/users/me')
    return data
  },

  async updateProfile(payload: { name?: string; avatarUrl?: string }): Promise<User> {
    const { data } = await api.put<User>('/users/me', payload)
    return data
  },
}
