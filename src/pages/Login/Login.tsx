import { useState } from 'react'
import {
  Box, TextField, Button, Typography, InputAdornment,
  Alert, CircularProgress, Divider
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faLock, faEnvelope, faPlay } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import PasswordField from '../../components/ui/PasswordField'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: '#f9fafb',
    '& fieldset': { borderColor: '#e5e7eb' },
    '&:hover fieldset': { borderColor: '#d1d5db' },
    '&.Mui-focused fieldset': { borderColor: ECOLIO_BLUE },
  },
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return }
    setLoading(true); setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#fff' }}>
      {/* Left — form */}
      <Box sx={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        px: { xs: 3, sm: 8, md: 10 }, py: 6, maxWidth: { md: 560 },
      }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: '#111827', mb: 0.5 }}>
          Bon retour parmi nous
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Connectez-vous pour accéder à votre espace
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Email</Typography>
          <TextField fullWidth placeholder="votre@email.com" type="email" value={email}
            onChange={e => setEmail(e.target.value)} sx={{ ...fieldSx, mb: 3 }} autoComplete="email" autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '0.95rem', color: '#9ca3af' }} />
                </InputAdornment>
              )
            }} />

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Mot de passe</Typography>
          <PasswordField fullWidth placeholder="••••••••" value={password}
            onChange={e => setPassword(e.target.value)} sx={{ ...fieldSx, mb: 3 }} autoComplete="current-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={faLock} style={{ fontSize: '0.95rem', color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }} />

          <Button type="submit" fullWidth disabled={loading} sx={{
            py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: '10px', color: '#fff', textTransform: 'none',
            background: `linear-gradient(135deg, ${ECOLIO_NAVY} 0%, ${ECOLIO_BLUE} 100%)`,
            boxShadow: 'none',
            '&:hover': { background: 'linear-gradient(135deg, #0f2236 0%, #1e6b8a 100%)', boxShadow: 'none' },
          }}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Se connecter'}
          </Button>
        </form>

        <Typography variant="body2" title="Fonctionnalité à venir — contactez votre administrateur"
          sx={{ textAlign: 'center', mt: 2, color: ECOLIO_BLUE, fontWeight: 600 }}>
          Mot de passe oublié ?
        </Typography>

        <Divider sx={{ my: 3, color: 'text.secondary', fontSize: '0.8rem' }}>ou</Divider>

        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: ECOLIO_BLUE, fontWeight: 700, textDecoration: 'none' }}>
            Inscrivez-vous
          </Link>
        </Typography>
      </Box>

      {/* Right — branding panel */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' }, flex: 1, position: 'relative', overflow: 'hidden',
        flexDirection: 'column', justifyContent: 'center', p: 8, m: 2, ml: 0,
        borderRadius: '28px',
        background: `linear-gradient(160deg, ${ECOLIO_NAVY} 0%, #0f2236 100%)`,
        color: '#fff',
      }}>
        <Box sx={{ position: 'absolute', top: -100, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ position: 'absolute', bottom: -120, left: -60, width: 360, height: 360, borderRadius: '50%', background: 'rgba(46,134,171,0.18)' }} />

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 1.2, mb: 6 }}>
          <Box component="img" src="/Ecolio1.png" alt="Écolio" sx={{ height: 32, width: 32, objectFit: 'contain' }} />
          <Typography variant="h6" fontWeight={800}>Écolio</Typography>
        </Box>

        <Typography variant="h3" fontWeight={800} sx={{ position: 'relative', zIndex: 1, lineHeight: 1.15, mb: 3, maxWidth: 440 }}>
          Gérez votre école en toute{' '}
          <Box component="span" sx={{ color: '#5EEAD4' }}>simplicité</Box>
        </Typography>

        <Typography variant="body1" sx={{ position: 'relative', zIndex: 1, opacity: 0.75, maxWidth: 400, mb: 4 }}>
          Élèves, notes, présences, finances et communication : tout votre établissement dans une seule application.
        </Typography>

        <Button component={Link} to="/" variant="outlined" sx={{
          position: 'relative', zIndex: 1, alignSelf: 'flex-start', borderRadius: '999px',
          borderColor: 'rgba(255,255,255,0.3)', color: '#fff', textTransform: 'none', fontWeight: 600,
          px: 3, py: 1, '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
        }} startIcon={
          <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesomeIcon icon={faPlay} style={{ fontSize: '0.65rem' }} />
          </Box>
        }>
          Découvrir
        </Button>
      </Box>
    </Box>
  )
}
