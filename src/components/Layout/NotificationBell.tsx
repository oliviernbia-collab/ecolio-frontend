import { useState, useEffect } from 'react'
import { IconButton, Badge, Box, Menu, MenuItem, Divider, Tooltip, Typography } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faBell, faCircle } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { Notification } from '../../types'

// Cloche des notifications (absences, notes, factures…) : en-tête du personnel et portails parent / élève
export default function NotificationBell({ color = '#6b7280' }: { color?: string }) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.get('/notifications').then(r => {
      setNotifications(r.data.data || [])
      setUnread(r.data.unread || 0)
    }).catch(() => {})
  }, [])

  const handleClick = async (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(e.currentTarget)
    if (unread > 0) {
      await api.put('/notifications/read-all').catch(() => {})
      setUnread(0)
      setNotifications(n => n.map(x => ({ ...x, is_read: true })))
    }
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={handleClick} sx={{ color }}>
          <Badge badgeContent={unread} color="error">
            <FontAwesomeIcon icon={faBell} style={{ fontSize: '1.1rem' }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        PaperProps={{ sx: { width: 320, maxWidth: 'calc(100vw - 32px)', maxHeight: 400 } }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>Notifications</Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled><Typography variant="caption">Aucune notification</Typography></MenuItem>
        ) : notifications.slice(0, 8).map(n => (
          <MenuItem key={n.id} sx={{ py: 1.5, gap: 1, alignItems: 'flex-start', whiteSpace: 'normal' }}>
            <FontAwesomeIcon icon={faCircle}
              style={{ fontSize: '0.45rem', color: n.is_read ? '#d1d5db' : '#2E86AB', marginTop: 6, flexShrink: 0 }} />
            <Box>
              <Typography variant="caption" fontWeight={n.is_read ? 400 : 600} display="block">{n.title}</Typography>
              {n.content && <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{n.content}</Typography>}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
