import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Box, Avatar, IconButton, Menu, MenuItem,
  Container, Tabs, Tab, Divider, useTheme, useMediaQuery, Drawer, List,
  ListItemButton, ListItemIcon, ListItemText
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faHouse, faBookOpen, faCalendarDays, faClockRotateLeft,
  faFileInvoiceDollar, faRightFromBracket, faUser, faBars, faGraduationCap
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'

interface NavItem { label: string; icon: any; path: string }

const STUDENT_NAV: NavItem[] = [
  { label: 'Accueil',         icon: faHouse,             path: '/portal/student' },
  { label: 'Notes',           icon: faBookOpen,           path: '/portal/student/grades' },
  { label: 'Présences',       icon: faClockRotateLeft,    path: '/portal/student/attendance' },
  { label: 'Emploi du temps', icon: faCalendarDays,       path: '/portal/student/schedule' },
]

const PARENT_NAV: NavItem[] = [
  { label: 'Mes enfants',     icon: faGraduationCap,      path: '/portal/parent' },
  { label: 'Notes',           icon: faBookOpen,           path: '/portal/parent/grades' },
  { label: 'Présences',       icon: faClockRotateLeft,    path: '/portal/parent/attendance' },
  { label: 'Emploi du temps', icon: faCalendarDays,       path: '/portal/parent/schedule' },
  { label: 'Finances',        icon: faFileInvoiceDollar,  path: '/portal/parent/finance' },
]

export default function PortalLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navItems = user?.role === 'student' ? STUDENT_NAV : PARENT_NAV
  const portalLabel = user?.role === 'student' ? 'Espace Élève' : 'Espace Parent'

  const activeTab = navItems.findIndex(n => location.pathname.startsWith(n.path) && (n.path !== '/portal/student' && n.path !== '/portal/parent' ? true : location.pathname === n.path))
  const safeTab = activeTab === -1 ? 0 : activeTab

  const handleNav = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f6fa' }}>
      {/* AppBar */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#1A3C5E', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Toolbar sx={{ gap: 1.5 }}>
          {isMobile && (
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} size="small">
              <FontAwesomeIcon icon={faBars} />
            </IconButton>
          )}

          {user?.school_logo
            ? <Box component="img" src={user.school_logo} sx={{ height: 32, borderRadius: 1, mr: 0.5 }} />
            : null}
          <Box>
            <Typography fontWeight={700} fontSize="0.95rem" lineHeight={1.2}>
              {user?.school_name || 'Écolio'}
            </Typography>
            <Typography fontSize="0.7rem" sx={{ opacity: 0.7 }}>{portalLabel}</Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Tabs desktop */}
          {!isMobile && (
            <Tabs
              value={safeTab}
              textColor="inherit"
              TabIndicatorProps={{ style: { backgroundColor: '#2E86AB', height: 3 } }}
              sx={{ '& .MuiTab-root': { minHeight: 64, fontSize: '0.8rem', fontWeight: 500 } }}
            >
              {navItems.map((n, i) => (
                <Tab
                  key={n.path}
                  label={n.label}
                  icon={<FontAwesomeIcon icon={n.icon} style={{ fontSize: '0.85rem' }} />}
                  iconPosition="start"
                  onClick={() => handleNav(n.path)}
                />
              ))}
            </Tabs>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Avatar menu */}
          <IconButton onClick={e => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#2E86AB', fontSize: '0.85rem' }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                {user?.first_name} {user?.last_name}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); logout() }}>
              <FontAwesomeIcon icon={faRightFromBracket} style={{ marginRight: 8 }} />
              Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer mobile */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 240 } }}>
        <Box sx={{ p: 2, bgcolor: '#1A3C5E', color: '#fff' }}>
          <Typography fontWeight={700}>{user?.school_name}</Typography>
          <Typography fontSize="0.75rem" sx={{ opacity: 0.7 }}>{portalLabel}</Typography>
        </Box>
        <List>
          {navItems.map(n => (
            <ListItemButton
              key={n.path}
              selected={location.pathname === n.path || (n.path !== '/portal/student' && n.path !== '/portal/parent' && location.pathname.startsWith(n.path))}
              onClick={() => handleNav(n.path)}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <FontAwesomeIcon icon={n.icon} style={{ fontSize: '0.9rem', color: '#1A3C5E' }} />
              </ListItemIcon>
              <ListItemText primary={n.label} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <ListItemButton onClick={() => { setDrawerOpen(false); logout() }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: '0.9rem', color: '#e74c3c' }} />
          </ListItemIcon>
          <ListItemText primary="Déconnexion" sx={{ color: '#e74c3c' }} />
        </ListItemButton>
      </Drawer>

      {/* Contenu */}
      <Container maxWidth="lg" sx={{ py: 3, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
