import { useState, useEffect } from 'react'
import {
  Card, CardContent, Typography, Box, CircularProgress, Alert, Chip, Grid
} from '@mui/material'
import { FontAwesomeIcon } from '../../../lib/icons'
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons'
import api from '../../../lib/axios'
import { ScheduleEntry } from '../../../types'
import { usePortalChild } from '../../../contexts/PortalChildContext'
import ChildSelector from './ChildSelector'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const COLORS = ['#1A3C5E', '#2E86AB', '#2ecc71', '#f39c12', '#9b59b6', '#e74c3c', '#1abc9c']

export default function ParentSchedule() {
  const { selectedChild } = usePortalChild()
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedChild) return
    setLoading(true)
    api.get(`/portal/parent/children/${selectedChild}/schedule`)
      .then(r => setEntries(r.data.data))
      .finally(() => setLoading(false))
  }, [selectedChild])

  const byDay = DAYS.reduce((acc, _, i) => {
    acc[i + 1] = entries.filter(e => e.day_of_week === i + 1)
    return acc
  }, {} as Record<number, ScheduleEntry[]>)

  const subjectColorMap = [...new Set(entries.map(e => e.subject_name))].reduce((acc, name, i) => {
    acc[name ?? ''] = COLORS[i % COLORS.length]
    return acc
  }, {} as Record<string, string>)

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        <FontAwesomeIcon icon={faCalendarDays} style={{ marginRight: 10, color: '#1A3C5E' }} />
        Emploi du temps
      </Typography>

      <ChildSelector />

      {!selectedChild ? (
        <Alert severity="info">Sélectionnez un enfant pour voir son emploi du temps.</Alert>
      ) : loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : entries.length === 0 ? (
        <Card><CardContent><Typography color="text.secondary">Aucun cours planifié</Typography></CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {DAYS.map((day, i) => {
            const dayEntries = byDay[i + 1] ?? []
            if (dayEntries.length === 0) return null
            return (
              <Grid item xs={12} sm={6} md={4} key={day}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography fontWeight={700} mb={1.5} sx={{ color: '#1A3C5E', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: 1 }}>
                      {day}
                    </Typography>
                    {dayEntries.map((e, j) => {
                      const color = subjectColorMap[e.subject_name ?? ''] ?? '#1A3C5E'
                      return (
                        <Box key={j} sx={{ mb: 1.5, pl: 1.5, borderLeft: `3px solid ${color}`, py: 0.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography fontWeight={600} fontSize="0.9rem">{e.subject_name}</Typography>
                            <Chip
                              label={`${e.start_time?.slice(0,5)} – ${e.end_time?.slice(0,5)}`}
                              size="small"
                              sx={{ bgcolor: `${color}18`, color, fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </Box>
                          {e.teacher_name && (
                            <Typography fontSize="0.78rem" color="text.secondary">{e.teacher_name}</Typography>
                          )}
                        </Box>
                      )
                    })}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Box>
  )
}
