import { useState, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Box, Drawer, SwipeableDrawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, Tooltip, IconButton, TextField, InputAdornment
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faGauge, faUsers, faChartLine, faCalendarCheck, faCalendarDays,
  faIdBadge, faWallet, faEnvelope, faGear, faChevronLeft, faBars,
  faGraduationCap, faAddressCard, faChalkboard, faXmark, faBookOpen, faUserGroup,
  faFileSignature, faFingerprint, faMoneyBillWave, faCommentSms, faHouse,
  faBook, faBriefcaseMedical, faBus, faGlobe, faMagnifyingGlass, faClockRotateLeft, faTrophy, faUsersGear, faNewspaper
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'

const DRAWER_WIDTH = 240
const COLLAPSED_WIDTH = 64

type NavItem = { path: string; label: string; icon: any; roles: string[]; section: string }

const navItems: NavItem[] = [
  { path: '/accueil',        label: 'Accueil',          icon: faHouse,         section: 'Général',            roles: ['super_admin','director','teacher','parent','student','accountant','counselor','librarian','nurse','maintenance','secretary'] },
  { path: '/',                label: 'Tableau de bord',  icon: faGauge,         section: 'Général',            roles: ['super_admin','director','teacher','parent','accountant','secretary'] },
  { path: '/admin',          label: 'Plateforme',       icon: faGlobe,         section: 'Général',            roles: ['super_admin'] },
  { path: '/admin/users',    label: 'Utilisateurs',     icon: faUsersGear,     section: 'Général',            roles: ['super_admin'] },

  { path: '/classes',         label: 'Classes',          icon: faChalkboard,    section: 'Pédagogie',          roles: ['super_admin','director','teacher','counselor','secretary'] },
  { path: '/students',        label: 'Élèves',           icon: faUsers,         section: 'Pédagogie',          roles: ['super_admin','director','teacher','nurse','secretary'] },
  { path: '/parents',         label: 'Parents',          icon: faUserGroup,     section: 'Pédagogie',          roles: ['super_admin','director'] },
  { path: '/subjects',         label: 'Matières',         icon: faBookOpen,      section: 'Pédagogie',          roles: ['super_admin','director','teacher'] },
  { path: '/grades',          label: 'Notes & Bulletins',icon: faChartLine,     section: 'Pédagogie',          roles: ['super_admin','director','teacher','parent','student'] },
  { path: '/attendance',      label: 'Présences',        icon: faCalendarCheck, section: 'Pédagogie',          roles: ['super_admin','director','teacher','counselor'] },
  { path: '/exams',           label: 'Examens',          icon: faFileSignature, section: 'Pédagogie',          roles: ['super_admin','director','teacher'] },
  { path: '/schedule',        label: 'Emploi du temps',  icon: faCalendarDays,  section: 'Pédagogie',          roles: ['super_admin','director','teacher','student','counselor'] },

  { path: '/staff',           label: 'Personnel',        icon: faIdBadge,       section: 'Personnel & RH',     roles: ['super_admin','director','secretary'] },
  { path: '/staff-attendance',label: 'Pointages',        icon: faFingerprint,   section: 'Personnel & RH',     roles: ['super_admin','director','teacher','accountant','secretary','counselor','librarian','nurse','maintenance'] },
  { path: '/payroll',         label: 'Paye',             icon: faMoneyBillWave, section: 'Personnel & RH',     roles: ['super_admin','director','accountant'] },

  { path: '/finance',         label: 'Finance',          icon: faWallet,        section: 'Finance & Services', roles: ['super_admin','director','accountant','parent'] },
  { path: '/services',        label: 'Cantine & Transport', icon: faBus,       section: 'Finance & Services', roles: ['super_admin','director','secretary','accountant'] },

  { path: '/messages',        label: 'Messagerie',       icon: faEnvelope,      section: 'Communication',      roles: ['super_admin','director','teacher','parent','student','counselor','librarian','nurse','maintenance','secretary'] },
  { path: '/sms',             label: 'Services SMS',     icon: faCommentSms,    section: 'Communication',      roles: ['super_admin','director','secretary'] },
  { path: '/publications',    label: 'Publications',     icon: faNewspaper,     section: 'Communication',      roles: ['super_admin','director'] },

  { path: '/library',         label: 'Bibliothèque',     icon: faBook,          section: 'Ressources',         roles: ['super_admin','director','librarian','teacher','secretary'] },
  { path: '/health',          label: 'Infirmerie',       icon: faBriefcaseMedical, section: 'Ressources',      roles: ['super_admin','director','nurse'] },

  { path: '/academic-years',  label: 'Années scolaires', icon: faGraduationCap, section: 'Administration',     roles: ['super_admin','director'] },
  { path: '/top-students',    label: "Tableau d'honneur",icon: faTrophy,        section: 'Administration',     roles: ['super_admin','director'] },
  { path: '/cards',           label: 'Cartes & Badges',  icon: faAddressCard,   section: 'Administration',     roles: ['super_admin','director','secretary'] },
  { path: '/activity-log',    label: "Journal d'activité",icon: faClockRotateLeft, section: 'Administration',  roles: ['super_admin','director'] },
  { path: '/settings',        label: 'Paramètres',       icon: faGear,          section: 'Administration',     roles: ['super_admin','director'] },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { user } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')

  const visible = navItems.filter(n => n.roles.includes(user?.role || ''))

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const items = q ? visible.filter(n => n.label.toLowerCase().includes(q)) : visible
    const map = new Map<string, NavItem[]>()
    for (const item of items) {
      if (!map.has(item.section)) map.set(item.section, [])
      map.get(item.section)!.push(item)
    }
    return Array.from(map.entries())
  }, [visible, search])

  // Le chemin actif le plus spécifique (le plus long) gagne, pour qu'une route imbriquée
  // (ex. /admin/users) ne mette pas AUSSI en surbrillance son parent (/admin).
  const activePath = useMemo(() => {
    const matches = visible.filter(n =>
      n.path === '/' ? location.pathname === '/' : (location.pathname === n.path || location.pathname.startsWith(`${n.path}/`))
    )
    return matches.sort((a, b) => b.path.length - a.path.length)[0]?.path
  }, [visible, location.pathname])

  const renderItem = (item: NavItem, isCollapsed: boolean) => {
    const active = item.path === activePath
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
              transition: 'background-color 0.15s',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
              '&:active': { backgroundColor: 'rgba(255,255,255,0.16)' },
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
  }

  const drawer = (isMobile = false) => {
    const isCollapsed = collapsed && !isMobile
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', background: `linear-gradient(180deg, ${ECOLIO_NAVY} 0%, #0d2540 100%)` }}>
        {/* Logo + boutons header */}
        <Box sx={{ p: isCollapsed ? 1 : 2.5, display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', minHeight: 70, flexShrink: 0 }}>
          {!isCollapsed && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar src="/Ecolio1.png" sx={{ width: 36, height: 36, bgcolor: 'white' }} />
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1, fontSize: '1.1rem' }}>Écolio</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.65rem' }}>Gestion Scolaire</Typography>
              </Box>
            </Box>
          )}
          {isCollapsed && <Avatar src="/Ecolio1.png" sx={{ width: 32, height: 32, bgcolor: 'white' }} />}

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

        {/* Recherche rapide (masquée quand replié) */}
        {!isCollapsed && (
          <Box sx={{ px: 1.5, pt: 1.5, flexShrink: 0 }}>
            <TextField
              fullWidth size="small" placeholder="Rechercher…" value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }} />
                  </InputAdornment>
                ),
                sx: {
                  color: 'white', fontSize: '0.82rem', bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2,
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: ECOLIO_BLUE },
                },
              }}
            />
          </Box>
        )}

        {/* Navigation — scrollable, groupée par section */}
        <List sx={{ px: 1, py: 1.5, flex: 1, overflowY: 'auto', overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: 8 },
          '&::-webkit-scrollbar-track': { background: 'rgba(255,255,255,0.06)', borderRadius: 4 },
          '&::-webkit-scrollbar-thumb': { background: ECOLIO_BLUE, borderRadius: 4 },
          '&::-webkit-scrollbar-thumb:hover': { background: '#5ba3c3' },
          scrollbarWidth: 'thin',
          scrollbarColor: `${ECOLIO_BLUE} rgba(255,255,255,0.06)`,
        }}>
          {grouped.length === 0 && (
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textAlign: 'center', mt: 2 }}>
              Aucun résultat
            </Typography>
          )}
          {grouped.map(([section, items]) => (
            <Box key={section} sx={{ mb: 0.5 }}>
              {!isCollapsed && (
                <Typography sx={{
                  color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em', px: 1.5, pt: 1.5, pb: 0.5,
                }}>
                  {section}
                </Typography>
              )}
              {items.map(item => renderItem(item, isCollapsed))}
            </Box>
          ))}
        </List>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

        {/* User info */}
        <Box sx={{ p: isCollapsed ? 1 : 2, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <Avatar
            src={user?.avatar_url || ''}
            sx={{ width: 34, height: 34, bgcolor: ECOLIO_BLUE, fontSize: '0.85rem', flexShrink: 0 }}
          >
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
          {!isCollapsed && (
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
  }

  return (
    <Box component="nav" sx={{ width: { sm: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH }, flexShrink: { sm: 0 }, transition: 'width 0.2s' }}>
      {/* Mobile — swipeable, fermé par swipe ou tap sur le fond */}
      <SwipeableDrawer
        variant="temporary" anchor="left"
        open={mobileOpen} onOpen={() => {}} onClose={onMobileClose}
        disableSwipeToOpen
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: '82%', maxWidth: DRAWER_WIDTH, border: 'none', overflow: 'hidden', borderRadius: '0 16px 16px 0' },
          '& .MuiBackdrop-root': { backgroundColor: 'rgba(13,37,64,0.5)' },
        }}
      >
        {drawer(true)}
      </SwipeableDrawer>
      {/* Desktop — permanent */}
      <Drawer variant="permanent"
        sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH, transition: 'width 0.2s', overflow: 'hidden', border: 'none' } }}>
        {drawer(false)}
      </Drawer>
    </Box>
  )
}
