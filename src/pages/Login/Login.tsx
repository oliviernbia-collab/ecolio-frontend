import { useState } from 'react'
import {
  Box, TextField, Button, Typography, InputAdornment,
  Alert, CircularProgress, Divider, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faLock, faEnvelope, faPlay, faPhone, faCopy, faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import PasswordField from '../../components/ui/PasswordField'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import api from '../../lib/axios'

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
  const { login, verifyTwoFactor } = useAuth()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState('')
  const [code, setCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotPhone, setForgotPhone] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [tempPassword, setTempPassword] = useState('')

  const openForgot = () => {
    setForgotEmail(email); setForgotPhone(''); setForgotError(''); setTempPassword('')
    setForgotOpen(true)
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !forgotPhone) { setForgotError('Veuillez remplir tous les champs'); return }
    setForgotLoading(true); setForgotError('')
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail, phone: forgotPhone })
      setTempPassword(res.data.temp_password)
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Impossible de réinitialiser le mot de passe')
    } finally {
      setForgotLoading(false)
    }
  }

  const applyTempPassword = () => {
    setEmail(forgotEmail); setPassword(tempPassword); setError('')
    setForgotOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return }
    setLoading(true); setError('')
    try {
      const { challengeToken } = await login(email, password)
      if (challengeToken) { setChallenge(challengeToken); setCode(''); return }
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  // ── Deuxième étape : code de l'application d'authentification ou code de secours ──
  const handleTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) { setError('Saisissez le code'); return }
    setLoading(true); setError('')
    try {
      await verifyTwoFactor(challenge, code)
      navigate('/')
    } catch (err: any) {
      const status = err.response?.status
      setError(err.response?.data?.message || 'Code incorrect')
      // Jeton d'étape expiré (5 min) : retour au mot de passe
      if (status === 401 && /reconnectez/i.test(err.response?.data?.message || '')) { setChallenge(''); setPassword('') }
    } finally {
      setLoading(false)
    }
  }

  const cancelTwoFactor = () => { setChallenge(''); setCode(''); setPassword(''); setError(''); setUseRecovery(false) }

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

        {challenge ? (
          <form onSubmit={handleTwoFactor}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, p: 2, borderRadius: 2, bgcolor: '#eff6ff' }}>
              <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: '1.4rem', color: ECOLIO_BLUE }} />
              <Typography variant="body2">
                {useRecovery
                  ? 'Saisissez un de vos codes de secours (format XXXXX-XXXXX). Chaque code ne sert qu\'une fois.'
                  : "Double authentification : saisissez le code à 6 chiffres affiché dans votre application d'authentification."}
              </Typography>
            </Box>
            <TextField fullWidth autoFocus value={code} onChange={e => setCode(e.target.value)}
              placeholder={useRecovery ? 'XXXXX-XXXXX' : '123 456'}
              inputProps={useRecovery
                ? { autoComplete: 'off', style: { letterSpacing: 2, textTransform: 'uppercase' } }
                : { inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 7, style: { letterSpacing: 6, fontSize: '1.3rem', textAlign: 'center' } }}
              sx={{ ...fieldSx, mb: 3 }} />
            <Button type="submit" fullWidth disabled={loading} sx={{
              py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: '10px', color: '#fff', textTransform: 'none',
              background: `linear-gradient(135deg, ${ECOLIO_NAVY} 0%, ${ECOLIO_BLUE} 100%)`, boxShadow: 'none',
              '&:hover': { background: 'linear-gradient(135deg, #0f2236 0%, #1e6b8a 100%)', boxShadow: 'none' },
            }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Vérifier'}
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 1, flexWrap: 'wrap' }}>
              <Button size="small" onClick={cancelTwoFactor} sx={{ textTransform: 'none' }}>← Retour</Button>
              <Button size="small" onClick={() => { setUseRecovery(!useRecovery); setCode(''); setError('') }} sx={{ textTransform: 'none' }}>
                {useRecovery ? "Utiliser le code de l'application" : 'Utiliser un code de secours'}
              </Button>
            </Box>
          </form>
        ) : (
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
        )}

        <Typography variant="body2" component="button" type="button" onClick={openForgot}
          sx={{ display: 'block', mx: 'auto', mt: 2, color: ECOLIO_BLUE, fontWeight: 600, background: 'none', border: 0, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
          Mot de passe oublié ?
        </Typography>

        <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={800}>Mot de passe oublié</DialogTitle>
          {tempPassword ? (
            <>
              <DialogContent>
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Votre mot de passe a été réinitialisé.</Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Votre nouveau mot de passe temporaire :</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2, bgcolor: '#f3f4f6', fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, letterSpacing: 1 }}>
                  <Box component="span" sx={{ flex: 1 }}>{tempPassword}</Box>
                  <Button size="small" onClick={() => navigator.clipboard?.writeText(tempPassword)} sx={{ minWidth: 0 }} title="Copier">
                    <FontAwesomeIcon icon={faCopy} />
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Notez-le bien : il ne sera plus affiché. Utilisez-le avec votre email pour vous connecter, puis changez-le depuis votre profil (Paramètres).
                </Typography>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button variant="contained" onClick={applyTempPassword} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                  Utiliser pour me connecter
                </Button>
              </DialogActions>
            </>
          ) : (
            <form onSubmit={handleForgot}>
              <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Saisissez votre email et le numéro de téléphone enregistré sur votre compte pour obtenir un nouveau mot de passe.
                </Typography>
                {forgotError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{forgotError}</Alert>}
                <TextField fullWidth placeholder="votre@email.com" type="email" value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)} sx={{ ...fieldSx, mb: 2 }} autoComplete="email"
                  InputProps={{ startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '0.95rem', color: '#9ca3af' }} /></InputAdornment> }} />
                <TextField fullWidth placeholder="Téléphone (ex. 0700000000)" type="tel" value={forgotPhone}
                  onChange={e => setForgotPhone(e.target.value)} sx={fieldSx} autoComplete="tel"
                  InputProps={{ startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faPhone} style={{ fontSize: '0.95rem', color: '#9ca3af' }} /></InputAdornment> }} />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setForgotOpen(false)} sx={{ textTransform: 'none' }}>Annuler</Button>
                <Button type="submit" variant="contained" disabled={forgotLoading} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                  {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'Générer un mot de passe'}
                </Button>
              </DialogActions>
            </form>
          )}
        </Dialog>

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
