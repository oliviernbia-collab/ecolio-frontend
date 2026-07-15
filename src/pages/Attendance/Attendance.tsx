import { useState, useEffect } from 'react'
import {
  Box, Card, Typography, Button, Grid, MenuItem, Select, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, CircularProgress, ToggleButton, ToggleButtonGroup, TextField, LinearProgress
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faCircleCheck, faCircleXmark, faClock, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { Class } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'

const STATUS_CONFIG = {
  present: { label: 'Présent', color: '#16a34a', bg: '#dcfce7', icon: <FontAwesomeIcon icon={faCircleCheck}  style={{ fontSize: '0.85rem' }} /> },
  absent:  { label: 'Absent',  color: '#dc2626', bg: '#fee2e2', icon: <FontAwesomeIcon icon={faCircleXmark}  style={{ fontSize: '0.85rem' }} /> },
  retard:  { label: 'Retard',  color: '#d97706', bg: '#fef3c7', icon: <FontAwesomeIcon icon={faClock}        style={{ fontSize: '0.85rem' }} /> },
}

interface StudentRow {
  id: number
  first_name: string
  last_name: string
  matricule: string
  attendance: { status: string; justified: boolean }
}

export default function Attendance() {
  const { showToast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [statusMap, setStatusMap] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.data)).catch(() => {})
  }, [])

  const loadAttendance = async () => {
    if (!classId) return
    setLoading(true)
    try {
      const r = await api.get(`/attendance/class/${classId}`, { params: { date } })
      setStudents(r.data.data)
      const map: Record<number, string> = {}
      for (const s of r.data.data) map[s.id] = s.attendance?.status || 'present'
      setStatusMap(map)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAttendance() }, [classId, date])

  const setStatus = (studentId: number, status: string) => {
    setStatusMap(m => ({ ...m, [studentId]: status }))
  }

  const markAll = (status: string) => {
    const map: Record<number, string> = {}
    for (const s of students) map[s.id] = status
    setStatusMap(map)
  }

  const handleSave = async () => {
    if (!classId || !students.length) {
      showToast('Sélectionnez une classe avec des élèves', 'warning')
      return
    }
    setSaving(true)
    try {
      const records = students.map(s => ({ student_id: s.id, status: statusMap[s.id] || 'present' }))
      await api.post('/attendance/bulk', { class_id: parseInt(classId), date, records })
      showToast('Appel enregistré avec succès !', 'success')
    } catch {
      showToast("Erreur lors de l'enregistrement", 'error')
    } finally { setSaving(false) }
  }

  const stats = {
    present: Object.values(statusMap).filter(s => s === 'present').length,
    absent:  Object.values(statusMap).filter(s => s === 'absent').length,
    retard:  Object.values(statusMap).filter(s => s === 'retard').length,
  }
  const total = students.length
  const attendanceRate = total > 0 ? Math.round((stats.present / total) * 100) : 0

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Présences & Absences</Typography>
          <Typography variant="body2" color="text.secondary">Appel numérique</Typography>
        </Box>
        <Button variant="contained"
          startIcon={<FontAwesomeIcon icon={faFloppyDisk} style={{ fontSize: '0.85rem' }} />}
          onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : "Enregistrer l'appel"}
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            <InputLabel>Classe</InputLabel>
            <Select value={classId} onChange={e => setClassId(e.target.value)} label="Classe">
              <MenuItem value="">Sélectionner</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField type="date" label="Date" value={date} onChange={e => setDate(e.target.value)}
            size="small" InputLabelProps={{ shrink: true }} sx={{ minWidth: { xs: '100%', sm: 'auto' } }} />
          {students.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, ml: { sm: 'auto' }, flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined"
                sx={{ color: '#16a34a', borderColor: '#16a34a', '&:hover': { bgcolor: '#dcfce7', borderColor: '#16a34a' } }}
                onClick={() => markAll('present')}>Tous présents</Button>
              <Button size="small" variant="outlined"
                sx={{ color: '#dc2626', borderColor: '#dc2626', '&:hover': { bgcolor: '#fee2e2', borderColor: '#dc2626' } }}
                onClick={() => markAll('absent')}>Tous absents</Button>
            </Box>
          )}
        </Box>
      </Card>

      {/* Stats cards */}
      {students.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 2 }} className="stagger">
          {[
            { label: 'Présents',      value: stats.present,        color: '#16a34a', bg: '#dcfce7' },
            { label: 'Absents',       value: stats.absent,         color: '#dc2626', bg: '#fee2e2' },
            { label: 'Retards',       value: stats.retard,         color: '#d97706', bg: '#fef3c7' },
            { label: 'Taux présence', value: `${attendanceRate}%`, color: ECOLIO_NAVY, bg: '#f0f4ff' },
          ].map(s => (
            <Grid item xs={6} sm={3} key={s.label} className="animate-fade-in-up">
              <Card sx={{ p: 2, bgcolor: s.bg, boxShadow: 'none', border: 'none' }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: s.color, opacity: 0.8 }}>{s.label}</Typography>
                {s.label === 'Taux présence' && (
                  <LinearProgress variant="determinate" value={attendanceRate}
                    sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.08)', '& .MuiLinearProgress-bar': { bgcolor: ECOLIO_NAVY } }} />
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Table */}
      <Card>
        {loading ? (
          <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>
        ) : !classId ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>Sélectionnez une classe pour faire l'appel</Typography>
          </Box>
        ) : students.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>Aucun élève dans cette classe</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }}>#</TableCell>
                  <TableCell>Élève</TableCell>
                  <TableCell className="hide-xs">Matricule</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s, idx) => {
                  const status = statusMap[s.id] || 'present'
                  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
                  return (
                    <TableRow key={s.id} sx={{ bgcolor: `${cfg.bg}30`, transition: 'background-color 0.2s ease' }}>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: '0.7rem', bgcolor: ECOLIO_NAVY, display: { xs: 'none', sm: 'flex' } }}>
                            {s.first_name[0]}{s.last_name[0]}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{s.first_name} {s.last_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell className="hide-xs">
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: ECOLIO_BLUE }}>{s.matricule}</Typography>
                      </TableCell>
                      <TableCell>
                        <ToggleButtonGroup exclusive value={status} onChange={(_, v) => v && setStatus(s.id, v)} size="small">
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <ToggleButton key={k} value={k}
                              sx={{
                                px: { xs: 0.8, sm: 1.5 },
                                py: 0.5,
                                minWidth: { xs: 34, sm: 'auto' },
                                fontSize: { xs: '0', sm: '0.72rem' },
                                gap: { xs: 0, sm: 0.5 },
                                '&.Mui-selected': { bgcolor: v.bg, color: v.color, borderColor: `${v.color}60` },
                                '&.Mui-selected:hover': { bgcolor: v.bg },
                              }}>
                              {v.icon}
                              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{v.label}</Box>
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  )
}
