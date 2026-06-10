import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, CheckCheck, Trash2, BellOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from './BottomSheet'
import { notificationsService } from '../../services/notifications.service'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import type { Notification } from '../../types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pushLoading, setPushLoading] = useState(false)
  const navigate = useNavigate()
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const { permission, subscribe, unsubscribe, isSupported } = usePushNotifications()

  const load = useCallback(async () => {
    try {
      const data = await notificationsService.list()
      setNotifications(data)
    } catch {}
  }, [])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 30_000)
    return () => clearInterval(intervalRef.current)
  }, [load])

  const unread = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = async () => {
    await notificationsService.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleRead = async (id: string) => {
    await notificationsService.markRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleDelete = async (id: string) => {
    await notificationsService.remove(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleClick = async (n: Notification) => {
    if (!n.read) await handleRead(n.id)
    if (n.workspaceId) {
      navigate(`/workspaces/${n.workspaceId}/transactions`)
      setOpen(false)
    }
  }

  const handleEnablePush = async () => {
    setPushLoading(true)
    await subscribe()
    setPushLoading(false)
  }

  const handleDisablePush = async () => {
    setPushLoading(true)
    await unsubscribe()
    setPushLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center w-8 h-8 rounded-xl text-[#8C8479] hover:text-[#0E0C0A] hover:bg-[#F2F0EB] transition-all"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold bg-[#0E0C0A] text-white rounded-full px-1 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Notifications">
        {/* Push permission banner */}
        {isSupported && permission === 'default' && (
          <div className="mb-4 flex items-center justify-between gap-3 px-3 py-3 bg-[#F2F0EB] rounded-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <Bell size={15} strokeWidth={2} className="text-[#6B6560] flex-shrink-0" />
              <p className="text-[12.5px] font-medium text-[#3D3A37] leading-tight">
                Get notified on your device
              </p>
            </div>
            <button
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="flex-shrink-0 text-[12px] font-semibold text-white bg-[#0E0C0A] hover:bg-[#2C2A27] disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {pushLoading ? '…' : 'Enable'}
            </button>
          </div>
        )}

        {isSupported && permission === 'denied' && (
          <div className="mb-4 flex items-center gap-2.5 px-3 py-2.5 bg-[#F9F8F5] rounded-xl">
            <BellOff size={14} strokeWidth={2} className="text-[#B5ADA4] flex-shrink-0" />
            <p className="text-[12px] text-[#B5ADA4]">
              Push notifications blocked — enable in browser settings
            </p>
          </div>
        )}

        {isSupported && permission === 'granted' && (
          <div className="mb-4 flex items-center justify-between gap-3 px-3 py-2.5 bg-[#F9F8F5] rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <Bell size={14} strokeWidth={2} className="text-[#6B6560] flex-shrink-0" />
              <p className="text-[12px] font-medium text-[#6B6560]">Push notifications on</p>
            </div>
            <button
              onClick={handleDisablePush}
              disabled={pushLoading}
              className="flex-shrink-0 text-[11.5px] font-semibold text-[#B5ADA4] hover:text-[#6B6560] disabled:opacity-50 transition-colors"
            >
              {pushLoading ? '…' : 'Turn off'}
            </button>
          </div>
        )}

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[#C5BFB8]">
            <Bell size={26} strokeWidth={1.5} className="mb-2.5" />
            <p className="text-[13px] font-medium">No notifications yet</p>
          </div>
        ) : (
          <>
            {unread > 0 && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-[#8C8479] hover:text-[#0E0C0A] transition-colors"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              </div>
            )}
            <div className="space-y-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
                    n.read ? 'hover:bg-[#F9F8F5]' : 'bg-[#F2F0EB] hover:bg-[#EDE9E1]'
                  }`}
                >
                  <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.read ? '' : 'bg-[#0E0C0A]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-tight ${n.read ? 'font-medium text-[#6B6560]' : 'font-semibold text-[#0E0C0A]'}`}>
                      {n.title}
                    </p>
                    <p className="text-[12px] text-[#B5ADA4] mt-0.5 leading-snug">{n.body}</p>
                    <p className="text-[11px] text-[#C5BFB8] mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }}
                    className="mt-1 text-[#D5D0CA] hover:text-[#8C8479] transition-colors flex-shrink-0"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </BottomSheet>
    </>
  )
}
