import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, Typography, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, Grid, MenuItem, Select, FormControl, InputLabel,
  InputAdornment
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faMagnifyingGlass, faUsersGear } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { ECOLIO_NAVY } from '../../theme'
import SkeletonTable from '../../components/ui/SkeletonTable'
import EmptyState from '../../components/ui/EmptyState'
import DataTablePagination from '../../components/ui/DataTablePagination'

interface PlatformUser {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  phone?: string
  is_active: number | boolean
  last_login: string | null
  created_at: string
  school_id: number | null
  school_name: string | null
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super-admin', director: 'Directeur', teacher: 'Enseignant(e)',
  parent: 'Parent', student: 'Élève', accountant: 'Comptable', counselor: "Conseiller d'éducation",
  librarian: 'Bibliothécaire', nurse: 'Infirmier(e)', maintenance: 'Maintenance', secretary: 'Secrétaire',
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: '#ede9fe', color: '#7c3aed' },
  director:    { bg: '#dbeafe', color: '#1e40af' },
  teacher:     { bg: '#dcfce7', color: '#16a34a' },
  parent:      { bg: '#fce7f3', color: '#be185d' },
  student:     { bg: '#e0f2fe', color: '#0369a1' },
  accountant:  { bg: '#fef3c7', color: '#b45309' },
}
const DEFAULT_ROLE_COLOR = { bg: '#f1f5f9', color: '#64748b' }

export default function PlatformUsers() {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const load = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (role) params.role = role
      if (from) params.from = from
      if (to) params.to = to
      const r = await api.get('/admin/users', { params })
      setUsers(r.data.data)
    } finally { setLoading(false) }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); setPage(0) }, [role, from, to])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(u =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.school_name || '').toLowerCase().includes(q)
    )
  }, [users, search])

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Utilisateurs</Typography>
        <Typography variant="body2" color="text.secondary">
          {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''} sur l'ensemble des écoles.
        </Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={5} md={4}>
              <TextField fullWidth size="small" placeholder="Rechercher un nom, un email, une école…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
                InputProps={{ startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '0.85rem', color: '#9ca3af' }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Rôle</InputLabel>
                <Select value={role} label="Rôle" onChange={e => setRole(e.target.value)}>
                  <MenuItem value="">Tous</MenuItem>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2} md={2.5}>
              <TextField fullWidth size="small" type="date" label="Inscrit du" value={from}
                onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} sm={2} md={2.5}>
              <TextField fullWidth size="small" type="date" label="au" value={to}
                onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Card>
        {loading ? <SkeletonTable columns={6} rows={8} hasAvatar /> : filtered.length === 0 ? (
          <EmptyState icon={faUsersGear} title="Aucun utilisateur" subtitle="Aucun utilisateur ne correspond à ces critères." />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Utilisateur</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell className="hide-xs">École</TableCell>
                    <TableCell className="hide-xs">Téléphone</TableCell>
                    <TableCell align="center">Statut</TableCell>
                    <TableCell className="hide-xs">Inscrit le</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map(u => {
                    const rc = ROLE_COLORS[u.role] || DEFAULT_ROLE_COLOR
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, fontSize: '0.75rem', bgcolor: ECOLIO_NAVY }}>
                              {u.first_name[0]}{u.last_name[0]}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap>{u.first_name} {u.last_name}</Typography>
                              <Typography variant="caption" color="text.secondary" noWrap display="block">{u.email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={ROLE_LABELS[u.role] || u.role} size="small" sx={{ bgcolor: rc.bg, color: rc.color, fontWeight: 600 }} />
                        </TableCell>
                        <TableCell className="hide-xs">{u.school_name || <em style={{ color: '#9ca3af' }}>Plateforme</em>}</TableCell>
                        <TableCell className="hide-xs">{u.phone || '—'}</TableCell>
                        <TableCell align="center">
                          {Number(u.is_active) ? (
                            <Chip label="Actif" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 600 }} />
                          ) : (
                            <Chip label="Inactif" size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 600 }} />
                          )}
                        </TableCell>
                        <TableCell className="hide-xs">
                          <Typography variant="body2">{new Date(u.created_at).toLocaleDateString('fr-FR')}</Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <DataTablePagination total={filtered.length} page={page} rowsPerPage={rowsPerPage}
              onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />
          </>
        )}
      </Card>
    </Box>
  )
}
