import { useState } from 'react'
import {
  Box, Container, Typography, Button, IconButton, Drawer, Divider, List, ListItemButton
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faGauge, faBars, faXmark, faTrophy, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useAuth } from '../../contexts/AuthContext'

const ANCHOR_LINKS = [
  { id: 'fonctionnalites', label: 'Fonctionnalités' },
  { id: 'actualites', label: 'Actualités' },
  { id: 'ecoles', label: 'Écoles partenaires' },
]

const NAV_LINK_SX = {
  color: 'text.secondary', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
  cursor: 'pointer', '&:hover': { color: ECOLIO_BLUE },
}

// En-tête public partagé entre la page d'accueil et les autres pages publiques
// (ex. tableau d'honneur) — mêmes liens, mêmes boutons, même style, pour que ces
// pages se sentent comme faisant partie du même site plutôt que des pages isolées.
export default function SiteHeader() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    setMobileOpen(false)
    logout()
    navigate('/')
  }
  // Pour un visiteur, "/" affiche la page d'accueil publique. Pour un utilisateur
  // connecté, "/" affiche l'espace de gestion (tableau de bord) — la page d'accueil
  // se trouve alors sur "/accueil". Les liens d'ancrage doivent pointer vers la bonne
  // route selon l'état de connexion, sinon ils ouvrent l'espace de gestion par erreur.
  const homePath = user ? '/accueil' : '/'

  const authAction = user ? (
    <>
      <Button component={Link} to="/" variant="contained" size="small" fullWidth
        startIcon={<FontAwesomeIcon icon={faGauge} style={{ fontSize: '0.7rem' }} />}
        sx={{
          borderRadius: 999, px: { xs: 1, sm: 1.25 }, py: 0.5, fontWeight: 700,
          fontSize: { xs: '0.7rem', sm: '0.78rem' }, whiteSpace: 'nowrap',
          boxShadow: '0 4px 14px rgba(26,60,94,0.25)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          '& .MuiButton-startIcon': { transition: 'transform 0.15s' },
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 6px 18px rgba(26,60,94,0.32)' },
          '&:hover .MuiButton-startIcon': { transform: 'translateX(-2px)' },
        }}>
        Tableau de bord
      </Button>
      <Button onClick={handleLogout} variant="outlined" size="small" fullWidth
        startIcon={<FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: '0.7rem' }} />}
        sx={{
          borderRadius: 999, px: { xs: 1.25, sm: 1.5 }, py: 0.5,
          fontSize: { xs: '0.7rem', sm: '0.78rem' }, whiteSpace: 'nowrap',
          color: 'text.secondary', borderColor: '#dde2ea', bgcolor: 'transparent',
          transition: 'color 0.15s, border-color 0.15s, background-color 0.15s',
          '& .MuiButton-startIcon': { transition: 'transform 0.15s' },
          '&:hover': { color: 'error.main', borderColor: 'error.main', bgcolor: 'rgba(231,76,60,0.06)' },
          '&:hover .MuiButton-startIcon': { transform: 'translateX(2px)' },
        }}>
        Déconnexion
      </Button>
    </>
  ) : (
    <>
      <Button component={Link} to="/login" variant="outlined" size="small" fullWidth sx={{
        borderRadius: 999, px: { xs: 1.25, sm: 1.5 }, py: 0.5, fontSize: { xs: '0.7rem', sm: '0.78rem' },
      }}>
        Se connecter
      </Button>
      <Button component={Link} to="/register" variant="outlined" size="small" fullWidth sx={{
        borderRadius: 999, fontWeight: 700, px: { xs: 1.25, sm: 1.75 }, py: 0.5,
        fontSize: { xs: '0.7rem', sm: '0.78rem' }, whiteSpace: 'nowrap',
        bgcolor: 'white', color: ECOLIO_NAVY, borderColor: ECOLIO_NAVY, borderWidth: 1.5,
        boxShadow: '0 2px 10px rgba(26,60,94,0.12)',
        '&:hover': { bgcolor: '#f0f4ff', borderColor: ECOLIO_NAVY, borderWidth: 1.5 },
      }}>
        Inscrire votre école
      </Button>
    </>
  )

  return (
    <Box sx={{ borderBottom: '1px solid #eef0f4', bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, gap: 1 }}>
          <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flexShrink: 0, textDecoration: 'none' }}>
            <Box sx={{
              width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 }, borderRadius: '50%', bgcolor: 'white',
              border: `2px solid ${ECOLIO_BLUE}20`, boxShadow: '0 2px 10px rgba(46,134,171,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
            }}>
              <Box component="img" src="/Ecolio1.png" alt="Écolio" sx={{ height: { xs: 22, sm: 28 }, width: { xs: 22, sm: 28 }, objectFit: 'contain' }} />
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: ECOLIO_NAVY, letterSpacing: -0.5, display: { xs: 'none', sm: 'block' } }}>Écolio</Typography>
          </Box>

          {/* Liens — visibles à partir de md, remplacés par le menu mobile en dessous */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3.5 }}>
            {ANCHOR_LINKS.map(l => (
              <Typography key={l.id} component="a" href={`${homePath}#${l.id}`} sx={NAV_LINK_SX}>
                {l.label}
              </Typography>
            ))}
            <Typography component={Link} to="/tableau-honneur" sx={{
              ...NAV_LINK_SX,
              color: location.pathname === '/tableau-honneur' ? ECOLIO_BLUE : NAV_LINK_SX.color,
            }}>
              Tableau d'honneur
            </Typography>
          </Box>

          <Box sx={{
            display: { xs: 'none', md: 'flex' }, gap: 1, flexShrink: 0,
            // fullWidth (nécessaire pour l'empilement du menu mobile ci-dessous) devient
            // un flex-basis de 100% pour CHAQUE bouton dans cette rangée horizontale —
            // sans ce reset, les deux boutons se disputent 100% de la largeur et
            // débordent hors de l'écran. Ici on revient à une largeur basée sur le contenu.
            '& > .MuiButtonBase-root': { width: 'auto', flexShrink: 0 },
          }}>
            {authAction}
          </Box>

          {/* Menu mobile */}
          <IconButton onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu" sx={{ display: { xs: 'flex', md: 'none' }, color: ECOLIO_NAVY }}>
            <FontAwesomeIcon icon={faBars} style={{ fontSize: '1.1rem' }} />
          </IconButton>
        </Box>
      </Container>

      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 280 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ color: ECOLIO_NAVY }}>Écolio</Typography>
          <IconButton onClick={() => setMobileOpen(false)} size="small">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: '1rem' }} />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ py: 1 }}>
          {ANCHOR_LINKS.map(l => (
            <ListItemButton key={l.id} component="a" href={`${homePath}#${l.id}`} onClick={() => setMobileOpen(false)}>
              <Typography sx={{ fontWeight: 500 }}>{l.label}</Typography>
            </ListItemButton>
          ))}
          <ListItemButton component={Link} to="/tableau-honneur" onClick={() => setMobileOpen(false)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FontAwesomeIcon icon={faTrophy} style={{ fontSize: '0.85rem', color: '#d97706' }} />
            <Typography sx={{ fontWeight: 500 }}>Tableau d'honneur</Typography>
          </ListItemButton>
        </List>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {authAction}
        </Box>
      </Drawer>
    </Box>
  )
}
