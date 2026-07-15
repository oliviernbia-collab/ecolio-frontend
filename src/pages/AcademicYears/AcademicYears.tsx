import { useState, useEffect } from 'react'
import {
  Box, Card, Typography, Button, Chip, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, CircularProgress, Switch,
  FormControlLabel, LinearProgress
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faPlus, faPenToSquare, faTrash, faCircleCheck, faLock, faCalendarDays
} from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { AcademicYear } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import SkeletonTable from '../../components/ui/SkeletonTable'

function YearForm({ open, onClose, year, onSaved }: {
  open: boolean; onClose: () => void; year: AcademicYear | null; onSaved: () => void
}) {
  const { showToast } = useToast()
  const empty = { name: '', start_date: '', end_date: '', is_current: false }
  const [form, setForm] = useState<any>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    setForm(year
      ? {
          name: year.name,
          start_date: year.start_date?.split('T')[0] || '',
          end_date: year.end_date?.split('T')[0] || '',
          is_current: !!year.is_current,
        }
      : empty
    )
  }, [year, open])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const validate = () => {
    if (!form.name.trim()) return 'Le nom est requis (ex. 2024-2025)'
    if (!form.start_date)  return 'Date de début requise'
    if (!form.end_date)    return 'Date de fin requise'
    if (form.end_date <= form.start_date) return 'La date de fin doit être après le début'
    return ''
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true); setError('')
    try {
      if (year) await api.put(`/academic-years/${year.id}`, form)
      else      await api.post('/academic-years', form)
      showToast(year ? 'Année mise à jour' : 'Année créée', 'success')
      onSaved(); onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erreur lors de la sauvegarde'
      setError(msg); showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{year ? 'Modifier l\'année' : 'Nouvelle année scolaire'}</DialogTitle>
      <DialogContent>
        {error && (
          <Box className="animate-shake" sx={{ color: 'error.main', mb: 2, p: 1.5, bgcolor: '#fff5f5', borderRadius: 1, border: '1px solid #fecaca', fontSize: '0.85rem' }}>
            {error}
          </Box>
        )}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="Nom (ex. 2024-2025) *" value={form.name}
              onChange={e => set('name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Date de début *" type="date" value={form.start_date}
              onChange={e => set('start_date', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Date de fin *" type="date" value={form.end_date}
              onChange={e => set('end_date', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={!!form.is_current} onChange={e => set('is_current', e.target.checked)} color="primary" />}
              label={<Typography variant="body2">Définir comme année active <Typography component="span" variant="caption" color="text.secondary">(désactivera l'actuelle)</Typography></Typography>}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : year ? 'Enregistrer' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function AcademicYears() {
  const { showToast } = useToast()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<AcademicYear | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<AcademicYear | null>(null)
  const [confirmClose, setConfirmClose] = useState<AcademicYear | null>(null)
  const [confirmActive, setConfirmActive] = useState<AcademicYear | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/academic-years')
      setYears(r.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSetCurrent = async (y: AcademicYear) => {
    setActionLoading(true)
    try {
      await api.put(`/academic-years/${y.id}/current`)
      showToast(`"${y.name}" définie comme année active`, 'success')
      load()
    } catch { showToast('Erreur', 'error') }
    finally { setActionLoading(false); setConfirmActive(null) }
  }

  const handleClose = async (y: AcademicYear) => {
    setActionLoading(true)
    try {
      await api.put(`/academic-years/${y.id}/close`)
      showToast(`"${y.name}" clôturée`, 'success')
      load()
    } catch { showToast('Erreur', 'error') }
    finally { setActionLoading(false); setConfirmClose(null) }
  }

  const handleDelete = async (y: AcademicYear) => {
    setActionLoading(true)
    try {
      await api.delete(`/academic-years/${y.id}`)
      showToast(`"${y.name}" supprimée`, 'success')
      load()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur lors de la suppression', 'error')
    } finally { setActionLoading(false); setConfirmDelete(null) }
  }

  const activeYear = years.find(y => y.is_current)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Années scolaires</Typography>
          <Typography variant="body2" color="text.secondary">
            {years.length} année{years.length > 1 ? 's' : ''}{activeYear ? ` · Active : ${activeYear.name}` : ''}
          </Typography>
        </Box>
        <Button variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
          onClick={() => { setSelected(null); setFormOpen(true) }}>
          Nouvelle année
        </Button>
      </Box>

      {loading ? (
        <Card><SkeletonTable columns={5} rows={3} /></Card>
      ) : years.length === 0 ? (
        <Card>
          <EmptyState
            icon={faCalendarDays}
            title="Aucune année scolaire"
            subtitle="Créez votre première année scolaire pour commencer à gérer les classes et les élèves."
            actionLabel="Créer une année"
            onAction={() => { setSelected(null); setFormOpen(true) }}
          />
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} className="stagger">
          {years.map(y => {
            const start   = new Date(y.start_date)
            const end     = new Date(y.end_date)
            const now     = new Date()
            const total   = end.getTime() - start.getTime()
            const elapsed = Math.max(0, Math.min(now.getTime() - start.getTime(), total))
            const progress = total > 0 ? Math.round((elapsed / total) * 100) : 0
            const isPast  = end < now

            return (
              <Card key={y.id} className="animate-fade-in-up" sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                      <Typography variant="h6" fontWeight={700}>{y.name}</Typography>
                      {y.is_current && (
                        <Chip label="Active" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 600, fontSize: '0.7rem' }} />
                      )}
                      {isPast && !y.is_current && (
                        <Chip label="Clôturée" size="small" sx={{ bgcolor: '#f3f4f6', color: '#6b7280', fontSize: '0.7rem' }} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      {start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {' '}&rarr;{' '}
                      {end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="h6" fontWeight={700} color={ECOLIO_NAVY}>{y.class_count ?? 0}</Typography>
                        <Typography variant="caption" color="text.secondary">Classes</Typography>
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700} color={ECOLIO_NAVY}>{y.student_count ?? 0}</Typography>
                        <Typography variant="caption" color="text.secondary">Élèves</Typography>
                      </Box>
                    </Box>
                    {y.is_current && (
                      <Box sx={{ mt: 2, maxWidth: 360 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Progression de l'année</Typography>
                          <Typography variant="caption" fontWeight={600} color={ECOLIO_BLUE}>{progress}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{ height: 6, borderRadius: 3, bgcolor: '#e8f0fe', '& .MuiLinearProgress-bar': { bgcolor: ECOLIO_BLUE } }}
                        />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    {!y.is_current && (
                      <Tooltip title="Définir comme active">
                        <IconButton size="small" sx={{ color: '#16a34a' }} onClick={() => setConfirmActive(y)}>
                          <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: '0.9rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {y.is_current && (
                      <Tooltip title="Clôturer l'année">
                        <IconButton size="small" sx={{ color: '#d97706' }} onClick={() => setConfirmClose(y)}>
                          <FontAwesomeIcon icon={faLock} style={{ fontSize: '0.9rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Modifier">
                      <IconButton size="small" sx={{ color: ECOLIO_BLUE }} onClick={() => { setSelected(y); setFormOpen(true) }}>
                        <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '0.85rem' }} />
                      </IconButton>
                    </Tooltip>
                    {!y.is_current && (
                      <Tooltip title="Supprimer">
                        <IconButton size="small" color="error" onClick={() => setConfirmDelete(y)}>
                          <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.85rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Card>
            )
          })}
        </Box>
      )}

      <YearForm open={formOpen} onClose={() => setFormOpen(false)} year={selected} onSaved={load} />

      <ConfirmDialog
        open={!!confirmActive}
        title="Changer l'année active"
        message={`Voulez-vous définir "${confirmActive?.name}" comme année scolaire active ? L'année actuellement active sera désactivée.`}
        confirmLabel="Définir active"
        variant="default"
        loading={actionLoading}
        onConfirm={() => confirmActive && handleSetCurrent(confirmActive)}
        onCancel={() => setConfirmActive(null)}
      />
      <ConfirmDialog
        open={!!confirmClose}
        title="Clôturer l'année"
        message={`Confirmer la clôture de "${confirmClose?.name}" ? Elle ne sera plus marquée comme active.`}
        confirmLabel="Clôturer"
        variant="warning"
        loading={actionLoading}
        onConfirm={() => confirmClose && handleClose(confirmClose)}
        onCancel={() => setConfirmClose(null)}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer l'année"
        message={`Supprimer définitivement "${confirmDelete?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </Box>
  )
}
