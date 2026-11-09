import { useState, useEffect } from 'react'
import {
  Card, CardContent, Typography, Box, CircularProgress, Table, TableBody,
  TableCell, TableHead, TableRow, TableContainer, Chip, MenuItem, TextField, Avatar
} from '@mui/material'
import { FontAwesomeIcon } from '../../../lib/icons'
import { faBookOpen } from '@fortawesome/free-solid-svg-icons'
import api from '../../../lib/axios'
import { Grade } from '../../../types'
import { subjectAverages, generalAverage } from '../../../lib/averages'

const PERIODS = [
  { value: '', label: 'Toutes les périodes' },
  { value: 'trimestre1', label: '1er trimestre' },
  { value: 'trimestre2', label: '2ème trimestre' },
  { value: 'trimestre3', label: '3ème trimestre' },
  { value: 'semestre1', label: '1er semestre' },
  { value: 'semestre2', label: '2ème semestre' },
]

export default function StudentGrades() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [period, setPeriod] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('/portal/student/grades', { params: period ? { period } : {} })
      .then(r => setGrades(r.data.data))
      .finally(() => setLoading(false))
  }, [period])

  const subjectList = subjectAverages(grades)
  const generalAvg = generalAverage(subjectList)

  const gradeColor = (v: number, max: number) => {
    const pct = v / max
    return pct >= 0.7 ? '#2ecc71' : pct >= 0.5 ? '#f39c12' : '#e74c3c'
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          <FontAwesomeIcon icon={faBookOpen} style={{ marginRight: 10, color: '#1A3C5E' }} />
          Mes notes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {generalAvg != null && (
            <Chip
              label={`Moyenne générale : ${generalAvg.toFixed(2)}/20`}
              sx={{ bgcolor: generalAvg >= 10 ? '#dcfce7' : '#fee2e2', color: generalAvg >= 10 ? '#15803d' : '#dc2626', fontWeight: 700 }}
            />
          )}
          <TextField select size="small" value={period} onChange={e => setPeriod(e.target.value)} SelectProps={{ displayEmpty: true }} sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            {PERIODS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
          </TextField>
        </Box>
      </Box>

      {loading
        ? <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        : subjectList.length === 0
          ? <Card><CardContent><Typography color="text.secondary">Aucune note pour cette période</Typography></CardContent></Card>
          : subjectList.map(sub => (
            <Card key={sub.name} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography fontWeight={700}>{sub.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography fontSize="0.75rem" color="text.secondary">Coeff. {sub.coeff}</Typography>
                    <Chip
                      label={`Moy. ${sub.avg.toFixed(2)}/20`}
                      size="small"
                      sx={{ bgcolor: `${sub.avg >= 10 ? '#2ecc71' : '#e74c3c'}18`, color: sub.avg >= 10 ? '#15803d' : '#dc2626', fontWeight: 700 }}
                    />
                  </Box>
                </Box>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 460 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Note</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell className="hide-xs">Période</TableCell>
                        <TableCell className="hide-xs">Commentaire</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sub.grades.map((g, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Typography fontWeight={700} sx={{ color: gradeColor(g.value, g.max_value) }}>
                              {g.value}/{g.max_value}
                            </Typography>
                          </TableCell>
                          <TableCell><Chip label={g.grade_type} size="small" /></TableCell>
                          <TableCell className="hide-xs">
                            <Typography fontSize="0.8rem" color="text.secondary">
                              {PERIODS.find(p => p.value === g.period)?.label ?? g.period}
                            </Typography>
                          </TableCell>
                          <TableCell className="hide-xs">
                            <Typography fontSize="0.8rem" color="text.secondary">{g.comment || '—'}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ))
      }
    </Box>
  )
}
