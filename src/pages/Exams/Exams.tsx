import { useState, useEffect } from 'react'
import {
  Box, Card, Typography, Button, Grid, MenuItem, Select, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Avatar
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faPlus, faTrash, faPenToSquare, faListCheck } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { Exam, Class, Subject } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'

const PERIOD_LABELS: Record<string, string> = {
  trimestre1: '1er trimestre', trimestre2: '2ème trimestre', trimestre3: '3ème trimestre',
  semestre1: '1er semestre', semestre2: '2ème semestre',
}
const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  planifie: { color: '#2E86AB', bg: '#dbeafe', label: 'Planifié' },
  termine:  { color: '#16a34a', bg: '#dcfce7', label: 'Terminé' },
  annule:   { color: '#dc2626', bg: '#fee2e2', label: 'Annulé' },
}

export default function Exams() {
  const { showToast } = useToast()
  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [rooms, setRooms] = useState<Array<{ id: number; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [gradesTarget, setGradesTarget] = useState<Exam | null>(null)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/exams'); setExams(r.data.data) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    Promise.all([api.get('/classes'), api.get('/subjects'), api.get('/rooms')]).then(([c, s, r]) => {
      setClasses(c.data.data); setSubjects(s.data.data); setRooms(r.data.data)
    }).catch(() => {})
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet examen ?')) return
    try { await api.delete(`/exams/${id}`); showToast('Examen supprimé', 'success'); load() }
    catch { showToast('Erreur lors de la suppression', 'error') }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Examens</Typography>
          <Typography variant="body2" color="text.secondary">Planification et notation des examens</Typography>
        </Box>
        <Button variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
          onClick={() => setFormOpen(true)}>
          Planifier un examen
        </Button>
      </Box>

      <Card>
        {loading ? (
          <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>
        ) : exams.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>Aucun examen planifié</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Titre</TableCell>
                  <TableCell className="hide-xs">Classe</TableCell>
                  <TableCell>Matière</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell className="hide-xs">Horaire</TableCell>
                  <TableCell className="hide-sm">Salle</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exams.map(e => {
                  const st = STATUS_COLORS[e.status]
                  return (
                    <TableRow key={e.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={500}>{e.title}</Typography></TableCell>
                      <TableCell className="hide-xs">{e.class_name}</TableCell>
                      <TableCell>{e.subject_name}</TableCell>
                      <TableCell>{new Date(e.exam_date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="hide-xs">{e.start_time?.substring(0, 5)}–{e.end_time?.substring(0, 5)}</TableCell>
                      <TableCell className="hide-sm">{e.room_name || '—'}</TableCell>
                      <TableCell><Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 600 }} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => setGradesTarget(e)} title="Saisir les notes">
                          <FontAwesomeIcon icon={faListCheck} style={{ fontSize: '0.85rem', color: ECOLIO_BLUE }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(e.id)} title="Supprimer">
                          <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.85rem', color: '#dc2626' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <ExamForm open={formOpen} onClose={() => setFormOpen(false)} classes={classes} subjects={subjects} rooms={rooms}
        onSaved={() => { load(); showToast('Examen planifié', 'success') }} />

      {gradesTarget && (
        <ExamGradesDialog exam={gradesTarget} onClose={() => setGradesTarget(null)}
          onSaved={() => { load(); showToast('Notes enregistrées', 'success') }} />
      )}
    </Box>
  )
}

function ExamForm({ open, onClose, classes, subjects, rooms, onSaved }: {
  open: boolean; onClose: () => void; classes: Class[]; subjects: Subject[]
  rooms: Array<{ id: number; name: string }>; onSaved: () => void
}) {
  const { showToast } = useToast()
  const empty = { class_id: '', subject_id: '', title: '', exam_date: '', start_time: '08:00', end_time: '09:00', room_id: '', period: 'trimestre1', max_value: 20 }
  const [form, setForm] = useState<any>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  useEffect(() => { if (open) { setForm(empty); setError('') } }, [open])

  const filteredSubjects = form.class_id ? subjects.filter(s => !s.class_id || String(s.class_id) === String(form.class_id)) : subjects

  const handleSave = async () => {
    if (!form.class_id || !form.subject_id || !form.title.trim() || !form.exam_date) {
      setError('Classe, matière, titre et date sont requis'); return
    }
    setSaving(true); setError('')
    try {
      await api.post('/exams', { ...form, room_id: form.room_id || null })
      onSaved(); onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erreur lors de la planification'
      setError(msg); showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={window.innerWidth < 600}>
      <DialogTitle>Planifier un examen</DialogTitle>
      <DialogContent>
        {error && <Typography color="error" variant="caption" display="block" mb={1}>{error}</Typography>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="Titre" value={form.title} onChange={e => set('title', e.target.value)} size="small" placeholder="Ex : Composition de Mathématiques" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Classe</InputLabel>
              <Select value={form.class_id} onChange={e => set('class_id', e.target.value)} label="Classe">
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Matière</InputLabel>
              <Select value={form.subject_id} onChange={e => set('subject_id', e.target.value)} label="Matière">
                {filteredSubjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="date" label="Date" value={form.exam_date} onChange={e => set('exam_date', e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Période</InputLabel>
              <Select value={form.period} onChange={e => set('period', e.target.value)} label="Période">
                {Object.entries(PERIOD_LABELS).map(([k, label]) => <MenuItem key={k} value={k}>{label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Début" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} size="small" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Fin" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} size="small" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Salle</InputLabel>
              <Select value={form.room_id} onChange={e => set('room_id', e.target.value)} label="Salle">
                <MenuItem value="">Aucune</MenuItem>
                {rooms.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Planifier'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function ExamGradesDialog({ exam, onClose, onSaved }: { exam: Exam; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast()
  const [students, setStudents] = useState<Array<{ id: number; first_name: string; last_name: string; matricule: string }>>([])
  const [values, setValues] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/classes/${exam.class_id}/students`),
      api.get(`/exams/${exam.id}`),
    ]).then(([studentsRes, examRes]) => {
      setStudents(studentsRes.data.data)
      const existing: Record<number, string> = {}
      for (const g of examRes.data.data.grades || []) existing[g.student_id] = String(g.value)
      setValues(existing)
    }).finally(() => setLoading(false))
  }, [exam.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const grades = students
        .filter(s => values[s.id] !== undefined && values[s.id] !== '')
        .map(s => ({ student_id: s.id, value: values[s.id] }))
      if (!grades.length) { showToast('Saisissez au moins une note', 'warning'); setSaving(false); return }
      await api.post(`/exams/${exam.id}/grades`, { grades })
      onSaved(); onClose()
    } catch (e: any) {
      showToast(e.response?.data?.message || "Erreur lors de l'enregistrement", 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={window.innerWidth < 600}>
      <DialogTitle>Notes — {exam.title}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 340 }}>
            <TableHead>
              <TableRow><TableCell>Élève</TableCell><TableCell align="right" sx={{ width: 120 }}>Note /{exam.max_value}</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {students.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 26, height: 26, fontSize: '0.68rem', bgcolor: ECOLIO_NAVY }}>{s.first_name[0]}{s.last_name[0]}</Avatar>
                      <Typography variant="body2">{s.first_name} {s.last_name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" type="number" value={values[s.id] || ''}
                      onChange={e => setValues(v => ({ ...v, [s.id]: e.target.value }))}
                      inputProps={{ min: 0, max: exam.max_value, step: 0.25, style: { textAlign: 'right', width: 70 } }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" startIcon={<FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '0.8rem' }} />}
          onClick={handleSave} disabled={saving || loading}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer les notes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
