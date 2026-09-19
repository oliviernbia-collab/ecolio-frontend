import { useState, useEffect } from 'react'
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, MenuItem, Select,
  FormControl, InputLabel, CircularProgress, Tooltip
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faPlus, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { StaffMember } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import CredentialsDialog, { Credential } from '../../components/ui/CredentialsDialog'
import PasswordField from '../../components/ui/PasswordField'

const roleLabels: Record<string, string> = {
  director:    'Directeur',
  teacher:     'Enseignant(e)',
  accountant:  'Comptable',
  counselor:   'Conseiller d\'éducation',
  librarian:   'Bibliothécaire',
  nurse:       'Infirmier(e)',
  maintenance: 'Maintenance',
  secretary:   'Secrétaire',
}
const contractColors: Record<string, string> = { CDI: '#dcfce7', CDD: '#fef9c3', vacataire: '#dbeafe', stagiaire: '#fce7f3' }

export default function Staff() {
  const { showToast } = useToast()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<StaffMember | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [newCredentials, setNewCredentials] = useState<Credential | null>(null)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/staff'); setStaff(r.data.data) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/staff/${deleteTarget.id}`)
      showToast(`${deleteTarget.first_name} ${deleteTarget.last_name} archivé`, 'success')
      setDeleteTarget(null)
      load()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur lors de la suppression', 'error')
    } finally { setDeleting(false) }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Personnel</Typography>
          <Typography variant="body2" color="text.secondary">{staff.length} membre(s)</Typography>
        </Box>
        <Button variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
          onClick={() => { setSelected(null); setFormOpen(true) }}>
          Ajouter
        </Button>
      </Box>

      <Card>
        {loading ? (
          <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 520 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Personne</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell className="hide-xs">Poste</TableCell>
                  <TableCell className="hide-xs">Contrat</TableCell>
                  <TableCell className="hide-xs">Date embauche</TableCell>
                  <TableCell className="hide-xs">Salaire</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>Aucun membre</TableCell></TableRow>
                ) : staff.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: ECOLIO_NAVY, fontSize: '0.75rem', display: { xs: 'none', sm: 'flex' } }}>
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{s.first_name} {s.last_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={roleLabels[s.role] || s.role} size="small" sx={{ bgcolor: '#f0f4ff', color: ECOLIO_NAVY, fontSize: '0.7rem' }} /></TableCell>
                    <TableCell className="hide-xs"><Typography variant="body2">{s.position || '—'}</Typography></TableCell>
                    <TableCell className="hide-xs"><Chip label={s.contract_type} size="small" sx={{ bgcolor: contractColors[s.contract_type] || '#f3f4f6', fontSize: '0.7rem' }} /></TableCell>
                    <TableCell className="hide-xs"><Typography variant="caption">{s.hire_date ? new Date(s.hire_date).toLocaleDateString('fr-FR') : '—'}</Typography></TableCell>
                    <TableCell className="hide-xs">
                      {s.salary ? (
                        <Typography variant="body2" fontWeight={500} color={ECOLIO_BLUE}>
                          {parseInt(String(s.salary)).toLocaleString('fr-FR')} FCFA
                        </Typography>
                      ) : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Modifier">
                          <IconButton size="small" sx={{ color: ECOLIO_BLUE }} onClick={() => { setSelected(s); setFormOpen(true) }}>
                            <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '0.85rem' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton size="small" sx={{ color: '#dc2626' }} onClick={() => setDeleteTarget(s)}>
                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.85rem' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <StaffForm open={formOpen} onClose={() => setFormOpen(false)} member={selected}
        onSaved={() => { load(); }} onCredentials={setNewCredentials} />

      <CredentialsDialog open={!!newCredentials} credentials={newCredentials ? [newCredentials] : []}
        onClose={() => setNewCredentials(null)} />

      {/* Dialog confirmation suppression */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
        fullScreen={window.innerWidth < 600}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.9rem', color: '#dc2626' }} />
          </Box>
          Supprimer le membre
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Voulez-vous vraiment archiver{' '}
            <Typography component="span" fontWeight={600} color="text.primary">
              {deleteTarget?.first_name} {deleteTarget?.last_name}
            </Typography>{' '}
            ? Son compte sera désactivé et il n'aura plus accès à l'application.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function StaffForm({ open, onClose, member, onSaved, onCredentials }: {
  open: boolean; onClose: () => void; member: StaffMember | null; onSaved: () => void
  onCredentials: (cred: Credential) => void
}) {
  const { showToast } = useToast()
  const empty = { first_name: '', last_name: '', email: '', phone: '', role: 'teacher', position: '', contract_type: 'CDI', hire_date: '', salary: '', password: '' }
  const [form, setForm] = useState<any>(empty)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  useEffect(() => {
    setForm(member ? { ...member, password: '', hire_date: member.hire_date?.split('T')[0] || '' } : empty)
  }, [member, open])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (member) {
        await api.put(`/staff/${member.id}`, form)
      } else {
        const r = await api.post('/staff', form)
        if (r.data.credentials) onCredentials({ label: 'Nouveau membre du personnel', ...r.data.credentials })
      }
      showToast(member ? 'Membre modifié avec succès' : 'Membre ajouté avec succès', 'success')
      onSaved()
      onClose()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur lors de la sauvegarde', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      fullScreen={window.innerWidth < 600}>
      <DialogTitle>{member ? 'Modifier' : 'Ajouter un membre du personnel'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Prénom *" value={form.first_name} onChange={e => set('first_name', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Nom *" value={form.last_name} onChange={e => set('last_name', e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} disabled={!!member} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Téléphone" value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Rôle</InputLabel>
              <Select value={form.role} onChange={e => set('role', e.target.value)} label="Rôle">
                {Object.entries(roleLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Poste" value={form.position || ''} onChange={e => set('position', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Contrat</InputLabel>
              <Select value={form.contract_type} onChange={e => set('contract_type', e.target.value)} label="Contrat">
                {['CDI', 'CDD', 'vacataire', 'stagiaire'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Date d'embauche" type="date" value={form.hire_date || ''} onChange={e => set('hire_date', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Salaire (FCFA)" type="number" value={form.salary || ''} onChange={e => set('salary', e.target.value)} /></Grid>
          {!member && <Grid item xs={12}><PasswordField fullWidth label="Mot de passe" value={form.password} onChange={e => set('password', e.target.value)} helperText="Laissez vide pour générer un mot de passe temporaire aléatoire" /></Grid>}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={18} /> : 'Enregistrer'}</Button>
      </DialogActions>
    </Dialog>
  )
}
