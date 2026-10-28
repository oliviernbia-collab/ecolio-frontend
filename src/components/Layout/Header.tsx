import { useState } from 'react'
import {
  AppBar, Toolbar, IconButton, Typography, Box, Avatar,
  Menu, MenuItem, Divider, ListItemIcon, Tooltip, Chip
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faBars, faRightFromBracket, faUser
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import NotificationBell from './NotificationBell'
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

  const handleLogout = () => {
    logout()
    navigate('/login')
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
          <NotificationBell />

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
