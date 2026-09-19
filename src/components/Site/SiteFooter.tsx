import { Box, Container, Typography, Grid, Divider } from '@mui/material'
import { Link } from 'react-router-dom'
import { ECOLIO_NAVY } from '../../theme'
import { useAuth } from '../../contexts/AuthContext'

export default function SiteFooter() {
  const { user } = useAuth()

  return (
    <Box sx={{ bgcolor: ECOLIO_NAVY, color: 'rgba(255,255,255,0.7)', py: 5 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box component="img" src="/Ecolio1.png" alt="Écolio" sx={{ height: 28, width: 28, objectFit: 'contain' }} />
              <Typography variant="subtitle1" fontWeight={800} color="white">Écolio</Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              La plateforme de gestion scolaire tout-en-un pour les établissements maternels, primaires et secondaires.
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography variant="subtitle2" color="white" fontWeight={700} mb={1.5}>Navigation</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography component="a" href="/#fonctionnalites" variant="body2" sx={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, '&:hover': { opacity: 1 } }}>Fonctionnalités</Typography>
              <Typography component="a" href="/#actualites" variant="body2" sx={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, '&:hover': { opacity: 1 } }}>Actualités</Typography>
              <Typography component="a" href="/#ecoles" variant="body2" sx={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, '&:hover': { opacity: 1 } }}>Écoles partenaires</Typography>
              <Link to="/tableau-honneur" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}>Tableau d'honneur</Typography>
              </Link>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
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
        </Grid>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 3 }} />
        <Typography variant="body2" sx={{ opacity: 0.6, textAlign: { xs: 'center', sm: 'left' } }}>
          © {new Date().getFullYear()} Écolio — Gestion scolaire
        </Typography>
      </Container>
    </Box>
  )
}
