import { useState, useCallback } from 'react'
import { notificationsService } from '../services/notifications.service'

function toApplicationServerKey(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i)
  return buffer
}

const isSupported =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied',
  )

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    const result = await Notification.requestPermission()
    setPermission(result)
    if (result !== 'granted') return false

    try {
      const publicKey = await notificationsService.getVapidPublicKey()
      if (!publicKey) return false

      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      const pushSub = existing ?? (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toApplicationServerKey(publicKey),
      }))

      await notificationsService.subscribePush(pushSub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } })
      return true
    } catch {
      return false
    }
  }, [])

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!isSupported) return
    try {
      const registration = await navigator.serviceWorker.ready
      const pushSub = await registration.pushManager.getSubscription()
      if (pushSub) {
        await notificationsService.unsubscribePush(pushSub.endpoint)
        await pushSub.unsubscribe()
      }
      setPermission('default')
    } catch {}
  }, [])

  return { permission, subscribe, unsubscribe, isSupported }
}
