import { useState } from 'react'
import {
  Box, Card, TextField, Button, Typography, InputAdornment,
  IconButton, Alert, CircularProgress, Grid, Stepper, Step, StepLabel
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faEye, faEyeSlash, faLock, faEnvelope, faUser, faSchool, faPhone, faArrowLeft, faArrowRight, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'

const STEPS = ['Votre école', 'Votre compte', 'Confirmation']

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const [school, setSchool] = useState({ name: '', address: '', phone: '', email: '' })
  const [account, setAccount] = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '' })

  const setS = (k: string, v: string) => setSchool(s => ({ ...s, [k]: v }))
  const setA = (k: string, v: string) => setAccount(a => ({ ...a, [k]: v }))

  const validateStep0 = () => {
    if (!school.name.trim()) { setError("Le nom de l'école est requis"); return false }
    setError(''); return true
  }
  const validateStep1 = () => {
    if (!account.first_name || !account.last_name) { setError('Prénom et nom requis'); return false }
    if (!account.email.includes('@')) { setError('Email invalide'); return false }
    if (account.password.length < 8) { setError('Mot de passe trop court (min. 8 caractères)'); return false }
    if (account.password !== account.confirm) { setError('Les mots de passe ne correspondent pas'); return false }
    setError(''); return true
  }

  const next = () => {
    if (step === 0 && !validateStep0()) return
    if (step === 1 && !validateStep1()) return
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!validateStep1()) return
    setLoading(true); setError('')
    try {
      await api.post('/auth/register', {
        school: { name: school.name, address: school.address, phone: school.phone, email: school.email || account.email },
        admin: { first_name: account.first_name, last_name: account.last_name, email: account.email, password: account.password }
      })
      setDone(true)
    } catch (e: any) {
      setError(e.response?.data?.message || "Erreur lors de l'inscription")
      setStep(1)
    } finally { setLoading(false) }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      background: `linear-gradient(135deg, ${ECOLIO_NAVY} 0%, ${ECOLIO_BLUE} 100%)`,
      position: 'relative', overflow: 'hidden',
      alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 }
    }}>
      <Box sx={{ position: 'absolute', top: -120, right: -120, width: 420, height: 420, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

      <Card sx={{ width: '100%', maxWidth: 500, p: { xs: 3, sm: 4 }, borderRadius: 3, boxShadow: '0 25px 60px rgba(0,0,0,0.2)', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
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

        {done ? (
          /* Success screen */
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: '2rem', color: '#16a34a' }} />
            </Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>Inscription réussie !</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Votre école a bien été créée. Vous pouvez maintenant vous connecter avec vos identifiants.
            </Typography>
            <Button variant="contained" fullWidth size="large" onClick={() => navigate('/login')}
              sx={{ py: 1.4 }}>
              Se connecter
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="h6" fontWeight={700} gutterBottom>Inscription</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Créez votre espace de gestion scolaire gratuitement
            </Typography>

            <Stepper activeStep={step} sx={{ mb: 3 }} alternativeLabel>
              {STEPS.map(label => (
                <Step key={label}>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.75rem' } }}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            {/* Step 0 — School info */}
            {step === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Nom de l'école *" value={school.name} onChange={e => setS('name', e.target.value)}
                    autoFocus
                    InputProps={{ startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faSchool} style={{ fontSize: '0.9rem', color: '#9ca3af' }} /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Adresse" value={school.address} onChange={e => setS('address', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Téléphone" value={school.phone} onChange={e => setS('phone', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faPhone} style={{ fontSize: '0.9rem', color: '#9ca3af' }} /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email école" value={school.email} onChange={e => setS('email', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '0.9rem', color: '#9ca3af' }} /></InputAdornment> }} />
                </Grid>
              </Grid>
            )}

            {/* Step 1 — Admin account */}
            {step === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Prénom *" value={account.first_name} onChange={e => setA('first_name', e.target.value)}
                    autoFocus
                    InputProps={{ startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faUser} style={{ fontSize: '0.9rem', color: '#9ca3af' }} /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Nom *" value={account.last_name} onChange={e => setA('last_name', e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Email *" type="email" value={account.email} onChange={e => setA('email', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '0.9rem', color: '#9ca3af' }} /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Mot de passe *" type={showPwd ? 'text' : 'password'} value={account.password} onChange={e => setA('password', e.target.value)}
                    helperText="Minimum 8 caractères"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faLock} style={{ fontSize: '0.9rem', color: '#9ca3af' }} /></InputAdornment>,
                      endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPwd(p => !p)}><FontAwesomeIcon icon={showPwd ? faEyeSlash : faEye} style={{ fontSize: '0.9rem' }} /></IconButton></InputAdornment>
                    }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Confirmer le mot de passe *" type="password" value={account.confirm} onChange={e => setA('confirm', e.target.value)}
                    error={!!account.confirm && account.confirm !== account.password}
                    helperText={account.confirm && account.confirm !== account.password ? 'Ne correspond pas' : ''}
                    InputProps={{ startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faLock} style={{ fontSize: '0.9rem', color: '#9ca3af' }} /></InputAdornment> }} />
                </Grid>
              </Grid>
            )}

            {/* Step 2 — Summary */}
            {step === 2 && (
              <Box sx={{ bgcolor: '#f8f9fc', borderRadius: 2, p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Récapitulatif</Typography>
                {[
                  { label: 'École', value: school.name },
                  { label: 'Adresse', value: school.address || '—' },
                  { label: 'Administrateur', value: `${account.first_name} ${account.last_name}` },
                  { label: 'Email connexion', value: account.email },
                ].map(r => (
                  <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">{r.label}</Typography>
                    <Typography variant="caption" fontWeight={500}>{r.value}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Navigation buttons */}
            <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
              {step > 0 && (
                <Button variant="outlined" onClick={() => setStep(s => s - 1)} disabled={loading}
                  startIcon={<FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '0.8rem' }} />}
                  sx={{ flex: 1 }}>
                  Retour
                </Button>
              )}
              {step < 2 ? (
                <Button variant="contained" onClick={next} fullWidth={step === 0}
                  endIcon={<FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '0.8rem' }} />}
                  sx={{ flex: 1, py: 1.3 }}>
                  Suivant
                </Button>
              ) : (
                <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ flex: 1, py: 1.3 }}>
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Créer mon compte'}
                </Button>
              )}
            </Box>

            <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Déjà un compte ?{' '}
                <Link to="/login" style={{ color: ECOLIO_BLUE, fontWeight: 600, textDecoration: 'none' }}>
                  Se connecter
                </Link>
              </Typography>
            </Box>
          </>
        )}
      </Card>
    </Box>
  )
}
