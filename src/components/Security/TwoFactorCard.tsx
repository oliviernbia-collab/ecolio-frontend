import { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Button, TextField, Chip, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Stepper, Step, StepLabel
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faShieldHalved, faCopy, faDownload, faKey } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import PasswordField from '../ui/PasswordField'

interface Status { enabled: boolean, recovery_codes_remaining: number }

function RecoveryCodes({ codes }: { codes: string[] }) {
  const { showToast } = useToast()
  const text = `Codes de secours Écolio — chaque code ne sert qu'une fois\n\n${codes.join('\n')}\n`
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'ecolio-codes-de-secours.txt'; a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 2 }}>
        Conservez ces codes en lieu sûr (papier, gestionnaire de mots de passe). Ils permettent de vous connecter
        si vous perdez votre téléphone. <b>Ils ne seront plus jamais affichés.</b>
      </Alert>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, fontFamily: 'monospace', fontSize: '1rem', fontWeight: 600 }}>
        {codes.map(c => <Box key={c} sx={{ textAlign: 'center' }}>{c}</Box>)}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
        <Button size="small" startIcon={<FontAwesomeIcon icon={faCopy} style={{ fontSize: '0.8rem' }} />}
          onClick={() => navigator.clipboard?.writeText(text).then(() => showToast('Codes copiés', 'success'))}>Copier</Button>
        <Button size="small" startIcon={<FontAwesomeIcon icon={faDownload} style={{ fontSize: '0.8rem' }} />} onClick={download}>Télécharger</Button>
      </Box>
    </Box>
  )
}

