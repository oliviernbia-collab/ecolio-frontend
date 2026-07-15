import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Switch, CircularProgress, Grid
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faSchool, faUsers, faUserGraduate, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'

interface PlatformSchool {
  id: number
  name: string
  city?: string
  email?: string
  phone?: string
  is_public: boolean
  is_active: boolean
  created_at: string
  student_count: number
  user_count: number
  staff_count: number
}

interface PlatformStats {
  total_schools: number
  active_schools: number
  total_students: number
  total_users: number
}

export default function SuperAdmin() {
  const { showToast } = useToast()
  const [schools, setSchools] = useState<PlatformSchool[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, st] = await Promise.all([api.get('/admin/schools'), api.get('/admin/stats')])
      setSchools(s.data.data); setStats(st.data.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const toggleStatus = async (school: PlatformSchool) => {
    try {
      await api.put(`/admin/schools/${school.id}/status`, { is_active: !school.is_active })
      showToast(school.is_active ? 'École suspendue' : 'École réactivée', 'success')
      load()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur', 'error')
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>

  const cards = stats ? [
    { label: 'Écoles', value: stats.total_schools, icon: faSchool, color: ECOLIO_NAVY },
    { label: 'Écoles actives', value: stats.active_schools, icon: faCircleCheck, color: '#2ecc71' },
    { label: 'Élèves (toutes écoles)', value: stats.total_students, icon: faUserGraduate, color: ECOLIO_BLUE },
    { label: 'Utilisateurs', value: stats.total_users, icon: faUsers, color: '#d97706' },
  ] : []

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>Panneau plateforme</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Vue transversale sur toutes les écoles clientes d'Écolio.
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {cards.map(c => (
          <Grid item xs={6} sm={3} key={c.label}>
            <Card sx={{ borderTop: `4px solid ${c.color}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>{c.label}</Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: c.color, mt: 0.5 }}>{c.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>École</TableCell>
                <TableCell className="hide-xs">Ville</TableCell>
                <TableCell align="center">Élèves</TableCell>
                <TableCell align="center" className="hide-xs">Utilisateurs</TableCell>
                <TableCell align="center">Visible publiquement</TableCell>
                <TableCell align="center">Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schools.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                  </TableCell>
                  <TableCell className="hide-xs">{s.city || '—'}</TableCell>
                  <TableCell align="center">{s.student_count}</TableCell>
                  <TableCell align="center" className="hide-xs">{s.user_count}</TableCell>
                  <TableCell align="center">
                    {s.is_public
                      ? <Chip label="Publique" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a' }} />
                      : <Chip label="Privée" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b' }} />}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Switch size="small" checked={!!s.is_active} onChange={() => toggleStatus(s)} color="success" />
                      <Chip label={s.is_active ? 'Active' : 'Suspendue'} size="small"
                        sx={{ bgcolor: s.is_active ? '#dcfce7' : '#fee2e2', color: s.is_active ? '#16a34a' : '#dc2626', fontWeight: 600 }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  )
}
