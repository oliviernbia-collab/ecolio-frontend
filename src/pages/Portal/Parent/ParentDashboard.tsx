import { useState, useEffect } from 'react'
import {
  Grid, Card, CardContent, Typography, Box, CircularProgress, Avatar,
  Chip, LinearProgress, Button
} from '@mui/material'
import { FontAwesomeIcon } from '../../../lib/icons'
import {
  faGraduationCap, faBookOpen, faCalendarCheck, faCircleXmark, faArrowRight
} from '@fortawesome/free-solid-svg-icons'
import api from '../../../lib/axios'
import { useNavigate } from 'react-router-dom'
import { usePortalChild } from '../../../contexts/PortalChildContext'

interface Child {
  id: number; first_name: string; last_name: string; matricule: string
  class_name: string; cycle: string; photo_url?: string; status: string
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [childStats, setChildStats] = useState<Record<number, { avg: number | null; absences: number; rate: number }>>({})
  const navigate = useNavigate()
  const { setSelectedChild } = usePortalChild()

  useEffect(() => {
    api.get('/portal/parent/children').then(async r => {
      const list: Child[] = r.data.data
      setChildren(list)

      const stats: Record<number, { avg: number | null; absences: number; rate: number }> = {}
      await Promise.all(list.map(async child => {
        const [g, a] = await Promise.all([
          api.get(`/portal/parent/children/${child.id}/grades`),
          api.get(`/portal/parent/children/${child.id}/attendance`),
        ])
        const grades = g.data.data
        const att    = a.data.data
        const avg    = grades.length
          ? grades.reduce((s: number, x: any) => s + (x.value / x.max_value) * 20, 0) / grades.length
          : null
        const presents = att.filter((a: any) => a.status === 'present').length
        const rate = att.length > 0 ? Math.round((presents / att.length) * 100) : 100
        stats[child.id] = { avg, absences: att.filter((a: any) => a.status === 'absent').length, rate }
      }))
      setChildStats(stats)
    }).finally(() => setLoading(false))
  }, [])

  const handleViewChild = (child: Child) => {
    setSelectedChild(child.id)
    navigate('/portal/parent/grades')
  }

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>

  if (children.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <FontAwesomeIcon icon={faGraduationCap} style={{ fontSize: '3rem', color: '#ccc', marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary">Aucun enfant associé à votre compte</Typography>
          <Typography fontSize="0.9rem" color="text.secondary" mt={1}>
            Contactez l'administration de l'école pour lier vos enfants à votre compte.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: 10, color: '#1A3C5E' }} />
        Mes enfants
      </Typography>

      <Grid container spacing={3}>
        {children.map(child => {
          const stats = childStats[child.id]
          return (
            <Grid item xs={12} md={6} key={child.id}>
              <Card sx={{ height: '100%', transition: 'transform 0.18s, box-shadow 0.18s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' } }}>
                <CardContent>
                  {/* En-tête enfant */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar src={child.photo_url} sx={{ width: 52, height: 52, bgcolor: '#1A3C5E', fontSize: '1.2rem' }}>
                      {child.first_name[0]}{child.last_name[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography fontWeight={700}>{child.first_name} {child.last_name}</Typography>
                      <Typography fontSize="0.8rem" color="text.secondary">{child.matricule}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        {child.class_name && <Chip label={child.class_name} size="small" sx={{ bgcolor: '#e8f0fe', color: '#1A3C5E', fontWeight: 600, fontSize: '0.7rem' }} />}
                      </Box>
                    </Box>
                  </Box>

                  {/* Stats */}
                  {stats ? (
                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                      {[
                        { label: 'Moyenne', value: stats.avg != null ? `${stats.avg.toFixed(1)}/20` : '—', icon: faBookOpen, color: '#1A3C5E' },
                        { label: 'Présence', value: `${stats.rate}%`, icon: faCalendarCheck, color: '#2ecc71' },
                        { label: 'Absences', value: stats.absences, icon: faCircleXmark, color: '#e74c3c' },
                      ].map(s => (
                        <Grid item xs={4} key={s.label}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8f9fc', borderRadius: 2 }}>
                            <Typography fontWeight={700} fontSize="1.1rem" sx={{ color: s.color }}>{s.value}</Typography>
                            <Typography fontSize="0.7rem" color="text.secondary">{s.label}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <LinearProgress sx={{ mb: 2 }} />
                  )}

                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    endIcon={<FontAwesomeIcon icon={faArrowRight} />}
                    onClick={() => handleViewChild(child)}
                  >
                    Voir le dossier
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
