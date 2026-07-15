import { useState, useEffect } from 'react'
import {
  Box, Card, Typography, Button, Grid, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Tabs, Tab, useMediaQuery, useTheme
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { ScheduleEntry, Class, Subject } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'

const DAYS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
const COLORS = ['#dbeafe', '#dcfce7', '#fef9c3', '#fce7f3', '#f3e8ff', '#fff7ed']
const TEXT_COLORS = [ECOLIO_NAVY, '#15803d', '#854d0e', '#9d174d', '#6b21a8', '#9a3412']
const TIME_SLOTS = ['07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00']

export default function Schedule() {
  const { showToast } = useToast()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [classId, setClassId] = useState('')
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const todayIndex = new Date().getDay() // 0=dimanche..6=samedi
  const [selectedDay, setSelectedDay] = useState(todayIndex >= 1 && todayIndex <= 5 ? todayIndex : 1)

  useEffect(() => {
    Promise.all([api.get('/classes'), api.get('/subjects')]).then(([c, s]) => {
      setClasses(c.data.data); setSubjects(s.data.data)
    })
  }, [])

  const load = async () => {
    if (!classId) return
    setLoading(true)
    try {
      const r = await api.get(`/schedule/class/${classId}`)
      setSchedule(r.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [classId])

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce créneau ?')) return
    try {
      await api.delete(`/schedule/${id}`)
      showToast('Créneau supprimé', 'success')
      load()
    } catch {
      showToast('Erreur lors de la suppression', 'error')
    }
  }

  const grid: Record<number, Record<string, ScheduleEntry[]>> = {}
  for (let d = 1; d <= 5; d++) {
    grid[d] = {}
    for (const slot of TIME_SLOTS) grid[d][slot] = []
  }
  for (const entry of schedule) {
    const start = entry.start_time.substring(0, 5)
    if (grid[entry.day_of_week]?.[start]) grid[entry.day_of_week][start].push(entry)
  }

  const filteredSubjects = classId ? subjects.filter(s => !s.class_id || String(s.class_id) === classId) : subjects

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Emploi du temps</Typography>
          <Typography variant="body2" color="text.secondary">Planning hebdomadaire</Typography>
        </Box>
        <Button variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
          onClick={() => setFormOpen(true)}>
          Ajouter un créneau
        </Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Classe</InputLabel>
            <Select value={classId} onChange={e => setClassId(e.target.value)} label="Classe">
              <MenuItem value="">Sélectionner une classe</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>
      ) : !classId ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">Sélectionnez une classe pour afficher son emploi du temps</Typography>
        </Card>
      ) : isMobile ? (
        <Card>
          <Tabs value={selectedDay} onChange={(_, v) => setSelectedDay(v)} variant="fullWidth"
            sx={{ bgcolor: ECOLIO_NAVY, minHeight: 40, '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', minHeight: 40, fontSize: '0.75rem', px: 0.5 }, '& .Mui-selected': { color: 'white !important' }, '& .MuiTabs-indicator': { bgcolor: 'white' } }}>
            {DAYS.slice(1).map((d, i) => <Tab key={i + 1} value={i + 1} label={d.slice(0, 3)} />)}
          </Tabs>
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {(() => {
              const dayEntries = schedule
                .filter(e => e.day_of_week === selectedDay)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
              if (!dayEntries.length) {
                return <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Aucun cours ce jour</Typography>
              }
              return dayEntries.map((e, i) => (
                <Box key={e.id} sx={{ display: 'flex', gap: 1.5, bgcolor: COLORS[i % COLORS.length], borderRadius: 1.5, p: 1.5, position: 'relative' }}>
                  <Box sx={{ minWidth: 56, textAlign: 'center' }}>
                    <Typography sx={{ color: TEXT_COLORS[i % TEXT_COLORS.length], fontWeight: 700, fontSize: '0.75rem' }}>{e.start_time?.substring(0, 5)}</Typography>
                    <Typography sx={{ color: TEXT_COLORS[i % TEXT_COLORS.length], fontSize: '0.65rem', opacity: 0.7 }}>{e.end_time?.substring(0, 5)}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: TEXT_COLORS[i % TEXT_COLORS.length], fontSize: '0.85rem', fontWeight: 600 }}>{e.subject_name}</Typography>
                    <Typography sx={{ color: TEXT_COLORS[i % TEXT_COLORS.length], fontSize: '0.7rem', opacity: 0.7 }}>{e.teacher_name}{e.room_name ? ` · ${e.room_name}` : ''}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => handleDelete(e.id)}
                    sx={{ p: 0.3, alignSelf: 'flex-start', color: TEXT_COLORS[i % TEXT_COLORS.length] }}>
                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.7rem' }} />
                  </IconButton>
                </Box>
              ))
            })()}
          </Box>
        </Card>
      ) : (
        <Card sx={{ overflow: 'auto' }}>
          <Box sx={{ minWidth: 700 }}>
            {/* Header */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', bgcolor: ECOLIO_NAVY }}>
              <Box sx={{ p: 1.5 }} />
              {DAYS.slice(1).map(d => (
                <Box key={d} sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>{d}</Typography>
                </Box>
              ))}
            </Box>
            {/* Rows */}
            {TIME_SLOTS.map(slot => (
              <Box key={slot} sx={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', borderBottom: '1px solid #f0f0f0' }}>
                <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8f9fc', borderRight: '1px solid #f0f0f0' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>{slot}</Typography>
                </Box>
                {[1, 2, 3, 4, 5].map(day => {
                  const entries = grid[day]?.[slot] || []
                  return (
                    <Box key={day} sx={{ p: 0.5, minHeight: 52, borderRight: '1px solid #f0f0f0' }}>
                      {entries.map((e, i) => (
                        <Box key={e.id} sx={{ bgcolor: COLORS[i % COLORS.length], borderRadius: 1.5, p: 1, mb: 0.5, position: 'relative', '&:hover .del': { opacity: 1 } }}>
                          <Typography sx={{ color: TEXT_COLORS[i % TEXT_COLORS.length], fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.2 }}>{e.subject_name}</Typography>
                          <Typography sx={{ color: TEXT_COLORS[i % TEXT_COLORS.length], fontSize: '0.65rem', opacity: 0.7 }}>
                            {e.start_time?.substring(0, 5)}–{e.end_time?.substring(0, 5)} · {e.teacher_name?.split(' ')[1] || ''}
                          </Typography>
                          <IconButton className="del" size="small" onClick={() => handleDelete(e.id)}
                            sx={{ position: 'absolute', top: 2, right: 2, opacity: 0, p: 0.3, color: TEXT_COLORS[i % TEXT_COLORS.length], transition: '0.15s' }}>
                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.65rem' }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )
                })}
              </Box>
            ))}
          </Box>
        </Card>
      )}

      <ScheduleForm open={formOpen} onClose={() => setFormOpen(false)} classId={classId}
        subjects={filteredSubjects} onSaved={() => { load(); showToast('Créneau ajouté', 'success') }} />
    </Box>
  )
}

function ScheduleForm({ open, onClose, classId, subjects, onSaved }: {
  open: boolean; onClose: () => void; classId: string; subjects: Subject[]; onSaved: () => void
}) {
  const { showToast } = useToast()
  const [form, setForm] = useState({ subject_id: '', day_of_week: 1, start_time: '08:00', end_time: '09:00' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!classId) { showToast('Veuillez sélectionner une classe', 'warning'); return }
    if (!form.subject_id) { setError('Veuillez sélectionner une matière'); return }
    setSaving(true); setError('')
    try {
      await api.post('/schedule', { ...form, class_id: classId })
      onSaved()
      onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erreur lors de l\'ajout'
      setError(msg)
      showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Ajouter un créneau</DialogTitle>
      <DialogContent>
        {error && <Typography color="error" variant="caption" display="block" mb={1}>{error}</Typography>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Matière</InputLabel>
              <Select value={form.subject_id} onChange={e => set('subject_id', e.target.value)} label="Matière">
                {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Jour</InputLabel>
              <Select value={form.day_of_week} onChange={e => set('day_of_week', e.target.value)} label="Jour">
                {DAYS.slice(1).map((d, i) => <MenuItem key={i + 1} value={i + 1}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="Début" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} size="small" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Fin" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} size="small" InputLabelProps={{ shrink: true }} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={18} /> : 'Ajouter'}</Button>
      </DialogActions>
    </Dialog>
  )
}
