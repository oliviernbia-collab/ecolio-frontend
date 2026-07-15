import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Tooltip, Tabs, Tab
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faPlus, faPenToSquare, faTrash, faBus, faUtensils, faPause, faCircleStop, faPlay } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { SchoolService, ServiceSubscription, Student } from '../../types'
import { useToast } from '../../contexts/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SkeletonTable from '../../components/ui/SkeletonTable'
import EmptyState from '../../components/ui/EmptyState'

const TYPE_LABELS = { cantine: 'Cantine', transport: 'Transport' } as const

function ServiceForm({ open, onClose, service, onSaved }: { open: boolean; onClose: () => void; service: SchoolService | null; onSaved: () => void }) {
  const { showToast } = useToast()
  const empty = { type: 'cantine', name: '', description: '', price: '' }
  const [form, setForm] = useState<any>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(service ? { type: service.type, name: service.name, description: service.description || '', price: service.price } : empty)
    setError('')
  }, [service, open])
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim() || form.price === '') { setError('Nom et prix sont requis'); return }
    setSaving(true); setError('')
    try {
      if (service) await api.put(`/services/${service.id}`, form)
      else         await api.post('/services', form)
      showToast(service ? 'Service modifié' : 'Service ajouté', 'success')
      onSaved(); onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erreur lors de la sauvegarde'
      setError(msg); showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{service ? 'Modifier le service' : 'Ajouter un service'}</DialogTitle>
      <DialogContent>
        {error && <Box sx={{ color: 'error.main', mb: 2, p: 1.5, bgcolor: '#fff5f5', borderRadius: 1, border: '1px solid #fecaca', fontSize: '0.85rem' }}>{error}</Box>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" disabled={!!service}>
              <InputLabel>Type</InputLabel>
              <Select value={form.type} onChange={e => set('type', e.target.value)} label="Type">
                <MenuItem value="cantine">Cantine</MenuItem>
                <MenuItem value="transport">Transport</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Prix (FCFA) *" type="number" value={form.price} onChange={e => set('price', e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Nom *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex : Cantine mensuelle, Transport zone A" /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : service ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function SubscriptionForm({ open, onClose, services, students, onSaved }: {
  open: boolean; onClose: () => void; services: SchoolService[]; students: Student[]; onSaved: () => void
}) {
  const { showToast } = useToast()
  const empty = { service_id: '', student_id: '', start_date: new Date().toISOString().split('T')[0], notes: '' }
  const [form, setForm] = useState<any>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (open) { setForm(empty); setError('') } }, [open])
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.service_id || !form.student_id || !form.start_date) { setError('Tous les champs sont requis'); return }
    setSaving(true); setError('')
    try {
      await api.post('/services/subscriptions', form)
      showToast('Abonnement créé', 'success')
      onSaved(); onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erreur lors de la sauvegarde'
      setError(msg); showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nouvel abonnement</DialogTitle>
      <DialogContent>
        {error && <Box sx={{ color: 'error.main', mb: 2, p: 1.5, bgcolor: '#fff5f5', borderRadius: 1, border: '1px solid #fecaca', fontSize: '0.85rem' }}>{error}</Box>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Service</InputLabel>
              <Select value={form.service_id} onChange={e => set('service_id', e.target.value)} label="Service">
                {services.map(s => <MenuItem key={s.id} value={s.id}>{TYPE_LABELS[s.type]} — {s.name} ({Number(s.price).toLocaleString('fr-FR')} FCFA)</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Élève</InputLabel>
              <Select value={form.student_id} onChange={e => set('student_id', e.target.value)} label="Élève">
                {students.map(s => <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.matricule})</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Date de début" type="date" value={form.start_date}
              onChange={e => set('start_date', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const SUB_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  active:    { label: 'Actif',    bg: '#dcfce7', color: '#16a34a' },
  suspendu:  { label: 'Suspendu', bg: '#fef9c3', color: '#854d0e' },
  termine:   { label: 'Terminé',  bg: '#f1f5f9', color: '#64748b' },
}

export default function Services() {
  const { showToast } = useToast()
  const [tab, setTab] = useState(0)
  const [services, setServices] = useState<SchoolService[]>([])
  const [subs, setSubs] = useState<ServiceSubscription[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceFormOpen, setServiceFormOpen] = useState(false)
  const [subFormOpen, setSubFormOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<SchoolService | null>(null)
  const [toDelete, setToDelete] = useState<SchoolService | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [sv, sub, st] = await Promise.all([api.get('/services'), api.get('/services/subscriptions'), api.get('/students')])
      setServices(sv.data.data); setSubs(sub.data.data); setStudents(st.data.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/services/${toDelete.id}`)
      showToast('Service supprimé', 'success'); load()
    } catch { showToast('Erreur lors de la suppression', 'error') }
    finally { setDeleting(false); setToDelete(null) }
  }

  const setSubStatus = async (sub: ServiceSubscription, status: string) => {
    try {
      await api.put(`/services/subscriptions/${sub.id}`, { status, end_date: status === 'termine' ? new Date().toISOString().split('T')[0] : null })
      showToast('Abonnement mis à jour', 'success'); load()
    } catch { showToast('Erreur', 'error') }
  }

  const cantineServices = useMemo(() => services.filter(s => s.type === 'cantine'), [services])
  const transportServices = useMemo(() => services.filter(s => s.type === 'transport'), [services])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Cantine & Transport</Typography>
          <Typography variant="body2" color="text.secondary">{services.length} service(s) · {subs.filter(s => s.status === 'active').length} abonnement(s) actif(s)</Typography>
        </Box>
        {tab === 0 ? (
          <Button variant="contained" startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
            onClick={() => { setSelectedService(null); setServiceFormOpen(true) }}>Ajouter un service</Button>
        ) : (
          <Button variant="contained" startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
            onClick={() => setSubFormOpen(true)}>Nouvel abonnement</Button>
        )}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Services" />
        <Tab label="Abonnements" />
      </Tabs>

      {tab === 0 ? (
        <Card>
          {loading ? <SkeletonTable columns={4} rows={5} /> : services.length === 0 ? (
            <EmptyState icon={faUtensils} title="Aucun service" subtitle="Ajoutez un service de cantine ou de transport."
              actionLabel="Ajouter un service" onAction={() => { setSelectedService(null); setServiceFormOpen(true) }} />
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 480 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell align="right">Prix</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...cantineServices, ...transportServices].map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Chip icon={<FontAwesomeIcon icon={s.type === 'cantine' ? faUtensils : faBus} style={{ fontSize: '0.7rem' }} />}
                          label={TYPE_LABELS[s.type]} size="small" />
                      </TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell align="right">{Number(s.price).toLocaleString('fr-FR')} FCFA</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Modifier"><IconButton size="small" onClick={() => { setSelectedService(s); setServiceFormOpen(true) }}>
                          <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '0.8rem' }} /></IconButton></Tooltip>
                        <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => setToDelete(s)}>
                          <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.8rem' }} /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      ) : (
        <Card>
          {loading ? <SkeletonTable columns={5} rows={5} /> : subs.length === 0 ? (
            <EmptyState icon={faBus} title="Aucun abonnement" subtitle="Créez un abonnement depuis le bouton ci-dessus." />
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Élève</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell className="hide-xs">Depuis le</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subs.map(s => {
                    const st = SUB_STATUS[s.status]
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{s.student_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.class_name}</Typography>
                        </TableCell>
                        <TableCell>{s.service_name}</TableCell>
                        <TableCell className="hide-xs">{s.start_date?.split('T')[0]}</TableCell>
                        <TableCell><Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 600 }} /></TableCell>
                        <TableCell align="right">
                          {s.status === 'active' && (
                            <>
                              <Tooltip title="Suspendre"><IconButton size="small" onClick={() => setSubStatus(s, 'suspendu')}>
                                <FontAwesomeIcon icon={faPause} style={{ fontSize: '0.75rem', color: '#d97706' }} /></IconButton></Tooltip>
                              <Tooltip title="Terminer"><IconButton size="small" onClick={() => setSubStatus(s, 'termine')}>
                                <FontAwesomeIcon icon={faCircleStop} style={{ fontSize: '0.75rem' }} /></IconButton></Tooltip>
                            </>
                          )}
                          {s.status === 'suspendu' && (
                            <Tooltip title="Réactiver"><IconButton size="small" color="success" onClick={() => setSubStatus(s, 'active')}>
                              <FontAwesomeIcon icon={faPlay} style={{ fontSize: '0.75rem' }} /></IconButton></Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      <ServiceForm open={serviceFormOpen} onClose={() => setServiceFormOpen(false)} service={selectedService} onSaved={load} />
      <SubscriptionForm open={subFormOpen} onClose={() => setSubFormOpen(false)} services={services} students={students} onSaved={load} />
      <ConfirmDialog open={!!toDelete} title="Supprimer le service"
        message={`Supprimer "${toDelete?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer" variant="danger" loading={deleting}
        onConfirm={handleDelete} onCancel={() => setToDelete(null)} />
    </Box>
  )
}