// Carte « Double authentification » de Paramètres > Mot de passe
export default function TwoFactorCard() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const [status, setStatus] = useState<Status | null>(null)

  // Activation
  const [setupOpen, setSetupOpen] = useState(false)
  const [setup, setSetup] = useState<{ qr: string, secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [codes, setCodes] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)

  // Désactivation / nouveaux codes
  const [disableOpen, setDisableOpen] = useState(false)
  const [regenOpen, setRegenOpen] = useState(false)
  const [password, setPassword] = useState('')

  const load = () => api.get('/auth/2fa').then(r => setStatus(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const startSetup = async () => {
    setBusy(true); setCode(''); setCodes(null); setSetup(null); setSetupOpen(true)
    try {
      const r = await api.post('/auth/2fa/setup')
      setSetup({ qr: r.data.qr, secret: r.data.secret })
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur', 'error'); setSetupOpen(false)
    } finally { setBusy(false) }
  }

  const confirmSetup = async () => {
    setBusy(true)
    try {
      const r = await api.post('/auth/2fa/enable', { code })
      setCodes(r.data.recovery_codes)
      updateUser({ totp_enabled: 1 })
      load()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Code incorrect', 'error')
    } finally { setBusy(false) }
  }

  const disable = async () => {
    setBusy(true)
    try {
      await api.post('/auth/2fa/disable', { password, code })
      showToast('Double authentification désactivée', 'success')
      updateUser({ totp_enabled: 0 })
      setDisableOpen(false); load()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur', 'error')
    } finally { setBusy(false) }
  }

  const regenerate = async () => {
    setBusy(true)
    try {
      const r = await api.post('/auth/2fa/recovery-codes', { code })
      setCodes(r.data.recovery_codes); load()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur', 'error')
    } finally { setBusy(false) }
  }

  if (!status) return null
  const isSuperAdmin = user?.role === 'super_admin'
  const activeStep = codes ? 2 : setup ? 1 : 0

  return (
    <Card sx={{ maxWidth: 640 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
          <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: '1.1rem', color: status.enabled ? '#16a34a' : '#9ca3af' }} />
          <Typography variant="subtitle1" fontWeight={600}>Double authentification</Typography>
          <Chip size="small" label={status.enabled ? 'Activée' : 'Désactivée'}
            sx={{ fontWeight: 600, bgcolor: status.enabled ? '#dcfce7' : '#f1f5f9', color: status.enabled ? '#16a34a' : '#64748b' }} />
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          En plus du mot de passe, un code à 6 chiffres généré par une application (Google Authenticator,
          Microsoft Authenticator, Authy…) est demandé à chaque connexion.
        </Typography>

        {!status.enabled && isSuperAdmin && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Votre compte a accès à toutes les écoles de la plateforme : la double authentification est fortement recommandée.
          </Alert>
        )}

        {status.enabled ? (
          <>
            <Typography variant="body2" mb={2}>
              Codes de secours restants : <b>{status.recovery_codes_remaining}</b>
              {status.recovery_codes_remaining <= 3 && <Box component="span" sx={{ color: 'error.main' }}> — pensez à en générer de nouveaux</Box>}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="outlined" startIcon={<FontAwesomeIcon icon={faKey} style={{ fontSize: '0.8rem' }} />}
                onClick={() => { setCode(''); setCodes(null); setRegenOpen(true) }}>
                Nouveaux codes de secours
              </Button>
              <Button variant="outlined" color="error" onClick={() => { setPassword(''); setCode(''); setDisableOpen(true) }}>
                Désactiver
              </Button>
            </Box>
          </>
        ) : (
          <Button variant="contained" onClick={startSetup}
            startIcon={<FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: '0.85rem' }} />}>
            Activer la double authentification
          </Button>
        )}
      </CardContent>

      {/* ── Activation ─────────────────────────────────────────────────────── */}
      <Dialog open={setupOpen} onClose={() => !busy && !codes && setSetupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Activer la double authentification</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            <Step><StepLabel>Scanner</StepLabel></Step>
            <Step><StepLabel>Vérifier</StepLabel></Step>
            <Step><StepLabel>Codes de secours</StepLabel></Step>
          </Stepper>
          {!setup && <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box>}
          {setup && !codes && (
            <Box>
              <Typography variant="body2" mb={2}>
                1. Ouvrez votre application d'authentification et scannez ce QR code
                (ou saisissez la clé à la main).
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Box component="img" src={setup.qr} alt="QR code de configuration" sx={{ width: 200, height: 200, border: '1px solid #e5e7eb', borderRadius: 2 }} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'center' }}>
                  {setup.secret.match(/.{1,4}/g)?.join(' ')}
                </Typography>
              </Box>
              <Typography variant="body2" mb={1}>2. Saisissez le code à 6 chiffres affiché par l'application :</Typography>
              <TextField fullWidth value={code} onChange={e => setCode(e.target.value)} placeholder="123 456" autoFocus
                inputProps={{ inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 7, style: { letterSpacing: 6, fontSize: '1.2rem', textAlign: 'center' } }} />
            </Box>
          )}
          {codes && <RecoveryCodes codes={codes} />}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          {codes ? (
            <Button variant="contained" onClick={() => { setSetupOpen(false); showToast('Double authentification activée', 'success') }}>
              J'ai conservé mes codes
            </Button>
          ) : (
            <>
              <Button onClick={() => setSetupOpen(false)} disabled={busy}>Annuler</Button>
              <Button variant="contained" onClick={confirmSetup} disabled={busy || !setup || code.replace(/\s/g, '').length !== 6}>
                {busy ? <CircularProgress size={18} color="inherit" /> : 'Activer'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Désactivation ──────────────────────────────────────────────────── */}
      <Dialog open={disableOpen} onClose={() => !busy && setDisableOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Désactiver la double authentification</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Confirmez avec votre mot de passe et un code de l'application (ou un code de secours).
          </Typography>
          <PasswordField fullWidth label="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Code" value={code} onChange={e => setCode(e.target.value)} placeholder="123456 ou XXXXX-XXXXX" />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDisableOpen(false)} disabled={busy}>Annuler</Button>
          <Button variant="contained" color="error" onClick={disable} disabled={busy || !password || !code}>
            {busy ? <CircularProgress size={18} color="inherit" /> : 'Désactiver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Nouveaux codes de secours ──────────────────────────────────────── */}
      <Dialog open={regenOpen} onClose={() => !busy && setRegenOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Nouveaux codes de secours</DialogTitle>
        <DialogContent>
          {codes ? <RecoveryCodes codes={codes} /> : (
            <>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Les anciens codes de secours ne fonctionneront plus. Confirmez avec un code de votre application.
              </Typography>
              <TextField fullWidth value={code} onChange={e => setCode(e.target.value)} placeholder="123 456" autoFocus
                inputProps={{ inputMode: 'numeric', maxLength: 7, style: { letterSpacing: 6, fontSize: '1.2rem', textAlign: 'center' } }} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          {codes ? (
            <Button variant="contained" onClick={() => setRegenOpen(false)}>J'ai conservé mes codes</Button>
          ) : (
            <>
              <Button onClick={() => setRegenOpen(false)} disabled={busy}>Annuler</Button>
              <Button variant="contained" onClick={regenerate} disabled={busy || code.replace(/\s/g, '').length !== 6}>
                {busy ? <CircularProgress size={18} color="inherit" /> : 'Générer'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Card>
  )
}
