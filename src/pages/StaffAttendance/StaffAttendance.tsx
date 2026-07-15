import { useState, useEffect } from 'react'
import {
  Box, Card, Typography, Button, Grid, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Avatar, CircularProgress, Select,
  MenuItem, FormControl, InputLabel
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faRightToBracket, faRightFromBracket, faFingerprint, faClock } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { StaffAttendanceRow } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  present: { label: 'Présent', color: '#16a34a', bg: '#dcfce7' },
  absent:  { label: 'Absent',  color: '#dc2626', bg: '#fee2e2' },
  retard:  { label: 'Retard',  color: '#d97706', bg: '#fef3c7' },
  conge:   { label: 'Congé',   color: '#64748b', bg: '#f1f5f9' },
}

export default function StaffAttendance() {
  const { user } = useAuth()
  const isAdmin = ['super_admin', 'director', 'secretary'].includes(user?.role || '')
  return isAdmin ? <AdminView /> : <SelfServiceView />
}

function SelfServiceView() {
  const { showToast } = useToast()
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/staff-attendance/mine'); setRecord(r.data.data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleCheckIn = async () => {
    setBusy(true)
    try {
      const r = await api.post('/staff-attendance/checkin')
      showToast(`Arrivée pointée à ${r.data.time?.substring(0, 5)}`, 'success')
      load()
    } catch (e: any) { showToast(e.response?.data?.message || 'Erreur', 'error') }
    finally { setBusy(false) }
  }

  const handleCheckOut = async () => {
    setBusy(true)
    try {
      const r = await api.put('/staff-attendance/checkout')
      showToast(`Départ pointé à ${r.data.time?.substring(0, 5)}`, 'success')
      load()
    } catch (e: any) { showToast(e.response?.data?.message || 'Erreur', 'error') }
    finally { setBusy(false) }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Pointage</Typography>
        <Typography variant="body2" color="text.secondary">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
      </Box>
      <Card sx={{ p: 4, textAlign: 'center', maxWidth: 480, mx: 'auto' }}>
        {loading ? <CircularProgress /> : (
          <>
            <FontAwesomeIcon icon={faFingerprint} style={{ fontSize: '3rem', color: ECOLIO_BLUE, opacity: 0.4, marginBottom: 16 }} />
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">Arrivée</Typography>
                <Typography variant="h6" fontWeight={700} color={record?.check_in_time ? '#16a34a' : 'text.disabled'}>
                  {record?.check_in_time ? record.check_in_time.substring(0, 5) : '—'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">Départ</Typography>
                <Typography variant="h6" fontWeight={700} color={record?.check_out_time ? '#16a34a' : 'text.disabled'}>
                  {record?.check_out_time ? record.check_out_time.substring(0, 5) : '—'}
                </Typography>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" size="large" disabled={busy || !!record?.check_in_time}
                startIcon={<FontAwesomeIcon icon={faRightToBracket} />} onClick={handleCheckIn}
                sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
                Pointer arrivée
              </Button>
              <Button variant="contained" size="large" disabled={busy || !record?.check_in_time || !!record?.check_out_time}
                startIcon={<FontAwesomeIcon icon={faRightFromBracket} />} onClick={handleCheckOut}
                sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>
                Pointer départ
              </Button>
            </Box>
          </>
        )}
      </Card>
    </Box>
  )
}

function AdminView() {
  const { showToast } = useToast()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [rows, setRows] = useState<StaffAttendanceRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/staff-attendance', { params: { date } }); setRows(r.data.data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [date])

  const setStatus = async (staffId: number, status: string) => {
    try {
      await api.post('/staff-attendance/bulk', { date, records: [{ staff_id: staffId, status }] })
      showToast('Pointage mis à jour', 'success')
      load()
    } catch { showToast('Erreur lors de la mise à jour', 'error') }
  }

  const stats = {
    present: rows.filter(r => r.attendance?.status === 'present' || r.attendance?.check_in_time).length,
    absent: rows.filter(r => r.attendance?.status === 'absent').length,
    notPointed: rows.filter(r => !r.attendance).length,
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Pointages du personnel</Typography>
          <Typography variant="body2" color="text.secondary">Suivi des arrivées et départs</Typography>
        </Box>
        <TextField type="date" value={date} onChange={e => setDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: 'Pointés',      value: stats.present,    color: '#16a34a', bg: '#dcfce7' },
          { label: 'Absents',      value: stats.absent,     color: '#dc2626', bg: '#fee2e2' },
          { label: 'Non pointés',  value: stats.notPointed, color: ECOLIO_NAVY, bg: '#f0f4ff' },
        ].map(s => (
          <Grid item xs={4} key={s.label}>
            <Card sx={{ p: 2, bgcolor: s.bg, boxShadow: 'none', border: 'none' }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ color: s.color, opacity: 0.8 }}>{s.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        {loading ? (
          <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}><Typography>Aucun membre du personnel</Typography></Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Employé</TableCell>
                  <TableCell className="hide-xs">Poste</TableCell>
                  <TableCell>Arrivée</TableCell>
                  <TableCell>Départ</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(r => {
                  const status = r.attendance?.status || (r.attendance ? 'present' : 'absent')
                  const cfg = STATUS_LABELS[status]
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={r.avatar_url} sx={{ width: 30, height: 30, fontSize: '0.7rem', bgcolor: ECOLIO_NAVY }}>
                            {r.first_name[0]}{r.last_name[0]}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{r.first_name} {r.last_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell className="hide-xs">{r.position || '—'}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FontAwesomeIcon icon={faClock} style={{ fontSize: '0.7rem', color: '#9ca3af' }} />
                          {r.attendance?.check_in_time ? r.attendance.check_in_time.substring(0, 5) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FontAwesomeIcon icon={faClock} style={{ fontSize: '0.7rem', color: '#9ca3af' }} />
                          {r.attendance?.check_out_time ? r.attendance.check_out_time.substring(0, 5) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" variant="standard">
                          <Select value={status} onChange={e => setStatus(r.id, e.target.value)}
                            sx={{ fontSize: '0.78rem', '&:before': { display: 'none' } }}
                            renderValue={v => <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600 }} />}>
                            {Object.entries(STATUS_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                          </Select>
                        </FormControl>
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
