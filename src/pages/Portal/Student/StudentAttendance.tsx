import { useState, useEffect } from 'react'
import {
  Card, CardContent, Typography, Box, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Chip, LinearProgress
} from '@mui/material'
import { FontAwesomeIcon } from '../../../lib/icons'
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons'
import api from '../../../lib/axios'
import { Attendance } from '../../../types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_META: Record<string, { label: string; color: string }> = {
  present:          { label: 'Présent',          color: '#2ecc71' },
  absent:           { label: 'Absent',            color: '#e74c3c' },
  retard:           { label: 'Retard',            color: '#f39c12' },
  sortie_anticipee: { label: 'Sortie anticipée',  color: '#6b7280' },
}

export default function StudentAttendance() {
  const [data, setData] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/portal/student/attendance')
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  const total    = data.length
  const presents = data.filter(a => a.status === 'present').length
  const absences = data.filter(a => a.status === 'absent').length
  const retards  = data.filter(a => a.status === 'retard').length
  const rate     = total > 0 ? Math.round((presents / total) * 100) : 100

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        <FontAwesomeIcon icon={faClockRotateLeft} style={{ marginRight: 10, color: '#1A3C5E' }} />
        Mes présences
      </Typography>

      {/* Résumé */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography fontSize="0.8rem" color="text.secondary">Taux de présence</Typography>
              <Typography variant="h4" fontWeight={700} color={rate >= 90 ? '#2ecc71' : rate >= 75 ? '#f39c12' : '#e74c3c'}>
                {rate}%
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, sm: 3 } }}>
              {[
                { label: 'Présences', value: presents, color: '#2ecc71' },
                { label: 'Absences',  value: absences, color: '#e74c3c' },
                { label: 'Retards',   value: retards,  color: '#f39c12' },
              ].map(s => (
                <Box key={s.label} textAlign="center">
                  <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                  <Typography fontSize="0.75rem" color="text.secondary">{s.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={rate}
            sx={{
              height: 8, borderRadius: 4,
              bgcolor: '#fee2e2',
              '& .MuiLinearProgress-bar': { bgcolor: rate >= 90 ? '#2ecc71' : rate >= 75 ? '#f39c12' : '#e74c3c', borderRadius: 4 }
            }}
          />
        </CardContent>
      </Card>

      {/* Liste */}
      {loading
        ? <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        : (
          <Card>
            <CardContent sx={{ p: 0 }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 480 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell className="hide-xs">Justifiée</TableCell>
                      <TableCell className="hide-xs">Justification</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.length === 0
                      ? <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary" py={3}>Aucun enregistrement</Typography></TableCell></TableRow>
                      : data.map((a, i) => {
                        const meta = STATUS_META[a.status] ?? { label: a.status, color: '#6b7280' }
                        return (
                          <TableRow key={i}>
                            <TableCell>{format(parseISO(a.date), 'EEE dd MMM yyyy', { locale: fr })}</TableCell>
                            <TableCell>
                              <Chip label={meta.label} size="small"
                                sx={{ bgcolor: `${meta.color}18`, color: meta.color, fontWeight: 600 }} />
                            </TableCell>
                            <TableCell className="hide-xs">
                              {a.status !== 'present'
                                ? <Chip label={a.justified ? 'Oui' : 'Non'} size="small"
                                    sx={{ bgcolor: a.justified ? '#dcfce7' : '#fee2e2', color: a.justified ? '#15803d' : '#dc2626' }} />
                                : '—'}
                            </TableCell>
                            <TableCell className="hide-xs">
                              <Typography fontSize="0.8rem" color="text.secondary">
                                {a.justification || '—'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
    </Box>
  )
}
