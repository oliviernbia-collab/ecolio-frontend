import { Box, Container, Typography, Button } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faGauge } from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useAuth } from '../../contexts/AuthContext'

const NAV_LINKS = [
  { id: 'fonctionnalites', label: 'Fonctionnalités' },
  { id: 'actualites', label: 'Actualités' },
  { id: 'ecoles', label: 'Écoles partenaires' },
]

// En-tête public partagé entre la page d'accueil et les autres pages publiques
// (ex. tableau d'honneur) — mêmes liens, mêmes boutons, même style, pour que ces
// pages se sentent comme faisant partie du même site plutôt que des pages isolées.
export default function SiteHeader() {
  const { user } = useAuth()

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

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3.5 }}>
            {NAV_LINKS.map(l => (
              <Typography key={l.id} component="a" href={`/#${l.id}`}
                sx={{ color: 'text.secondary', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', '&:hover': { color: ECOLIO_BLUE } }}>
                {l.label}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1.5 }, flexShrink: 0 }}>
            {user ? (
              <Button component={Link} to="/" variant="contained"
                startIcon={<FontAwesomeIcon icon={faGauge} style={{ fontSize: '0.8rem' }} />}
                sx={{
                  borderRadius: 999, px: { xs: 1.5, sm: 2.5 }, fontWeight: 700,
                  fontSize: { xs: '0.78rem', sm: '0.875rem' },
                  boxShadow: '0 4px 14px rgba(26,60,94,0.25)',
                  '&:hover': { boxShadow: '0 6px 18px rgba(26,60,94,0.32)' },
                }}>
                Retour au tableau de bord
              </Button>
            ) : (
              <>
                <Button component={Link} to="/login" variant="outlined" sx={{
                  borderRadius: 999, px: { xs: 1.5, sm: 2 }, fontSize: { xs: '0.78rem', sm: '0.875rem' },
                }}>
                  Se connecter
                </Button>
                <Button component={Link} to="/register" variant="outlined" sx={{
                  borderRadius: 999, fontWeight: 700, px: { xs: 1.5, sm: 2.5 }, fontSize: { xs: '0.78rem', sm: '0.875rem' },
                  bgcolor: 'white', color: ECOLIO_NAVY, borderColor: ECOLIO_NAVY, borderWidth: 1.5,
                  boxShadow: '0 2px 10px rgba(26,60,94,0.12)',
                  '&:hover': { bgcolor: '#f0f4ff', borderColor: ECOLIO_NAVY, borderWidth: 1.5 },
                }}>
                  Inscrire votre école
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
