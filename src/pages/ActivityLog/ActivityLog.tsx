import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, Typography, TextField, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Grid, MenuItem, Select,
  FormControl, InputLabel
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faMagnifyingGlass, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { ActivityLog as ActivityLogRow } from '../../types'
import SkeletonTable from '../../components/ui/SkeletonTable'
import EmptyState from '../../components/ui/EmptyState'
import DataTablePagination from '../../components/ui/DataTablePagination'

const ACTION_META: Record<string, { label: string; bg: string; color: string }> = {
  login:            { label: 'Connexion',            bg: '#dcfce7', color: '#16a34a' },
  login_failed:     { label: 'Connexion échouée',    bg: '#fee2e2', color: '#dc2626' },
  logout:           { label: 'Déconnexion',          bg: '#f1f5f9', color: '#64748b' },
  password_change:  { label: 'Mot de passe',         bg: '#e0f2fe', color: '#0369a1' },
  create:           { label: 'Création',             bg: '#dbeafe', color: '#1e40af' },
  update:           { label: 'Modification',         bg: '#fef3c7', color: '#b45309' },
  delete:           { label: 'Suppression',          bg: '#fee2e2', color: '#dc2626' },
  pay:              { label: 'Paiement',             bg: '#dcfce7', color: '#16a34a' },
  cancel:           { label: 'Annulation',           bg: '#fee2e2', color: '#dc2626' },
  status_change:    { label: 'Changement de statut', bg: '#ede9fe', color: '#7c3aed' },
  send:             { label: 'Envoi',                bg: '#dbeafe', color: '#1e40af' },
  approve:          { label: 'Paiement validé',      bg: '#dcfce7', color: '#16a34a' },
  reject:           { label: 'Paiement rejeté',      bg: '#fee2e2', color: '#dc2626' },
}

const ENTITY_LABELS: Record<string, string> = {
  auth: 'Compte', student: 'Élève', staff: 'Personnel', class: 'Classe', grade: 'Note',
  invoice: 'Facture', payroll: 'Paye', message: 'Message', sms: 'SMS', school: 'École',
  subscription_payment: 'Paiement abonnement', top_student: "Tableau d'honneur",
}

function ActionChip({ action }: { action: string }) {
  const meta = ACTION_META[action] || { label: action, bg: '#f1f5f9', color: '#64748b' }
  return <Chip label={meta.label} size="small" sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600 }} />
}

interface Props {
  platform?: boolean
}

export function ActivityLogTable({ platform = false }: Props) {
  const [rows, setRows] = useState<ActivityLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const load = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (action) params.action = action
      if (from) params.from = from
      if (to) params.to = to
      const r = await api.get(platform ? '/admin/activity-logs' : '/activity-logs', { params })
      setRows(r.data.data)
    } finally { setLoading(false) }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); setPage(0) }, [action, from, to])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      (r.user_name || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.school_name || '').toLowerCase().includes(q)
    )
  }, [rows, search])

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={5} md={4}>
              <TextField fullWidth placeholder="Rechercher un utilisateur, une action…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }} size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '0.85rem', color: '#9ca3af' }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Type d'action</InputLabel>
                <Select value={action} label="Type d'action" onChange={e => setAction(e.target.value)}>
                  <MenuItem value="">Toutes</MenuItem>
                  {Object.entries(ACTION_META).map(([code, m]) => <MenuItem key={code} value={code}>{m.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2} md={2.5}>
              <TextField fullWidth size="small" type="date" label="Du" value={from}
                onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} sm={2} md={2.5}>
              <TextField fullWidth size="small" type="date" label="Au" value={to}
                onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Card>
        {loading ? <SkeletonTable columns={platform ? 5 : 4} rows={8} /> : filtered.length === 0 ? (
          <EmptyState icon={faClockRotateLeft} title="Aucune activité"
            subtitle="Aucune entrée ne correspond à ces critères." />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    {platform && <TableCell>École</TableCell>}
                    <TableCell>Utilisateur</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Détail</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Typography variant="body2" noWrap>{new Date(r.created_at).toLocaleDateString('fr-FR')}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(r.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Typography>
                      </TableCell>
                      {platform && (
                        <TableCell>
                          <Typography variant="body2">{r.school_name || <em style={{ color: '#9ca3af' }}>Plateforme</em>}</Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{r.user_name || '—'}</Typography>
                        {r.user_role && <Typography variant="caption" color="text.secondary">{r.user_role}</Typography>}
                      </TableCell>
                      <TableCell><ActionChip action={r.action} /></TableCell>
                      <TableCell>
                        <Typography variant="body2">{r.description || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{ENTITY_LABELS[r.entity_type] || r.entity_type}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
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

export default function ActivityLog() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Journal d'activité</Typography>
        <Typography variant="body2" color="text.secondary">
          Historique des connexions et des actions effectuées par le personnel de votre école.
        </Typography>
      </Box>
      <ActivityLogTable />
    </Box>
  )
}
