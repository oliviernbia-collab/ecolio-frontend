import { useState, useEffect } from 'react'
import {
  AppBar, Toolbar, IconButton, Typography, Badge, Box, Avatar,
  Menu, MenuItem, Divider, ListItemIcon, Tooltip, Chip
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faBars, faBell, faRightFromBracket, faUser, faCircle
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { Notification } from '../../types'
import { ECOLIO_NAVY } from '../../theme'

interface HeaderProps {
  onMenuClick: () => void
  sidebarWidth: number
}

const roleLabels: Record<string, string> = {
  director: 'Directeur', teacher: 'Enseignant', accountant: 'Comptable',
  parent: 'Parent', student: 'Élève', super_admin: 'Super Admin', secretary: 'Secrétaire'
}

export default function Header({ onMenuClick, sidebarWidth }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.get('/notifications').then(r => {
      setNotifications(r.data.data || [])
      setUnread(r.data.unread || 0)
    }).catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNotifClick = async (e: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(e.currentTarget)
    if (unread > 0) {
      await api.put('/notifications/read-all').catch(() => {})
      setUnread(0)
      setNotifications(n => n.map(x => ({ ...x, is_read: true })))
    }
  }

  return (
    <AppBar position="fixed" elevation={0}
      sx={{
        width: { sm: `calc(100% - ${sidebarWidth}px)` },
        ml: { sm: `${sidebarWidth}px` },
        backgroundColor: 'white', color: 'text.primary',
        borderBottom: '1px solid #eef0f4',
        transition: 'width 0.2s, margin 0.2s'
      }}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '60px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton edge="start" onClick={onMenuClick} sx={{ display: { sm: 'none' }, color: ECOLIO_NAVY }}>
            <FontAwesomeIcon icon={faBars} style={{ fontSize: '1.1rem' }} />
          </IconButton>
          {user?.school_name && (
            <Typography variant="subtitle2" sx={{ color: '#6b7280', display: { xs: 'none', md: 'block' } }}>
              {user.school_name}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton onClick={handleNotifClick} sx={{ color: '#6b7280' }}>
              <Badge badgeContent={unread} color="error">
                <FontAwesomeIcon icon={faBell} style={{ fontSize: '1.1rem' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User avatar */}
          <Tooltip title="Mon compte">
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', borderRadius: 2, px: 1, py: 0.5, '&:hover': { bgcolor: '#f5f6fa' } }}
              onClick={e => setAnchorEl(e.currentTarget)}
            >
              <Avatar src={user?.avatar_url || ''} sx={{ width: 32, height: 32, bgcolor: ECOLIO_NAVY, fontSize: '0.8rem' }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.65rem' }}>
                  {roleLabels[user?.role || ''] || user?.role}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Notifications menu */}
      <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={() => setNotifAnchor(null)}
        PaperProps={{ sx: { width: 320, maxHeight: 400 } }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>Notifications</Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled><Typography variant="caption">Aucune notification</Typography></MenuItem>
        ) : notifications.slice(0, 8).map(n => (
          <MenuItem key={n.id} sx={{ py: 1.5, gap: 1, alignItems: 'flex-start' }}>
            <FontAwesomeIcon icon={faCircle}
              style={{ fontSize: '0.45rem', color: n.is_read ? '#d1d5db' : '#2E86AB', marginTop: 6, flexShrink: 0 }} />
            <Box>
              <Typography variant="caption" fontWeight={n.is_read ? 400 : 600} display="block">{n.title}</Typography>
              {n.content && <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{n.content}</Typography>}
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* User menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>{user?.first_name} {user?.last_name}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          <br />
          <Chip label={roleLabels[user?.role || ''] || user?.role} size="small" sx={{ mt: 0.5, fontSize: '0.65rem' }} />
        </Box>
        <Divider />
        <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings') }}>
          <ListItemIcon>
            <FontAwesomeIcon icon={faUser} style={{ fontSize: '0.9rem' }} />
          </ListItemIcon>
          Mon profil
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: '0.9rem', color: '#d32f2f' }} />
          </ListItemIcon>
          Déconnexion
        </MenuItem>
      </Menu>
    </AppBar>
  )
}
