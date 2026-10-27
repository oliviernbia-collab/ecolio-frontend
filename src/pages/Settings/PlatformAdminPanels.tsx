// Onglets de Paramètres réservés au super admin : réglages de la plateforme (prix de
// l'abonnement, message défilant), cadeaux aux écoles fidèles et messages de contact.
import { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Button, TextField, Switch, FormControlLabel, CircularProgress,
  InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, ToggleButtonGroup, ToggleButton
} from '@mui/material'
import { keyframes } from '@mui/system'
import { FontAwesomeIcon } from '../../lib/icons'
import { faFloppyDisk, faGift, faReply, faBullhorn } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { useToast } from '../../contexts/ToastContext'
import { SubscriptionState } from '../../types'

const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
const formatDateTime = (d: string) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

const marquee = keyframes`
  from { transform: translateX(100%); }
  to   { transform: translateX(-100%); }
`

// ── Plateforme : prix de l'abonnement + message défilant ─────────────────────────

export function PlatformSettingsPanel() {
  const { showToast } = useToast()
  const [price, setPrice] = useState('')
  const [text, setText] = useState('')
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<'' | 'price' | 'announcement'>('')

  useEffect(() => {
    api.get('/admin/settings').then(r => {
      setPrice(String(r.data.data.subscription_price))
      setText(r.data.data.announcement_text)
      setActive(r.data.data.announcement_active)
    }).finally(() => setLoading(false))
  }, [])

  const save = async (which: 'price' | 'announcement') => {
    if (which === 'price' && (!Number(price) || Number(price) < 100)) { showToast('Montant invalide (minimum 100 FCFA)', 'warning'); return }
    if (which === 'announcement' && active && !text.trim()) { showToast('Écrivez un message avant de l\'activer', 'warning'); return }
    setSaving(which)
    try {
      await api.put('/admin/settings', which === 'price'
        ? { subscription_price: Number(price) }
        : { announcement_text: text, announcement_active: active })
      showToast(which === 'price' ? "Prix de l'abonnement mis à jour" : 'Message défilant enregistré', 'success')
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur', 'error')
    } finally { setSaving('') }
  }

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={0.5}>Prix de l'abonnement mensuel</Typography>
          <Typography variant="body2" color="text.secondary" mb={2.5}>
            Montant demandé aux écoles pour 30 jours d'abonnement. Le nouveau prix s'applique aux prochains paiements ;
            les paiements déjà envoyés gardent leur montant.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <TextField label="Montant" type="number" value={price} onChange={e => setPrice(e.target.value)}
              inputProps={{ min: 100, step: 500 }} sx={{ width: 220 }}
              InputProps={{ endAdornment: <InputAdornment position="end">FCFA / mois</InputAdornment> }} />
            <Button variant="contained" onClick={() => save('price')} disabled={!!saving} sx={{ mt: 1 }}
              startIcon={<FontAwesomeIcon icon={faFloppyDisk} style={{ fontSize: '0.85rem' }} />}>
              {saving === 'price' ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={0.5}>Message défilant de la page d'accueil</Typography>
          <Typography variant="body2" color="text.secondary" mb={2.5}>
            Ce message défile en rouge tout en haut des pages publiques (accueil, tableau d'honneur, contact…).
          </Typography>
          <TextField fullWidth multiline minRows={2} label="Message" value={text}
            onChange={e => setText(e.target.value)} inputProps={{ maxLength: 500 }}
            helperText={`${text.length}/500`}
            placeholder="Ex : Profitez de -20 % sur votre abonnement jusqu'au 30 novembre !" />
          <FormControlLabel sx={{ mt: 1 }}
            control={<Switch checked={active} onChange={e => setActive(e.target.checked)} color="error" />}
            label="Afficher le message sur le site" />

          {text.trim() && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Aperçu</Typography>
              <Box sx={{ bgcolor: '#dc2626', color: '#fff', overflow: 'hidden', py: 0.75, borderRadius: 1, fontSize: '0.85rem', fontWeight: 600, opacity: active ? 1 : 0.5 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap', animation: `${marquee} 14s linear infinite` }}>
                  <FontAwesomeIcon icon={faBullhorn} style={{ fontSize: '0.8rem' }} /> {text}
                </Box>
              </Box>
            </Box>
          )}

          <Box mt={2.5} display="flex" justifyContent="flex-end">
            <Button variant="contained" onClick={() => save('announcement')} disabled={!!saving}
              startIcon={<FontAwesomeIcon icon={faFloppyDisk} style={{ fontSize: '0.85rem' }} />}>
              {saving === 'announcement' ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

// ── Cadeaux : jours d'abonnement offerts aux écoles fidèles ──────────────────────

interface LoyalSchool {
  id: number
  name: string
  city?: string
  created_at: string
  paid_months: number
  total_paid: number
  gifted_days: number
  subscription: SubscriptionState
}

interface Gift {
  id: number
  school_name: string
  days: number
  message: string | null
  granted_by_name: string | null
  paid_until_after: string | null
  created_at: string
}

const monthsSince = (d: string) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / (30 * 86400000)))

export function GiftsPanel() {
  const { showToast } = useToast()
  const [schools, setSchools] = useState<LoyalSchool[]>([])
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState<LoyalSchool | null>(null)
  const [days, setDays] = useState('30')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const load = async () => {
    try {
      const [l, g] = await Promise.all([api.get('/admin/loyalty'), api.get('/admin/gifts')])
      setSchools(l.data.data); setGifts(g.data.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openGift = (s: LoyalSchool) => {
    setTarget(s); setDays('30')
    setMessage(`Merci pour votre fidélité à Écolio ! Nous vous offrons ce mois d'abonnement.`)
  }

  const sendGift = async () => {
    if (!target) return
    const n = parseInt(days, 10)
    if (!n || n < 1 || n > 366) { showToast('Nombre de jours invalide (1 à 366)', 'warning'); return }
    setSending(true)
    try {
      const r = await api.post(`/admin/schools/${target.id}/gift`, { days: n, message })
      showToast(r.data.message, 'success')
      setTarget(null); load()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur', 'error')
    } finally { setSending(false) }
  }

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card>
        <CardContent sx={{ p: 3, pb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={0.5}>Offrir des jours d'abonnement</Typography>
          <Typography variant="body2" color="text.secondary">
            Écoles classées de la plus fidèle (nombre de mois payés, puis ancienneté) à la plus récente. Les jours offerts
            s'ajoutent à la fin de l'abonnement en cours, et le directeur de l'école reçoit une notification avec votre message.
          </Typography>
        </CardContent>
        {schools.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">Aucune école inscrite.</Typography></Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>École</TableCell>
                  <TableCell align="center">Mois payés</TableCell>
                  <TableCell align="center" className="hide-xs">Total payé</TableCell>
                  <TableCell align="center" className="hide-xs">Ancienneté</TableCell>
                  <TableCell align="center">Abonnement jusqu'au</TableCell>
                  <TableCell align="center" className="hide-xs">Déjà offert</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schools.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                      {s.city && <Typography variant="caption" color="text.secondary">{s.city}</Typography>}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={s.paid_months} size="small"
                        sx={{ fontWeight: 700, bgcolor: s.paid_months >= 3 ? '#fef3c7' : '#f1f5f9', color: s.paid_months >= 3 ? '#b45309' : '#475569' }} />
                    </TableCell>
                    <TableCell align="center" className="hide-xs">{s.total_paid.toLocaleString('fr-FR')} FCFA</TableCell>
                    <TableCell align="center" className="hide-xs">{monthsSince(s.created_at)} mois</TableCell>
                    <TableCell align="center">
                      {s.subscription.status === 'expired'
                        ? <Typography variant="body2" color="error.main" fontWeight={600}>Expiré</Typography>
                        : formatDate(s.subscription.status === 'active' ? s.subscription.paidUntil : s.subscription.trialEndsAt)}
                    </TableCell>
                    <TableCell align="center" className="hide-xs">{s.gifted_days ? `${s.gifted_days} j` : '—'}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" color="secondary" onClick={() => openGift(s)}
                        startIcon={<FontAwesomeIcon icon={faGift} style={{ fontSize: '0.75rem' }} />}>
                        Offrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Card>
        <CardContent sx={{ p: 3, pb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>Cadeaux déjà offerts</Typography>
        </CardContent>
        {gifts.length === 0 ? (
          <Box sx={{ p: 3, pt: 1 }}><Typography variant="body2" color="text.secondary">Aucun cadeau offert pour le moment.</Typography></Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>École</TableCell>
                  <TableCell align="center">Jours offerts</TableCell>
                  <TableCell className="hide-xs">Message</TableCell>
                  <TableCell align="center" className="hide-xs">Actif jusqu'au</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gifts.map(g => (
                  <TableRow key={g.id}>
                    <TableCell>{formatDate(g.created_at)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{g.school_name}</Typography>
                      {g.granted_by_name && <Typography variant="caption" color="text.secondary">par {g.granted_by_name}</Typography>}
                    </TableCell>
                    <TableCell align="center">{g.days} j</TableCell>
                    <TableCell className="hide-xs" sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" color="text.secondary" noWrap title={g.message || ''}>{g.message || '—'}</Typography>
                    </TableCell>
                    <TableCell align="center" className="hide-xs">{formatDate(g.paid_until_after)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={!!target} onClose={() => !sending && setTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Offrir un cadeau à {target?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={1}>Durée offerte</Typography>
          <ToggleButtonGroup exclusive size="small" value={days} onChange={(_, v) => v && setDays(v)} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <ToggleButton value="7">1 semaine</ToggleButton>
            <ToggleButton value="30">1 mois</ToggleButton>
            <ToggleButton value="90">3 mois</ToggleButton>
            <ToggleButton value="365">1 an</ToggleButton>
          </ToggleButtonGroup>
          <TextField fullWidth type="number" label="Nombre de jours" value={days} sx={{ mb: 2 }}
            onChange={e => setDays(e.target.value)} inputProps={{ min: 1, max: 366 }} />
          <TextField fullWidth multiline minRows={3} label="Message pour l'école (facultatif)" value={message}
            onChange={e => setMessage(e.target.value)} inputProps={{ maxLength: 1000 }} />
          {target && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Les jours s'ajouteront à {target.subscription.status === 'expired'
                ? "partir d'aujourd'hui (abonnement expiré)"
                : `la fin actuelle, le ${formatDate(target.subscription.status === 'active' ? target.subscription.paidUntil : target.subscription.trialEndsAt)}`}.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setTarget(null)} disabled={sending}>Annuler</Button>
          <Button variant="contained" color="secondary" onClick={sendGift} disabled={sending}
            startIcon={<FontAwesomeIcon icon={faGift} style={{ fontSize: '0.8rem' }} />}>
            {sending ? <CircularProgress size={18} color="inherit" /> : 'Offrir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ── Messages reçus via la page Contact ───────────────────────────────────────────

interface ContactMessage {
  id: number
  reference: string
  user_id: number | null
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  reply: string | null
  replied_at: string | null
  replied_by_name: string | null
  status: 'new' | 'read' | 'replied'
  school_name: string | null
  created_at: string
}

const MESSAGE_STATUS = {
  new:     { label: 'Nouveau',  bg: '#fee2e2', fg: '#dc2626' },
  read:    { label: 'Lu',       bg: '#f1f5f9', fg: '#475569' },
  replied: { label: 'Répondu',  bg: '#dcfce7', fg: '#16a34a' },
}

export function ContactMessagesPanel({ onUnreadChange }: { onUnreadChange?: (n: number) => void }) {
  const { showToast } = useToast()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'replied'>('all')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<ContactMessage | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const load = async () => {
    try {
      const r = await api.get('/admin/contact-messages')
      setMessages(r.data.data); onUnreadChange?.(r.data.unread)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openMessage = (m: ContactMessage) => {
    setOpen(m); setReply(m.reply || '')
    if (m.status === 'new') {
      api.put(`/admin/contact-messages/${m.id}/read`).then(load).catch(() => {})
    }
  }

  const sendReply = async () => {
    if (!open || !reply.trim()) { showToast('Écrivez une réponse', 'warning'); return }
    setSending(true)
    try {
      await api.put(`/admin/contact-messages/${open.id}/reply`, { reply })
      showToast('Réponse envoyée', 'success')
      setOpen(null); load()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur', 'error')
    } finally { setSending(false) }
  }

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>

  const counts = {
    all: messages.length,
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
    replied: messages.filter(m => m.status === 'replied').length,
  }
  const shown = filter === 'all' ? messages : messages.filter(m => m.status === filter)

  return (
    <Card>
      <CardContent sx={{ p: 3, pb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={0.5}>Messages reçus</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Messages envoyés depuis la page Contact du site. Les utilisateurs connectés reçoivent votre réponse en notification ;
          les visiteurs la consultent sur la page Contact avec leur email et leur référence.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          {(['all', 'new', 'read', 'replied'] as const).map(k => (
            <Chip key={k} label={`${k === 'all' ? 'Tous' : MESSAGE_STATUS[k].label} (${counts[k]})`}
              onClick={() => setFilter(k)} color={filter === k ? 'primary' : 'default'}
              variant={filter === k ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} />
          ))}
        </Box>
      </CardContent>
      {shown.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">Aucun message.</Typography></Box>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell>De</TableCell>
                <TableCell>Message</TableCell>
                <TableCell className="hide-xs">Reçu le</TableCell>
                <TableCell align="center">Statut</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map(m => {
                const st = MESSAGE_STATUS[m.status]
                return (
                  <TableRow key={m.id} hover sx={{ cursor: 'pointer', bgcolor: m.status === 'new' ? '#fffbeb' : undefined }} onClick={() => openMessage(m)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={m.status === 'new' ? 700 : 600}>{m.name}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">{m.email}</Typography>
                      {m.school_name && <Typography variant="caption" color="text.secondary">{m.school_name}</Typography>}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{m.subject || '(sans objet)'}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">{m.message}</Typography>
                    </TableCell>
                    <TableCell className="hide-xs">{formatDateTime(m.created_at)}</TableCell>
                    <TableCell align="center"><Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.fg, fontWeight: 600 }} /></TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<FontAwesomeIcon icon={faReply} style={{ fontSize: '0.75rem' }} />}>
                        {m.reply ? 'Voir' : 'Répondre'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={!!open} onClose={() => !sending && setOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {open?.subject || 'Message'} <Typography component="span" variant="body2" color="text.secondary">· {open?.reference}</Typography>
        </DialogTitle>
        {open && (
          <DialogContent>
            <Typography variant="body2" fontWeight={600}>{open.name}{open.school_name ? ` — ${open.school_name}` : ''}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {open.email}{open.phone ? ` · ${open.phone}` : ''} · {formatDateTime(open.created_at)}
              {!open.user_id && ' · visiteur sans compte'}
            </Typography>
            <Box sx={{ mt: 1.5, mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{open.message}</Typography>
            </Box>
            {open.replied_at && (
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Répondu le {formatDateTime(open.replied_at)}{open.replied_by_name ? ` par ${open.replied_by_name}` : ''} — vous pouvez modifier la réponse.
              </Typography>
            )}
            <TextField fullWidth multiline minRows={4} label="Votre réponse" value={reply}
              onChange={e => setReply(e.target.value)} inputProps={{ maxLength: 5000 }} />
          </DialogContent>
        )}
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpen(null)} disabled={sending}>Fermer</Button>
          <Button variant="contained" onClick={sendReply} disabled={sending}
            startIcon={<FontAwesomeIcon icon={faReply} style={{ fontSize: '0.8rem' }} />}>
            {sending ? <CircularProgress size={18} color="inherit" /> : open?.reply ? 'Mettre à jour la réponse' : 'Envoyer la réponse'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
