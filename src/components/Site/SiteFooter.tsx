import { Box, Container, Typography, Grid, Divider } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import { ECOLIO_NAVY } from '../../theme'
import { useAuth } from '../../contexts/AuthContext'

const CONTACT_EMAIL = 'oliviernbia@gmail.com'
const CONTACT_PHONE = '0554183378'

export default function SiteFooter() {
  const { user } = useAuth()
  // Voir le commentaire équivalent dans SiteHeader.tsx : "/" ouvre l'espace de gestion
  // pour un utilisateur connecté, la page d'accueil publique est alors sur "/accueil".
  const homePath = user ? '/accueil' : '/'

  return (
    <Box sx={{ bgcolor: ECOLIO_NAVY, color: 'rgba(255,255,255,0.7)', py: 5 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box component="img" src="/Ecolio1.png" alt="Écolio" sx={{ height: 28, width: 28, objectFit: 'contain' }} />
              <Typography variant="subtitle1" fontWeight={800} color="white">Écolio</Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              La plateforme de gestion scolaire tout-en-un pour les établissements maternels, primaires et secondaires.
            </Typography>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Typography variant="subtitle2" color="white" fontWeight={700} mb={1.5}>Navigation</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography component="a" href={`${homePath}#fonctionnalites`} variant="body2" sx={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, '&:hover': { opacity: 1 } }}>Fonctionnalités</Typography>
              <Typography component="a" href={`${homePath}#actualites`} variant="body2" sx={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, '&:hover': { opacity: 1 } }}>Actualités</Typography>
              <Typography component="a" href={`${homePath}#ecoles`} variant="body2" sx={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, '&:hover': { opacity: 1 } }}>Écoles partenaires</Typography>
              <Link to="/tableau-honneur" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}>Tableau d'honneur</Typography>
              </Link>
            </Box>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Typography variant="subtitle2" color="white" fontWeight={700} mb={1.5}>Accès</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {user ? (
                <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <Typography variant="body2" sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}>Retour au tableau de bord</Typography>
                </Link>
              ) : (
                <>
                  <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <Typography variant="body2" sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}>Se connecter</Typography>
                  </Link>
                  <Link to="/register" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <Typography variant="body2" sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}>Inscrire votre école</Typography>
                  </Link>
                </>
              )}
            </Box>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Typography variant="subtitle2" color="white" fontWeight={700} mb={1.5}>Contact</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Typography component="a" href={`mailto:${CONTACT_EMAIL}`} variant="body2"
                sx={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, '&:hover': { opacity: 1 }, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '0.8rem', flexShrink: 0 }} />
                <Box component="span" sx={{ wordBreak: 'break-all' }}>{CONTACT_EMAIL}</Box>
              </Typography>
              <Typography component="a" href={`tel:+225${CONTACT_PHONE}`} variant="body2"
                sx={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, '&:hover': { opacity: 1 }, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FontAwesomeIcon icon={faPhone} style={{ fontSize: '0.8rem', flexShrink: 0 }} />
                {CONTACT_PHONE}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 3 }} />
        <Typography variant="body2" sx={{ opacity: 0.6, textAlign: { xs: 'center', sm: 'left' } }}>
          © {new Date().getFullYear()} Écolio — Gestion scolaire
        </Typography>
      </Container>
    </Box>
  )
}
