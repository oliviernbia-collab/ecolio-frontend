import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Switch, CircularProgress, Grid, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faSchool, faUsers, faUserGraduate, faCircleCheck, faCheck, faXmark, faReceipt } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import { ActivityLogTable } from '../ActivityLog/ActivityLog'
import { SubscriptionPayment } from '../../types'

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
  const [schools, setSchools] = useState<PlatformSchool[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [payments, setPayments] = useState<SubscriptionPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [rejecting, setRejecting] = useState<SubscriptionPayment | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [acting, setActing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, st, p] = await Promise.all([
        api.get('/admin/schools'), api.get('/admin/stats'), api.get('/admin/subscription-payments?status=pending'),
      ])
      setSchools(s.data.data); setStats(st.data.data); setPayments(p.data.data)
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
  ] : []

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>Panneau plateforme</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Vue transversale sur toutes les écoles clientes d'Écolio.
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {cards.map(c => (
          <Grid item xs={6} sm={3} key={c.label}>
            <Card sx={{ borderTop: `4px solid ${c.color}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>{c.label}</Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: c.color, mt: 0.5 }}>{c.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" fontWeight={700} mb={0.5}>Paiements à vérifier</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Preuves de paiement Wave envoyées par les écoles, en attente de validation.
      </Typography>
      <Card sx={{ mb: 4 }}>
        {payments.length === 0 ? (
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
        Liste de toutes les écoles inscrites sur la plateforme.
      </Typography>
      <Card>
        {schools.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Aucune école enregistrée.</Typography>
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
                <TableCell align="center">Visible publiquement</TableCell>
                <TableCell align="center">Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schools.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                  </TableCell>
                  <TableCell className="hide-xs">{s.city || '—'}</TableCell>
                  <TableCell align="center">{s.student_count}</TableCell>
                  <TableCell align="center" className="hide-xs">{s.user_count}</TableCell>
                  <TableCell align="center">
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
