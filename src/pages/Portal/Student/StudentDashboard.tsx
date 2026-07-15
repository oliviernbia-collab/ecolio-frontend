import { useState, useEffect } from 'react'
import {
  Grid, Card, CardContent, Typography, Box, Avatar, Chip, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, LinearProgress
} from '@mui/material'
import { FontAwesomeIcon } from '../../../lib/icons'
import {
  faBookOpen, faCalendarCheck, faCircleCheck, faCircleXmark,
  faClockRotateLeft, faGraduationCap
} from '@fortawesome/free-solid-svg-icons'
import api from '../../../lib/axios'
import { useAuth } from '../../../contexts/AuthContext'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface StudentInfo {
  id: number; first_name: string; last_name: string; matricule: string
  class_name: string; cycle: string; teacher_name: string; photo_url?: string
}

interface GradeRow {
  subject_name: string; value: number; max_value: number
  period: string; grade_type: string; created_at: string
}

interface AttendanceRow {
  date: string; status: string; justified: boolean
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [grades, setGrades] = useState<GradeRow[]>([])
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/portal/student/me'),
      api.get('/portal/student/grades'),
      api.get('/portal/student/attendance'),
    ]).then(([s, g, a]) => {
      setStudent(s.data.data)
      setGrades(g.data.data)
      setAttendance(a.data.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>

  const recentGrades = grades.slice(0, 5)
  const absences = attendance.filter(a => a.status === 'absent')
  const presenceRate = attendance.length > 0
    ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
    : 100

  const subjectAverages = Object.values(
    grades.reduce((acc, g) => {
      if (!acc[g.subject_name]) acc[g.subject_name] = { name: g.subject_name, total: 0, count: 0, max: g.max_value }
      acc[g.subject_name].total += g.value
      acc[g.subject_name].count++
      return acc
    }, {} as Record<string, { name: string; total: number; count: number; max: number }>)
  ).map(s => ({ ...s, avg: s.total / s.count })).sort((a, b) => b.avg - a.avg)

  const generalAvg = subjectAverages.length
    ? subjectAverages.reduce((s, x) => s + x.avg, 0) / subjectAverages.length : null

  const statusColor = (s: string) =>
    s === 'present' ? '#2ecc71' : s === 'absent' ? '#e74c3c' : s === 'retard' ? '#f39c12' : '#6b7280'
  const statusLabel = (s: string) =>
    ({ present: 'Présent', absent: 'Absent', retard: 'Retard', sortie_anticipee: 'Sortie anticipée' }[s] ?? s)

  return (
    <Box>
      {/* En-tête élève */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
          <Avatar
            src={student?.photo_url}
            sx={{ width: 64, height: 64, bgcolor: '#1A3C5E', fontSize: '1.5rem' }}
          >
            {student?.first_name?.[0]}{student?.last_name?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {student?.first_name} {student?.last_name}
            </Typography>
            <Typography color="text.secondary" fontSize="0.9rem">
              Matricule : {student?.matricule}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              {student?.class_name && <Chip label={student.class_name} size="small" sx={{ bgcolor: '#e8f0fe', color: '#1A3C5E', fontWeight: 600 }} />}
              {student?.cycle && <Chip label={student.cycle} size="small" variant="outlined" />}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Moyenne générale', value: generalAvg != null ? `${generalAvg.toFixed(1)}/20` : '—', icon: faGraduationCap, color: '#1A3C5E' },
          { label: 'Taux de présence', value: `${presenceRate}%`, icon: faCalendarCheck, color: '#2ecc71' },
          { label: 'Absences', value: absences.length, icon: faCircleXmark, color: '#e74c3c' },
          { label: 'Notes saisies', value: grades.length, icon: faBookOpen, color: '#2E86AB' },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: `${s.color}18`, width: 40, height: 40, mx: 'auto', mb: 1 }}>
                  <Box sx={{ color: s.color }}><FontAwesomeIcon icon={s.icon} /></Box>
                </Avatar>
                <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                <Typography fontSize="0.75rem" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Moyennes par matière */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography fontWeight={700} mb={2}>
                <FontAwesomeIcon icon={faBookOpen} style={{ marginRight: 8, color: '#1A3C5E' }} />
                Moyennes par matière
              </Typography>
              {subjectAverages.length === 0
                ? <Typography color="text.secondary" fontSize="0.9rem">Aucune note saisie</Typography>
                : subjectAverages.map(s => (
                  <Box key={s.name} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography fontSize="0.85rem" fontWeight={500}>{s.name}</Typography>
                      <Typography fontSize="0.85rem" fontWeight={700} color={s.avg >= 10 ? '#2ecc71' : '#e74c3c'}>
                        {s.avg.toFixed(1)}/20
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(s.avg / 20) * 100}
                      sx={{
                        height: 6, borderRadius: 3,
                        bgcolor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': { bgcolor: s.avg >= 10 ? '#2ecc71' : '#e74c3c', borderRadius: 3 }
                      }}
                    />
                  </Box>
                ))
              }
            </CardContent>
          </Card>
        </Grid>

        {/* Dernières présences */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography fontWeight={700} mb={2}>
                <FontAwesomeIcon icon={faClockRotateLeft} style={{ marginRight: 8, color: '#1A3C5E' }} />
                Dernières présences
              </Typography>
              {attendance.length === 0
                ? <Typography color="text.secondary" fontSize="0.9rem">Aucune donnée</Typography>
                : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Statut</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendance.slice(0, 8).map((a, i) => (
                        <TableRow key={i}>
                          <TableCell>{format(parseISO(a.date), 'dd MMM yyyy', { locale: fr })}</TableCell>
                          <TableCell>
                            <Chip
                              label={statusLabel(a.status)}
                              size="small"
                              sx={{ bgcolor: `${statusColor(a.status)}18`, color: statusColor(a.status), fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
