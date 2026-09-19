import { useState, useEffect, useRef } from 'react'
import { Box, Typography, Button, TextField, Alert, Chip, CircularProgress, Divider } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faUpload } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { useAuth } from '../../contexts/AuthContext'
import { ECOLIO_NAVY } from '../../theme'
import { SubscriptionPayment, SubscriptionState } from '../../types'

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'En attente de vérification', bg: '#fef3c7', color: '#b45309' },
  approved: { label: 'Validé', bg: '#dcfce7', color: '#16a34a' },
  rejected: { label: 'Rejeté', bg: '#fee2e2', color: '#dc2626' },
}

const SUB_STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  trial: { label: 'Essai gratuit', bg: '#e0f2fe', color: '#0369a1' },
  active: { label: 'Abonnement actif', bg: '#dcfce7', color: '#16a34a' },
  expired: { label: 'Expiré', bg: '#fee2e2', color: '#dc2626' },
}

// Panneau réutilisable : statut d'abonnement + formulaire de paiement Wave + historique.
// Utilisé à la fois dans l'écran de blocage (SubscriptionExpired) et dans l'onglet
// "Abonnement" des Paramètres, accessible à tout moment (pas seulement une fois bloqué).
export default function SubscriptionPanel() {
  const { user } = useAuth()
  const canPay = user?.role === 'director' || user?.role === 'super_admin'
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null)
  const [payments, setPayments] = useState<SubscriptionPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [waveNumber, setWaveNumber] = useState('0554183378')
  const [price, setPrice] = useState(5000)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/subscription/status')
      setSubscription(r.data.subscription)
      setPayments(r.data.payments)
      setWaveNumber(r.data.wave_number)
      setPrice(r.data.price)
    } catch { /* le panneau reste affiché avec les valeurs par défaut */ }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleFile = (f: File | null) => {
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const submit = async () => {
    if (!file) { setError('Ajoutez la capture d\'écran du paiement'); return }
    setError(''); setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('proof', file)
      if (reference) fd.append('reference', reference)
      await api.post('/subscription/payments', fd)
      setFile(null); setPreview(null); setReference('')
      if (fileRef.current) fileRef.current.value = ''
      load()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de l\'envoi')
    } finally { setSubmitting(false) }
  }

  const hasPending = payments.some(p => p.status === 'pending')

  if (loading && !subscription) {
    return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
  }

  return (
    <Box>
      {subscription && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <Chip label={SUB_STATUS_META[subscription.status]?.label || subscription.status}
            sx={{ bgcolor: SUB_STATUS_META[subscription.status]?.bg, color: SUB_STATUS_META[subscription.status]?.color, fontWeight: 700 }} />
          <Typography variant="body2" color="text.secondary">
            {subscription.status === 'trial' && `${subscription.daysLeft} jour${subscription.daysLeft > 1 ? 's' : ''} restant${subscription.daysLeft > 1 ? 's' : ''} avant la fin de l'essai gratuit`}
            {subscription.status === 'active' && `Actif jusqu'au ${subscription.paidUntil ? new Date(subscription.paidUntil).toLocaleDateString('fr-FR') : '—'}`}
            {subscription.status === 'expired' && "L'accès à l'application est actuellement bloqué"}
          </Typography>
        </Box>
      )}

      {canPay && (
        <>
          <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 2, mb: 3, maxWidth: 420 }}>
            <Typography variant="body2" fontWeight={600} mb={0.5}>Paiement par Wave</Typography>
            <Typography variant="h5" fontWeight={800} color={ECOLIO_NAVY}>{waveNumber}</Typography>
            <Typography variant="body2" color="text.secondary">Montant : <b>{price.toLocaleString('fr-FR')} FCFA</b> / mois</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, maxWidth: 420 }}>{error}</Alert>}

          {hasPending ? (
            <Alert severity="info" sx={{ mb: 2, maxWidth: 420 }}>
              Une preuve de paiement a été envoyée et est en attente de vérification par la plateforme.
            </Alert>
          ) : (
            <Box sx={{ mb: 2, maxWidth: 420 }}>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleFile(e.target.files?.[0] || null)} />
              <Button fullWidth variant="outlined" onClick={() => fileRef.current?.click()}
                startIcon={<FontAwesomeIcon icon={faUpload} style={{ fontSize: '0.85rem' }} />}>
                {file ? file.name : 'Choisir la capture d\'écran du paiement'}
              </Button>
              {preview && (
                <Box component="img" src={preview}
                  sx={{ width: '100%', maxHeight: 180, objectFit: 'contain', mt: 1.5, borderRadius: 1, border: '1px solid #eef0f4' }} />
              )}
              <TextField fullWidth size="small" label="Référence de transaction (optionnel)" value={reference}
                onChange={e => setReference(e.target.value)} sx={{ mt: 1.5 }} />
              <Button variant="contained" sx={{ mt: 1.5 }} disabled={submitting} onClick={submit}>
                {submitting ? <CircularProgress size={18} color="inherit" /> : 'Envoyer la preuve de paiement'}
              </Button>
            </Box>
          )}
        </>
      )}

      {payments.length > 0 && (
        <>
          <Divider sx={{ my: 2, maxWidth: 480 }} />
          <Typography variant="body2" fontWeight={600} mb={1}>Historique des paiements</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 480 }}>
            {payments.slice(0, 10).map(p => (
              <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#f8f9fc', borderRadius: 1 }}>
                <Box>
                  <Typography variant="caption" display="block">{new Date(p.submitted_at).toLocaleDateString('fr-FR')}</Typography>
                  {p.review_note && <Typography variant="caption" color="text.secondary">{p.review_note}</Typography>}
                </Box>
                <Chip size="small" label={STATUS_META[p.status].label}
                  sx={{ bgcolor: STATUS_META[p.status].bg, color: STATUS_META[p.status].color, fontWeight: 600 }} />
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}
