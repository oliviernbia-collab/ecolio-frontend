import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, Typography, Button, Grid, MenuItem, Select, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, IconButton, Tooltip, Avatar, InputAdornment
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faPlus, faPenToSquare, faTrash, faChartLine, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { Grade, Class, Subject } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SkeletonTable from '../../components/ui/SkeletonTable'
import EmptyState from '../../components/ui/EmptyState'
import DataTablePagination from '../../components/ui/DataTablePagination'

const PERIODS = [
  { value: 'trimestre1', label: '1er Trimestre' },
  { value: 'trimestre2', label: '2ème Trimestre' },
  { value: 'trimestre3', label: '3ème Trimestre' },
]

function gradeColor(v: number, max: number) {
  const pct = (v / max) * 20
  if (pct >= 14) return '#16a34a'
  if (pct >= 10) return '#d97706'
  return '#dc2626'
}

type SortKey = 'student_name' | 'subject_name' | 'value' | 'period'
type SortDir  = 'asc' | 'desc'

export default function Grades() {
  const { showToast } = useToast()
  const [grades, setGrades] = useState<Grade[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classFilter, setClassFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('trimestre1')
  const [studentFilter, setStudentFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Grade | null>(null)
  const [toDelete, setToDelete] = useState<Grade | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('student_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const loadData = async () => {
    const [c, s] = await Promise.all([api.get('/classes'), api.get('/subjects')])
    setClasses(c.data.data); setSubjects(s.data.data)
  }

  const loadGrades = async () => {
    setLoading(true)
    try {
      const params: any = { period: periodFilter }
      if (classFilter)   params.class_id   = classFilter
      if (subjectFilter) params.subject_id = subjectFilter
      const r = await api.get('/grades', { params })
      setGrades(r.data.data)
      setPage(0)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (classFilter || subjectFilter) loadGrades() }, [classFilter, subjectFilter, periodFilter])

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/grades/${toDelete.id}`)
      showToast('Note supprimée', 'success')
      loadGrades()
    } catch { showToast('Erreur lors de la suppression', 'error') }
    finally { setDeleting(false); setToDelete(null) }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(0)
  }

  const filteredSubjects = classFilter
    ? subjects.filter(s => !s.class_id || String(s.class_id) === classFilter)
    : subjects

  const sorted = useMemo(() => {
    const q = studentFilter.toLowerCase()
    return [...grades]
      .filter(g => !q || `${g.student_name ?? ''} ${g.matricule ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = String(a[sortKey] ?? '')
        const vb = String(b[sortKey] ?? '')
        return sortDir === 'asc' ? va.localeCompare(vb, 'fr') : vb.localeCompare(va, 'fr')
      })
  }, [grades, sortKey, sortDir, studentFilter])

  const paginated = sorted.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

  const SortCell = ({ label, field }: { label: string; field: SortKey }) => (
    <TableCell>
      <TableSortLabel active={sortKey === field} direction={sortKey === field ? sortDir : 'asc'} onClick={() => handleSort(field)}>
        {label}
      </TableSortLabel>
    </TableCell>
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Notes & Bulletins</Typography>
          <Typography variant="body2" color="text.secondary">{grades.length} note(s)</Typography>
        </Box>
        <Button variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
          onClick={() => { setSelected(null); setFormOpen(true) }}>
          Saisir une note
        </Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Filtrer par élève…"
            value={studentFilter}
            onChange={e => { setStudentFilter(e.target.value); setPage(0) }}
            size="small"
            sx={{ minWidth: { xs: '100%', sm: 180 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '0.8rem', color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <InputLabel>Classe</InputLabel>
            <Select value={classFilter} onChange={e => { setClassFilter(e.target.value); setSubjectFilter('') }} label="Classe">
              <MenuItem value="">Toutes</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            <InputLabel>Matière</InputLabel>
            <Select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} label="Matière">
              <MenuItem value="">Toutes</MenuItem>
              {filteredSubjects.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <InputLabel>Période</InputLabel>
            <Select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} label="Période">
              {PERIODS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={loadGrades} disabled={loading}>Afficher</Button>
        </Box>
      </Card>

      <Card>
        {loading ? (
          <SkeletonTable columns={8} rows={6} hasAvatar />
        ) : grades.length === 0 ? (
          <EmptyState
            icon={faChartLine}
            title={classFilter ? 'Aucune note pour ces critères' : 'Sélectionnez une classe'}
            subtitle={classFilter ? 'Essayez de changer la période ou la matière.' : 'Choisissez une classe et une période pour afficher les notes.'}
            actionLabel={classFilter ? 'Saisir une note' : undefined}
            onAction={classFilter ? () => { setSelected(null); setFormOpen(true) } : undefined}
          />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow>
                    <SortCell label="Élève" field="student_name" />
                    <TableCell className="hide-xs">Matricule</TableCell>
                    <SortCell label="Matière" field="subject_name" />
                    <TableCell className="hide-sm">Coeff.</TableCell>
                    <SortCell label="Période" field="period" />
                    <SortCell label="Note" field="value" />
                    <TableCell className="hide-sm">Type</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map(g => (
                    <TableRow key={g.id} className="MuiTableRow-body">
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: ECOLIO_NAVY, display: { xs: 'none', sm: 'flex' } }}>
                            {g.student_name?.[0]}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{g.student_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell className="hide-xs">
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: ECOLIO_BLUE }}>{g.matricule}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{g.subject_name}</Typography></TableCell>
                      <TableCell className="hide-sm">
                        <Chip label={`×${g.coefficient}`} size="small" sx={{ fontSize: '0.7rem', bgcolor: '#f0f4ff', color: ECOLIO_NAVY }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{PERIODS.find(p => p.value === g.period)?.label}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={700} sx={{ color: gradeColor(g.value, g.max_value), fontSize: '1rem' }}>
                          {g.value}<Typography component="span" variant="caption" color="text.secondary">/{g.max_value}</Typography>
                        </Typography>
                      </TableCell>
                      <TableCell className="hide-sm">
                        <Chip label={g.grade_type} size="small" sx={{ fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Modifier">
                          <IconButton size="small" sx={{ color: ECOLIO_BLUE }} onClick={() => { setSelected(g); setFormOpen(true) }}>
                            <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '0.85rem' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton size="small" color="error" onClick={() => setToDelete(g)}>
                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.85rem' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <DataTablePagination
              total={grades.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
            />
          </>
        )}
      </Card>

      <GradeForm open={formOpen} onClose={() => setFormOpen(false)} grade={selected}
        classes={classes} subjects={filteredSubjects} classId={classFilter}
        onSaved={() => { loadGrades(); showToast(selected ? 'Note modifiée' : 'Note enregistrée', 'success') }} />

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer la note"
        message={`Supprimer la note de ${toDelete?.value}/${toDelete?.max_value} de ${toDelete?.student_name} en ${toDelete?.subject_name} ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </Box>
  )
}

function GradeForm({ open, onClose, grade, classes, subjects, classId, onSaved }: {
  open: boolean; onClose: () => void; grade: Grade | null
  classes: Class[]; subjects: Subject[]; classId: string; onSaved: () => void
}) {
  const { showToast } = useToast()
  const [students, setStudents] = useState<any[]>([])
  const [form, setForm] = useState<any>({ student_id: '', subject_id: '', value: '', max_value: 20, period: 'trimestre1', grade_type: 'devoir', comment: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (classId) api.get(`/classes/${classId}/students`).then(r => setStudents(r.data.data)).catch(() => {})
    if (grade) setForm({ ...grade })
    else setForm({ student_id: '', subject_id: '', value: '', max_value: 20, period: 'trimestre1', grade_type: 'devoir', comment: '' })
  }, [grade, open, classId])

  const handleSave = async () => {
    if (!form.student_id || !form.subject_id || form.value === '') {
      showToast('Élève, matière et note sont requis', 'warning'); return
    }
    setSaving(true)
    try {
      if (grade) await api.put(`/grades/${grade.id}`, form)
      else       await api.post('/grades', form)
      onSaved(); onClose()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur lors de la sauvegarde', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={window.innerWidth < 600}>
      <DialogTitle>{grade ? 'Modifier la note' : 'Saisir une note'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Élève *</InputLabel>
              <Select value={form.student_id} onChange={e => set('student_id', e.target.value)} label="Élève *">
                {students.map(s => <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Matière *</InputLabel>
              <Select value={form.subject_id} onChange={e => set('subject_id', e.target.value)} label="Matière *">
                {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Période</InputLabel>
              <Select value={form.period} onChange={e => set('period', e.target.value)} label="Période">
                {PERIODS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Note *" type="number" value={form.value}
              onChange={e => set('value', e.target.value)}
              inputProps={{ min: 0, max: form.max_value, step: 0.25 }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Note max" type="number" value={form.max_value}
              onChange={e => set('max_value', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select value={form.grade_type} onChange={e => set('grade_type', e.target.value)} label="Type">
                {['devoir', 'composition', 'interrogation', 'examen', 'TP'].map(t => (
                  <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Commentaire" value={form.comment || ''} onChange={e => set('comment', e.target.value)} multiline rows={2} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
