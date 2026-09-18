import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, Typography, Button, TextField, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Tooltip, FormControlLabel, Checkbox
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faMagnifyingGlass, faPlus, faTrash, faBriefcaseMedical } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { HealthVisit, Student } from '../../types'
import { useToast } from '../../contexts/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SkeletonTable from '../../components/ui/SkeletonTable'
import EmptyState from '../../components/ui/EmptyState'

function VisitForm({ open, onClose, students, onSaved }: { open: boolean; onClose: () => void; students: Student[]; onSaved: () => void }) {
  const { showToast } = useToast()
  const empty = { student_id: '', reason: '', treatment: '', temperature: '', sent_home: false, notes: '' }
  const [form, setForm] = useState<any>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (open) { setForm(empty); setError('') } }, [open])
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.student_id || !form.reason.trim()) { setError('Élève et motif sont requis'); return }
    setSaving(true); setError('')
    try {
      await api.post('/health', { ...form, temperature: form.temperature || null })
      showToast('Visite enregistrée', 'success')
      onSaved(); onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erreur lors de la sauvegarde'
      setError(msg); showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={window.innerWidth < 600}>
      <DialogTitle>Nouvelle visite à l'infirmerie</DialogTitle>
      <DialogContent>
        {error && <Box sx={{ color: 'error.main', mb: 2, p: 1.5, bgcolor: '#fff5f5', borderRadius: 1, border: '1px solid #fecaca', fontSize: '0.85rem' }}>{error}</Box>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Élève</InputLabel>
              <Select value={form.student_id} onChange={e => set('student_id', e.target.value)} label="Élève">
                {students.map(s => <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.matricule})</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Motif *" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Ex : Mal de tête, chute, fièvre…" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Température (°C)" type="number" value={form.temperature} onChange={e => set('temperature', e.target.value)} inputProps={{ step: 0.1 }} /></Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel control={<Checkbox checked={form.sent_home} onChange={e => set('sent_home', e.target.checked)} />} label="Renvoyé(e) à la maison" />
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Traitement administré" value={form.treatment} onChange={e => set('treatment', e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function Health() {
  const { showToast } = useToast()
  const [visits, setVisits] = useState<HealthVisit[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState<HealthVisit | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [v, s] = await Promise.all([api.get('/health'), api.get('/students')])
      setVisits(v.data.data); setStudents(s.data.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/health/${toDelete.id}`)
      showToast('Visite supprimée', 'success'); load()
    } catch { showToast('Erreur lors de la suppression', 'error') }
    finally { setDeleting(false); setToDelete(null) }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return visits.filter(v => !search || (v.student_name || '').toLowerCase().includes(q) || v.reason.toLowerCase().includes(q))
  }, [visits, search])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Infirmerie</Typography>
          <Typography variant="body2" color="text.secondary">{filtered.length} visite{filtered.length > 1 ? 's' : ''}</Typography>
        </Box>
        <Button variant="contained" startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />} onClick={() => setFormOpen(true)}>
          Nouvelle visite
        </Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField placeholder="Rechercher un élève, un motif…" value={search} onChange={e => setSearch(e.target.value)}
            size="small" sx={{ minWidth: { xs: '100%', sm: 320 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '0.85rem', color: '#9ca3af' }} /></InputAdornment> }} />
        </Box>
      </Card>

      <Card>
        {loading ? <SkeletonTable columns={6} rows={6} /> : filtered.length === 0 ? (
          <EmptyState icon={faBriefcaseMedical} title="Aucune visite" subtitle="Enregistrez une visite depuis le bouton ci-dessus."
            actionLabel="Nouvelle visite" onAction={() => setFormOpen(true)} />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Élève</TableCell>
                  <TableCell>Motif</TableCell>
                  <TableCell className="hide-xs">Date</TableCell>
                  <TableCell className="hide-xs">Température</TableCell>
                  <TableCell>Renvoyé</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{v.student_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{v.class_name}</Typography>
                    </TableCell>
                    <TableCell>{v.reason}</TableCell>
                    <TableCell className="hide-xs">{new Date(v.visit_date).toLocaleString('fr-FR')}</TableCell>
                    <TableCell className="hide-xs">{v.temperature ? `${v.temperature} °C` : '—'}</TableCell>
                    <TableCell>
                      {v.sent_home
                        ? <Chip label="Oui" size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626' }} />
                        : <Chip label="Non" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b' }} />}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => setToDelete(v)}>
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.8rem' }} /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <VisitForm open={formOpen} onClose={() => setFormOpen(false)} students={students} onSaved={load} />
      <ConfirmDialog open={!!toDelete} title="Supprimer la visite"
        message="Supprimer cet enregistrement de visite à l'infirmerie ?"
        confirmLabel="Supprimer" variant="danger" loading={deleting}
        onConfirm={handleDelete} onCancel={() => setToDelete(null)} />
    </Box>
  )
}
