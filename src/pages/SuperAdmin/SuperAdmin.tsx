import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Switch, CircularProgress, Grid, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab, Alert
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faSchool, faUsers, faUserGraduate, faCircleCheck, faCheck, faXmark, faReceipt, faHourglassEnd } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { ActivityLogTable } from '../ActivityLog/ActivityLog'
import { SubscriptionPayment, SubscriptionState } from '../../types'

// Seuil (en jours) à partir duquel un abonnement payé ou un essai est signalé « bientôt expiré »
const EXPIRING_SOON_DAYS = 7

type SubscriptionFilter = 'all' | 'trial' | 'active' | 'expiring' | 'expired'

const isExpiringSoon = (sub: SubscriptionState) => sub.active && sub.daysLeft <= EXPIRING_SOON_DAYS

const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')

function SubscriptionChip({ sub }: { sub: SubscriptionState }) {
  const style = sub.status === 'expired'
    ? { label: 'Expiré', bg: '#fee2e2', fg: '#dc2626' }
    : isExpiringSoon(sub)
      ? { label: sub.status === 'trial' ? 'Essai — bientôt fini' : 'Bientôt expiré', bg: '#fef3c7', fg: '#d97706' }
      : sub.status === 'trial'
        ? { label: 'Essai', bg: '#e0f2fe', fg: '#0284c7' }
        : { label: 'Actif', bg: '#dcfce7', fg: '#16a34a' }
  return <Chip label={style.label} size="small" sx={{ bgcolor: style.bg, color: style.fg, fontWeight: 600 }} />
}

const PAYMENT_STATUS = {
  pending:  { label: 'En attente', bg: '#fef3c7', fg: '#d97706' },
  approved: { label: 'Validé',     bg: '#dcfce7', fg: '#16a34a' },
  rejected: { label: 'Rejeté',     bg: '#fee2e2', fg: '#dc2626' },
}

interface PlatformSchool {
  id: number
  name: string
  city?: string
  email?: string
  phone?: string
  is_public: boolean
  is_active: boolean
  created_at: string
  student_count: number
  user_count: number
  staff_count: number
  subscription: SubscriptionState
}

interface PlatformStats {
  total_schools: number
  active_schools: number
  total_students: number
  total_users: number
  pending_payments: number
}

