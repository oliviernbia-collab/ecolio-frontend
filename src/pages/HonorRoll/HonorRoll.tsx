import { useState, useEffect, useMemo } from 'react'
import { Box, Container, Typography, Card, Avatar, Grid, Select, MenuItem, FormControl, InputLabel, CircularProgress, Chip } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faTrophy, faLocationDot, faMedal } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { PublicTopStudent } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import SiteHeader from '../../components/Site/SiteHeader'
import SiteFooter from '../../components/Site/SiteFooter'

const PERIODS = [
  { value: '', label: 'Tous les trimestres' },
  { value: 'trimestre1', label: '1er Trimestre' },
  { value: 'trimestre2', label: '2ème Trimestre' },
  { value: 'trimestre3', label: '3ème Trimestre' },
]

const CYCLE_ORDER = ['maternelle', 'primaire', 'secondaire']
const CYCLE_LABELS: Record<string, string> = { maternelle: 'Maternelle', primaire: 'Primaire', secondaire: 'Secondaire' }
const PERIOD_LABELS: Record<string, string> = { trimestre1: '1er trimestre', trimestre2: '2ème trimestre', trimestre3: '3ème trimestre' }

export default function HonorRoll() {
  const [years, setYears] = useState<string[]>([])
  const [year, setYear] = useState('')
  const [period, setPeriod] = useState('')
  const [entries, setEntries] = useState<PublicTopStudent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/public/top-students/years').then(r => {
      setYears(r.data.data)
      if (r.data.data.length) setYear(r.data.data[0])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (year) params.academic_year_name = year
    if (period) params.period = period
    api.get('/public/top-students', { params })
      .then(r => setEntries(r.data.data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [year, period])

  const bySchool = useMemo(() => {
    const map = new Map<number, { school: PublicTopStudent; items: PublicTopStudent[] }>()
    for (const e of entries) {
      if (!map.has(e.school_id)) map.set(e.school_id, { school: e, items: [] })
      map.get(e.school_id)!.items.push(e)
    }
    return Array.from(map.values()).map(g => ({
      ...g,
      items: g.items.sort((a, b) => CYCLE_ORDER.indexOf(a.cycle) - CYCLE_ORDER.indexOf(b.cycle) || a.level.localeCompare(b.level)),
    }))
  }, [entries])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafbfc' }}>
      <SiteHeader />

      <Box sx={{ background: `linear-gradient(135deg, ${ECOLIO_NAVY} 0%, ${ECOLIO_BLUE} 100%)`, color: 'white', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <FontAwesomeIcon icon={faTrophy} style={{ fontSize: '1.6rem', color: '#facc15' }} />
            <Typography variant="h4" fontWeight={800}>Tableau d'honneur</Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 560 }}>
            Les meilleurs élèves de chaque niveau, dans les écoles utilisant Écolio.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Année scolaire</InputLabel>
            <Select value={year} label="Année scolaire" onChange={e => setYear(e.target.value)}>
              {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Trimestre</InputLabel>
            <Select value={period} label="Trimestre" onChange={e => setPeriod(e.target.value)}>
              {PERIODS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : bySchool.length === 0 ? (
          <Card sx={{ p: 5, textAlign: 'center', border: '1px dashed #e2e8f0' }}>
            <Typography variant="body1" color="text.secondary">Aucun tableau d'honneur publié pour ces critères.</Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {bySchool.map(({ school, items }) => (
              <Grid item xs={12} md={6} key={school.school_id} className="animate-fade-in-up">
                <Card sx={{ height: '100%' }}>
                  <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #eef0f4' }}>
                    <Avatar src={school.school_logo} sx={{ bgcolor: school.primary_color || ECOLIO_NAVY, width: 44, height: 44 }}>
                      {school.school_name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>{school.school_name}</Typography>
                      {school.school_city && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: '0.7rem' }} />{school.school_city}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {items.map(e => (
                      <Box key={e.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.2, bgcolor: '#f8f9fc', borderRadius: 2 }}>
                        <FontAwesomeIcon icon={faMedal} style={{ fontSize: '1.1rem', color: '#d97706', flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{e.student_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {e.level} · {CYCLE_LABELS[e.cycle]} · {PERIOD_LABELS[e.period] || e.period}
                          </Typography>
                        </Box>
                        {e.average != null && (
                          <Typography variant="body2" fontWeight={700} sx={{ color: ECOLIO_BLUE, flexShrink: 0 }}>{e.average}/20</Typography>
                        )}
                        {e.mention && <Chip label={e.mention} size="small" sx={{ bgcolor: '#fef3c7', color: '#b45309', flexShrink: 0 }} />}
                      </Box>
                    ))}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <SiteFooter />
    </Box>
  )
}
