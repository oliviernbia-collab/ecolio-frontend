import { useState } from 'react'
import {
  Box, Card, TextField, Button, Typography, InputAdornment,
  IconButton, Alert, CircularProgress
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faEye, faEyeSlash, faLock, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'


export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      background: `linear-gradient(135deg, ${ECOLIO_NAVY} 0%, ${ECOLIO_BLUE} 100%)`,
      position: 'relative', overflow: 'hidden'
    }}>
      <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

      {/* Left panel */}
      <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 6, color: 'white' }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          {/* Logo dans un badge blanc */}
          <Box sx={{
            width: 120, height: 120, borderRadius: '50%',
            bgcolor: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 3
          }}>
            <Box component="img" src="/ecolio.png" alt="Écolio" sx={{ height: 80, width: 80, objectFit: 'contain' }} />
          </Box>
          <Typography variant="h3" fontWeight={800} sx={{ mb: 1, letterSpacing: -1 }}>Écolio</Typography>
          <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 300 }}>Application de Gestion Scolaire</Typography>
        </Box>
        <Box sx={{ mt: 2, textAlign: 'left', maxWidth: 340 }}>
          {[
            'Gestion des élèves & inscriptions',
            'Notes, bulletins & emploi du temps',
            'Communication école-famille',
            'Suivi des présences & finances'
          ].map(f => (
            <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
              <Typography variant="body1" sx={{ opacity: 0.9 }}>{f}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right panel — Login form */}
      <Box sx={{ width: { xs: '100%', md: 480 }, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 } }}>
        <Card sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 }, borderRadius: 3, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
          <Box sx={{ textAlign: 'center', mb: 3.5 }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '50%',
              bgcolor: '#f0f4ff', border: `3px solid ${ECOLIO_BLUE}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 1.5, boxShadow: '0 4px 16px rgba(46,134,171,0.15)'
            }}>
              <Box component="img" src="/ecolio.png" alt="Écolio" sx={{ height: 52, width: 52, objectFit: 'contain' }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: ECOLIO_NAVY, letterSpacing: -0.5 }}>Écolio</Typography>
            <Typography variant="caption" color="text.secondary">Gestion Scolaire</Typography>
          </Box>

          <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>Connexion</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Accédez à votre espace de gestion scolaire
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Adresse e-mail" type="email" value={email} onChange={e => setEmail(e.target.value)}
              sx={{ mb: 2 }} autoComplete="email" autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '0.95rem', color: '#9ca3af' }} />
                  </InputAdornment>
                )
              }} />

            <TextField fullWidth label="Mot de passe" type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} sx={{ mb: 3 }} autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faLock} style={{ fontSize: '0.95rem', color: '#9ca3af' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} style={{ fontSize: '0.95rem' }} />
                    </IconButton>
                  </InputAdornment>
                )
              }} />

            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{ py: 1.4, fontSize: '1rem', mb: 2 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Se connecter'}
            </Button>
          </form>

          <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Pas encore de compte ?{' '}
              <Link to="/register" style={{ color: ECOLIO_BLUE, fontWeight: 600, textDecoration: 'none' }}>
                Inscrire votre école
              </Link>
            </Typography>
          </Box>
        </Card>
      </Box>
    </Box>
  )
}