export default function SuperAdmin() {
  const { showToast } = useToast()
  const { user } = useAuth()
  const [schools, setSchools] = useState<PlatformSchool[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [payments, setPayments] = useState<SubscriptionPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [rejecting, setRejecting] = useState<SubscriptionPayment | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [acting, setActing] = useState(false)
  const [paymentTab, setPaymentTab] = useState<'pending' | 'history'>('pending')
  const [history, setHistory] = useState<SubscriptionPayment[]>([])
  const [subFilter, setSubFilter] = useState<SubscriptionFilter>('all')

  const load = async () => {
    setLoading(true)
    try {
      const [s, st, p, h] = await Promise.all([
        api.get('/admin/schools'), api.get('/admin/stats'), api.get('/admin/subscription-payments?status=pending'),
        api.get('/admin/subscription-payments?status=all'),
      ])
      setSchools(s.data.data); setStats(st.data.data); setPayments(p.data.data)
      setHistory(h.data.data.filter((x: SubscriptionPayment) => x.status !== 'pending'))
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const toggleStatus = async (school: PlatformSchool) => {
    try {
      await api.put(`/admin/schools/${school.id}/status`, { is_active: !school.is_active })
      showToast(school.is_active ? 'École suspendue' : 'École réactivée', 'success')
      load()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur', 'error')
    }
  }

  const approvePayment = async (payment: SubscriptionPayment) => {
    setActing(true)
    try {
      await api.put(`/admin/subscription-payments/${payment.id}/approve`)
      showToast(`Paiement validé — ${payment.school_name} débloquée`, 'success')
      load()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur', 'error')
    } finally { setActing(false) }
  }

  const rejectPayment = async () => {
    if (!rejecting) return
    setActing(true)
    try {
      await api.put(`/admin/subscription-payments/${rejecting.id}/reject`, { note: rejectNote })
      showToast('Paiement rejeté', 'success')
      setRejecting(null); setRejectNote(''); load()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur', 'error')
    } finally { setActing(false) }
  }

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>

  const cards = stats ? [
    { label: 'Écoles', value: stats.total_schools, icon: faSchool, color: ECOLIO_NAVY },
    { label: 'Écoles actives', value: stats.active_schools, icon: faCircleCheck, color: '#2ecc71' },
    { label: 'Élèves (toutes écoles)', value: stats.total_students, icon: faUserGraduate, color: ECOLIO_BLUE },
    { label: 'Utilisateurs', value: stats.total_users, icon: faUsers, color: '#d97706' },
    { label: 'Paiements à vérifier', value: stats.pending_payments, icon: faReceipt, color: '#dc2626' },
    { label: 'Abonnements expirés', value: schools.filter(s => s.subscription.status === 'expired').length, icon: faHourglassEnd, color: '#9333ea' },
  ] : []

  const subCounts: Record<SubscriptionFilter, number> = {
    all: schools.length,
    trial: schools.filter(s => s.subscription.status === 'trial').length,
    active: schools.filter(s => s.subscription.status === 'active').length,
    expiring: schools.filter(s => isExpiringSoon(s.subscription)).length,
    expired: schools.filter(s => s.subscription.status === 'expired').length,
  }
  const filteredSchools = schools.filter(s =>
    subFilter === 'all' ? true
      : subFilter === 'expiring' ? isExpiringSoon(s.subscription)
        : s.subscription.status === subFilter
  )
  const SUB_FILTERS: { key: SubscriptionFilter, label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'trial', label: 'En essai' },
    { key: 'active', label: 'Abonnées' },
    { key: 'expiring', label: `Expirent sous ${EXPIRING_SOON_DAYS} j` },
    { key: 'expired', label: 'Expirées' },
  ]

  return (
    <Box>
      {!user?.totp_enabled && (
        <Alert severity="warning" sx={{ mb: 3 }}
          action={<Button component={Link} to="/settings?tab=password" color="inherit" size="small">Activer</Button>}>
          La double authentification n'est pas activée sur ce compte, qui a accès à toutes les écoles.
        </Alert>
      )}
      <Typography variant="h5" fontWeight={700} mb={0.5}>Panneau plateforme</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Vue transversale sur toutes les écoles clientes d'Écolio.
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {cards.map(c => (
          <Grid item xs={6} sm={4} md={2} key={c.label}>
            <Card sx={{ borderTop: `4px solid ${c.color}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>{c.label}</Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: c.color, mt: 0.5 }}>{c.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" fontWeight={700} mb={0.5}>Paiements d'abonnement</Typography>
      <Typography variant="body2" color="text.secondary" mb={1}>
        Preuves de paiement Wave envoyées par les écoles.
      </Typography>
      <Tabs value={paymentTab} onChange={(_, v) => setPaymentTab(v)} sx={{ mb: 2 }}>
        <Tab value="pending" label={`À vérifier (${payments.length})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab value="history" label={`Historique (${history.length})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>
      <Card sx={{ mb: 4 }}>
        {paymentTab === 'history' ? (
          history.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Aucun paiement traité pour le moment.</Typography>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>École</TableCell>
                    <TableCell align="center">Montant</TableCell>
                    <TableCell>Preuve</TableCell>
                    <TableCell className="hide-xs">Envoyé le</TableCell>
                    <TableCell>Décision</TableCell>
                    <TableCell className="hide-xs">Traité le / par</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map(p => {
                    const st = PAYMENT_STATUS[p.status]
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{p.school_name}</Typography>
                          {p.reference && <Typography variant="caption" color="text.secondary">Réf. {p.reference}</Typography>}
                        </TableCell>
                        <TableCell align="center">{p.amount.toLocaleString('fr-FR')} FCFA</TableCell>
                        <TableCell>
                          <Box component="a" href={p.proof_url} target="_blank" rel="noreferrer"
                            sx={{ display: 'block', width: 44, height: 44, borderRadius: 1, overflow: 'hidden', border: '1px solid #eef0f4' }}>
                            <Box component="img" src={p.proof_url} alt="Preuve de paiement" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                        </TableCell>
                        <TableCell className="hide-xs">{formatDate(p.submitted_at)}</TableCell>
                        <TableCell>
                          <Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.fg, fontWeight: 600 }} />
                          {p.review_note && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{p.review_note}</Typography>}
                        </TableCell>
                        <TableCell className="hide-xs">
                          <Typography variant="body2">{formatDate(p.reviewed_at)}</Typography>
                          {p.reviewed_by_name && <Typography variant="caption" color="text.secondary">{p.reviewed_by_name}</Typography>}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : payments.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Aucun paiement en attente.</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>École</TableCell>
                  <TableCell className="hide-xs">Envoyé par</TableCell>
                  <TableCell align="center">Montant</TableCell>
                  <TableCell>Preuve</TableCell>
                  <TableCell className="hide-xs">Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{p.school_name}</Typography>
                      {p.reference && <Typography variant="caption" color="text.secondary">Réf. {p.reference}</Typography>}
                    </TableCell>
                    <TableCell className="hide-xs">{p.submitted_by_name || '—'}</TableCell>
                    <TableCell align="center">{p.amount.toLocaleString('fr-FR')} FCFA</TableCell>
                    <TableCell>
                      <Box component="a" href={p.proof_url} target="_blank" rel="noreferrer"
                        sx={{ display: 'block', width: 56, height: 56, borderRadius: 1, overflow: 'hidden', border: '1px solid #eef0f4' }}>
                        <Box component="img" src={p.proof_url} alt="Preuve de paiement" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    </TableCell>
                    <TableCell className="hide-xs">{new Date(p.submitted_at).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="contained" color="success" disabled={acting}
                          startIcon={<FontAwesomeIcon icon={faCheck} style={{ fontSize: '0.75rem' }} />}
                          onClick={() => approvePayment(p)}>
                          Valider
                        </Button>
                        <Button size="small" variant="outlined" color="error" disabled={acting}
                          startIcon={<FontAwesomeIcon icon={faXmark} style={{ fontSize: '0.75rem' }} />}
                          onClick={() => setRejecting(p)}>
                          Rejeter
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Typography variant="h6" fontWeight={700} mb={0.5}>Écoles clientes</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Liste de toutes les écoles inscrites sur la plateforme et l'état de leur abonnement.
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {SUB_FILTERS.map(f => (
          <Chip key={f.key} label={`${f.label} (${subCounts[f.key]})`} onClick={() => setSubFilter(f.key)}
            color={subFilter === f.key ? 'primary' : 'default'} variant={subFilter === f.key ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }} />
        ))}
      </Box>
      <Card>
        {filteredSchools.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {schools.length === 0 ? 'Aucune école enregistrée.' : 'Aucune école ne correspond à ce filtre.'}
            </Typography>
          </Box>
        ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>École</TableCell>
                <TableCell className="hide-xs">Ville</TableCell>
                <TableCell align="center">Élèves</TableCell>
                <TableCell align="center" className="hide-xs">Utilisateurs</TableCell>
                <TableCell align="center">Abonnement</TableCell>
                <TableCell align="center" className="hide-xs">Visible publiquement</TableCell>
                <TableCell align="center">Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSchools.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                  </TableCell>
                  <TableCell className="hide-xs">{s.city || '—'}</TableCell>
                  <TableCell align="center">{s.student_count}</TableCell>
                  <TableCell align="center" className="hide-xs">{s.user_count}</TableCell>
                  <TableCell align="center">
                    <SubscriptionChip sub={s.subscription} />
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      {s.subscription.status === 'expired'
                        ? `Depuis le ${formatDate(s.subscription.paidUntil || s.subscription.trialEndsAt)}`
                        : `Jusqu'au ${formatDate(s.subscription.status === 'active' ? s.subscription.paidUntil : s.subscription.trialEndsAt)} · ${s.subscription.daysLeft} j`}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" className="hide-xs">
                    {s.is_public
                      ? <Chip label="Publique" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a' }} />
                      : <Chip label="Privée" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b' }} />}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Switch size="small" checked={!!s.is_active} onChange={() => toggleStatus(s)} color="success" />
                      <Chip label={s.is_active ? 'Active' : 'Suspendue'} size="small"
                        sx={{ bgcolor: s.is_active ? '#dcfce7' : '#fee2e2', color: s.is_active ? '#16a34a' : '#dc2626', fontWeight: 600 }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        )}
      </Card>

      <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 0.5 }}>Journal d'activité</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Toutes les actions effectuées sur la plateforme, toutes écoles confondues.
      </Typography>
      <ActivityLogTable platform />

      <Dialog open={!!rejecting} onClose={() => setRejecting(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Rejeter ce paiement ?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {rejecting?.school_name} — {rejecting?.amount.toLocaleString('fr-FR')} FCFA
          </Typography>
          <TextField fullWidth multiline rows={2} label="Motif (optionnel)" value={rejectNote}
            onChange={e => setRejectNote(e.target.value)} placeholder="Ex : capture illisible, montant incorrect…" />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRejecting(null)} disabled={acting}>Annuler</Button>
          <Button variant="contained" color="error" onClick={rejectPayment} disabled={acting}>
            {acting ? <CircularProgress size={18} color="inherit" /> : 'Rejeter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
