import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, Tooltip, IconButton
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faGauge, faUsers, faChartLine, faCalendarCheck, faCalendarDays,
  faIdBadge, faWallet, faEnvelope, faGear, faChevronLeft, faBars,
  faGraduationCap, faAddressCard, faChalkboard, faXmark, faBookOpen, faUserGroup,
  faFileSignature, faFingerprint, faMoneyBillWave, faCommentSms, faHouse,
  faBook, faBriefcaseMedical, faBus, faGlobe
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'

const DRAWER_WIDTH = 240
const COLLAPSED_WIDTH = 64

const navItems = [
  { path: '/accueil',        label: 'Accueil',          icon: faHouse,         roles: ['super_admin','director','teacher','parent','student','accountant','counselor','librarian','nurse','maintenance','secretary'] },
  { path: '/admin',          label: 'Plateforme',       icon: faGlobe,         roles: ['super_admin'] },
  { path: '/',                label: 'Tableau de bord',  icon: faGauge,         roles: ['super_admin','director','teacher','parent','accountant','secretary'] },
  { path: '/classes',         label: 'Classes',          icon: faChalkboard,    roles: ['super_admin','director','teacher','counselor','secretary'] },
  { path: '/students',        label: 'Élèves',           icon: faUsers,         roles: ['super_admin','director','teacher','nurse','secretary'] },
  { path: '/parents',         label: 'Parents',          icon: faUserGroup,     roles: ['super_admin','director'] },
  { path: '/subjects',         label: 'Matières',         icon: faBookOpen,      roles: ['super_admin','director','teacher'] },
  { path: '/grades',          label: 'Notes & Bulletins',icon: faChartLine,     roles: ['super_admin','director','teacher','parent','student'] },
  { path: '/attendance',      label: 'Présences',        icon: faCalendarCheck, roles: ['super_admin','director','teacher','counselor'] },
  { path: '/exams',           label: 'Examens',          icon: faFileSignature, roles: ['super_admin','director','teacher'] },
  { path: '/schedule',        label: 'Emploi du temps',  icon: faCalendarDays,  roles: ['super_admin','director','teacher','student','counselor'] },
  { path: '/staff',           label: 'Personnel',        icon: faIdBadge,       roles: ['super_admin','director','secretary'] },
  { path: '/staff-attendance',label: 'Pointages',        icon: faFingerprint,   roles: ['super_admin','director','teacher','accountant','secretary','counselor','librarian','nurse','maintenance'] },
  { path: '/payroll',         label: 'Paye',             icon: faMoneyBillWave, roles: ['super_admin','director','accountant'] },
  { path: '/finance',         label: 'Finance',          icon: faWallet,        roles: ['super_admin','director','accountant','parent'] },
  { path: '/messages',        label: 'Messagerie',       icon: faEnvelope,      roles: ['super_admin','director','teacher','parent','student','counselor','librarian','nurse','maintenance','secretary'] },
  { path: '/sms',             label: 'Services SMS',     icon: faCommentSms,    roles: ['super_admin','director','secretary'] },
  { path: '/library',         label: 'Bibliothèque',     icon: faBook,          roles: ['super_admin','director','librarian','teacher','secretary'] },
  { path: '/health',          label: 'Infirmerie',       icon: faBriefcaseMedical, roles: ['super_admin','director','nurse'] },
  { path: '/services',        label: 'Cantine & Transport', icon: faBus,       roles: ['super_admin','director','secretary','accountant'] },
  { path: '/academic-years',  label: 'Années scolaires', icon: faGraduationCap, roles: ['super_admin','director'] },
  { path: '/cards',           label: 'Cartes & Badges',  icon: faAddressCard,   roles: ['super_admin','director','secretary'] },
  { path: '/settings',        label: 'Paramètres',       icon: faGear,          roles: ['super_admin','director'] },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { user } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const visible = navItems.filter(n => n.roles.includes(user?.role || ''))

  const drawer = (isMobile = false) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', background: `linear-gradient(180deg, ${ECOLIO_NAVY} 0%, #0d2540 100%)` }}>
      {/* Logo + boutons header */}
      <Box sx={{ p: collapsed && !isMobile ? 1 : 2.5, display: 'flex', alignItems: 'center', justifyContent: collapsed && !isMobile ? 'center' : 'space-between', minHeight: 70, flexShrink: 0 }}>
        {(!collapsed || isMobile) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar src="/ecolio.png" sx={{ width: 36, height: 36, bgcolor: 'white' }} />
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1, fontSize: '1.1rem' }}>Écolio</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.65rem' }}>Gestion Scolaire</Typography>
            </Box>
          </Box>
        )}
        {collapsed && !isMobile && <Avatar src="/ecolio.png" sx={{ width: 32, height: 32, bgcolor: 'white' }} />}

        {/* Bouton collapse (desktop) */}
        {!isMobile && (
          <IconButton onClick={() => setCollapsed(!collapsed)}
            sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <FontAwesomeIcon icon={collapsed ? faBars : faChevronLeft} style={{ fontSize: '0.9rem' }} />
          </IconButton>
        )}

        {/* Bouton fermeture (mobile) */}
        {isMobile && (
          <IconButton
            onClick={onMobileClose}
            size="small"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              bgcolor: 'rgba(255,255,255,0.08)',
              width: 34, height: 34,
              borderRadius: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.18)', color: 'white' },
              '&:active': { transform: 'scale(0.92)' },
              transition: 'background-color 0.15s, transform 0.1s',
            }}
          >
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: '1rem' }} />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

      {/* Navigation — scrollable */}
      <List sx={{ px: 1, py: 1.5, flex: 1, overflowY: 'auto', overflowX: 'hidden',
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: 2 },
        '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.28)' },
      }}>
        {visible.map((item) => {
          const isCollapsed = collapsed && !isMobile
          const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={isCollapsed ? item.label : ''} placement="right">
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  onClick={onMobileClose}
                  sx={{
                    borderRadius: 2,
                    px: isCollapsed ? 1 : 1.5,
                    py: 0.9,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    backgroundColor: active ? 'rgba(46,134,171,0.25)' : 'transparent',
                    borderLeft: active ? `3px solid ${ECOLIO_BLUE}` : '3px solid transparent',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <ListItemIcon sx={{ color: active ? ECOLIO_BLUE : 'rgba(255,255,255,0.6)', minWidth: isCollapsed ? 0 : 36, justifyContent: 'center' }}>
                    <FontAwesomeIcon icon={item.icon} style={{ fontSize: '1rem', width: 16 }} />
                  </ListItemIcon>
                  {!isCollapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.85rem',
                        fontWeight: active ? 600 : 400,
                        color: active ? 'white' : 'rgba(255,255,255,0.7)',
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

      {/* User info */}
      <Box sx={{ p: collapsed && !isMobile ? 1 : 2, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Avatar
          src={user?.avatar_url || ''}
          sx={{ width: 34, height: 34, bgcolor: ECOLIO_BLUE, fontSize: '0.85rem', flexShrink: 0 }}
        >
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </Avatar>
        {(!collapsed || isMobile) && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography sx={{ color: 'white', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
              {user?.role === 'director' ? 'Directeur' : user?.role === 'teacher' ? 'Enseignant' : user?.role === 'accountant' ? 'Comptable' : user?.role === 'secretary' ? 'Secrétaire' : user?.role}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )

  return (
    <Box component="nav" sx={{ width: { sm: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH }, flexShrink: { sm: 0 }, transition: 'width 0.2s' }}>
      {/* Mobile — temporary avec bouton ✕ intégré */}
      <Drawer variant="temporary" open={mobileOpen} onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', overflow: 'hidden' } }}>
        {drawer(true)}
      </Drawer>
      {/* Desktop — permanent */}
      <Drawer variant="permanent"
        sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH, transition: 'width 0.2s', overflow: 'hidden', border: 'none' } }}>
        {drawer(false)}
      </Drawer>
    </Box>
  )
}
