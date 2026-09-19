import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, MenuItem, Select, FormControl, InputLabel, TextField,
  CircularProgress, Chip
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faPlus, faPenToSquare, faTrash, faTrophy, faEye } from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import { AcademicYear, Class, Student, TopStudent } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SkeletonTable from '../../components/ui/SkeletonTable'
import EmptyState from '../../components/ui/EmptyState'

const PERIODS = [
  { value: 'trimestre1', label: '1er Trimestre' },
  { value: 'trimestre2', label: '2ème Trimestre' },
  { value: 'trimestre3', label: '3ème Trimestre' },
]

const CYCLE_LABELS: Record<string, string> = { maternelle: 'Maternelle', primaire: 'Primaire', secondaire: 'Secondaire' }

// Texte blanc lisible (au lieu du gris quasi invisible par défaut de MUI) quand le bouton est désactivé
const DISABLED_BTN_SX = {
  '&.Mui-disabled': { bgcolor: `${ECOLIO_NAVY}59`, color: 'rgba(255,255,255,0.75)' },
}

function TopStudentForm({ open, onClose, entry, classes, academicYearId, period, onSaved }: {
  open: boolean; onClose: () => void; entry: TopStudent | null; classes: Class[]
  academicYearId: number | ''; period: string; onSaved: () => void
}) {
  const { showToast } = useToast()
  const [classId, setClassId] = useState<number | ''>('')
  const [studentId, setStudentId] = useState<number | ''>('')
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [average, setAverage] = useState('')
  const [mention, setMention] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setClassId(entry?.class_id || '')
    setStudentId(entry?.student_id || '')
    setAverage(entry?.average != null ? String(entry.average) : '')
    setMention(entry?.mention || '')
    setError('')
  }, [open, entry])

  useEffect(() => {
    if (!classId) { setStudents([]); return }
    setLoadingStudents(true)
    api.get(`/classes/${classId}/students`)
      .then(r => setStudents(r.data.data))
      .finally(() => setLoadingStudents(false))
  }, [classId])

  const yearClasses = useMemo(() => classes.filter(c => c.academic_year_id === academicYearId), [classes, academicYearId])

  const handleSave = async () => {
    if (!classId || !studentId || !period) { setError('Classe et élève sont requis'); return }
    setSaving(true); setError('')
    try {
      await api.post('/top-students', {
        class_id: classId, student_id: studentId, period,
        average: average ? parseFloat(average) : null,
        mention: mention || null,
      })
      showToast('Enregistré', 'success')
      onSaved(); onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erreur lors de la sauvegarde'
      setError(msg); showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{entry ? 'Modifier' : 'Désigner un major'}</DialogTitle>
      <DialogContent>
        {error && (
          <Box sx={{ color: 'error.main', mb: 2, p: 1.5, bgcolor: '#fff5f5', borderRadius: 1, border: '1px solid #fecaca', fontSize: '0.85rem' }}>
            {error}
          </Box>
        )}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Classe</InputLabel>
              <Select value={classId} label="Classe" onChange={e => { setClassId(e.target.value as number); setStudentId('') }}>
                {yearClasses.map(c => <MenuItem key={c.id} value={c.id}>{c.name} — {c.level}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small" disabled={!classId || loadingStudents}>
              <InputLabel>Élève</InputLabel>
              <Select value={studentId} label="Élève" onChange={e => setStudentId(e.target.value as number)}>
                {students.map(s => <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.matricule})</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" type="number" label="Moyenne (optionnel)" value={average}
              onChange={e => setAverage(e.target.value)} inputProps={{ step: 0.01, min: 0, max: 20 }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Mention (optionnel)" value={mention}
              onChange={e => setMention(e.target.value)} placeholder="Ex : Excellence" />
          </Grid>
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

export default function TopStudents() {
  const { showToast } = useToast()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [entries, setEntries] = useState<TopStudent[]>([])
  const [academicYearId, setAcademicYearId] = useState<number | ''>('')
  const [period, setPeriod] = useState('trimestre1')
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TopStudent | null>(null)
  const [toDelete, setToDelete] = useState<TopStudent | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/academic-years'), api.get('/classes')]).then(([y, c]) => {
      setYears(y.data.data)
      setClasses(c.data.data)
      const current = y.data.data.find((yr: AcademicYear) => yr.is_current) || y.data.data[0]
      if (current) setAcademicYearId(current.id)
    })
  }, [])

  const load = async () => {
    if (!academicYearId) { setEntries([]); setLoading(false); return }
    setLoading(true)
    try {
      const r = await api.get('/top-students', { params: { academic_year_id: academicYearId, period } })
      setEntries(r.data.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [academicYearId, period])

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/top-students/${toDelete.id}`)
      showToast('Retiré du tableau d\'honneur', 'success'); load()
    } catch { showToast('Erreur lors de la suppression', 'error') }
    finally { setDeleting(false); setToDelete(null) }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Tableau d'honneur</Typography>
          <Typography variant="body2" color="text.secondary">
            Le major de chaque niveau, affiché publiquement sur le site de l'école.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" component={Link} to="/tableau-honneur"
            startIcon={<FontAwesomeIcon icon={faEye} style={{ fontSize: '0.8rem' }} />}>
            Voir la page publique
          </Button>
          <Tooltip title={years.length === 0 ? "Créez d'abord une année scolaire (menu Administration)" : ''}>
            <span>
              <Button variant="contained" sx={DISABLED_BTN_SX}
                startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
                onClick={() => { setEditing(null); setFormOpen(true) }} disabled={!academicYearId}>
                Désigner un major
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Année scolaire</InputLabel>
            <Select value={academicYearId} label="Année scolaire" onChange={e => setAcademicYearId(e.target.value as number)}>
              {years.map(y => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Trimestre</InputLabel>
            <Select value={period} label="Trimestre" onChange={e => setPeriod(e.target.value)}>
              {PERIODS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Card>

      <Card>
        {loading ? <SkeletonTable columns={5} rows={4} /> : entries.length === 0 ? (
          <EmptyState icon={faTrophy} title="Aucun major désigné"
            subtitle="Désignez le major de chaque niveau pour ce trimestre — il apparaîtra sur la page publique."
            actionLabel="Désigner un major" onAction={() => { setEditing(null); setFormOpen(true) }} />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Niveau</TableCell>
                  <TableCell className="hide-xs">Cycle</TableCell>
                  <TableCell>Élève</TableCell>
                  <TableCell className="hide-xs">Classe</TableCell>
                  <TableCell align="center">Moyenne</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map(e => (
                  <TableRow key={e.id}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{e.level}</Typography></TableCell>
                    <TableCell className="hide-xs">{CYCLE_LABELS[e.cycle] || e.cycle}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{e.student_name}</Typography>
                      {e.mention && <Chip label={e.mention} size="small" sx={{ mt: 0.3, bgcolor: '#fef3c7', color: '#b45309' }} />}
                    </TableCell>
                    <TableCell className="hide-xs">{e.class_name || '—'}</TableCell>
                    <TableCell align="center">
                      {e.average != null ? <Typography variant="body2" fontWeight={600} sx={{ color: ECOLIO_BLUE }}>{e.average}/20</Typography> : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => { setEditing(e); setFormOpen(true) }}>
                          <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '0.8rem' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Retirer">
                        <IconButton size="small" color="error" onClick={() => setToDelete(e)}>
                          <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.8rem' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <TopStudentForm open={formOpen} onClose={() => setFormOpen(false)} entry={editing} classes={classes}
        academicYearId={academicYearId} period={period} onSaved={load} />
      <ConfirmDialog open={!!toDelete} title="Retirer du tableau d'honneur"
        message={`Retirer ${toDelete?.student_name} du tableau d'honneur (${toDelete?.level}) ?`}
        confirmLabel="Retirer" variant="danger" loading={deleting}
        onConfirm={handleDelete} onCancel={() => setToDelete(null)} />
    </Box>
  )
}
