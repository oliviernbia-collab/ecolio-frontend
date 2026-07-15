import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import {
  Box, Card, Typography, Button, TextField, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Avatar,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem,
  Select, FormControl, InputLabel, CircularProgress, Tooltip
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faMagnifyingGlass, faPlus, faPenToSquare, faTrash, faBookOpen } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { Subject, Class } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SkeletonTable from '../../components/ui/SkeletonTable'
import EmptyState from '../../components/ui/EmptyState'

const COEFF_COLORS: Record<number, string> = {
  1: '#f1f5f9', 2: '#dbeafe', 3: '#dcfce7', 4: '#fef9c3', 5: '#fee2e2',
}

function SubjectForm({ open, onClose, subject, classes, teachers, onSaved }: {
  open: boolean; onClose: () => void; subject: Subject | null
  classes: Class[]; teachers: any[]; onSaved: () => void
}) {
  const { showToast } = useToast()
  const empty = { name: '', code: '', coefficient: 1, class_id: '', teacher_id: '' }
  const [form, setForm] = useState<any>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(subject
      ? { name: subject.name, code: subject.code || '', coefficient: subject.coefficient, class_id: subject.class_id || '', teacher_id: subject.teacher_id || '' }
      : empty)
    setError('')
  }, [subject, open])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Le nom de la matière est requis'); return }
    setSaving(true); setError('')
    try {
      if (subject) await api.put(`/subjects/${subject.id}`, form)
      else         await api.post('/subjects', form)
      showToast(subject ? 'Matière modifiée' : 'Matière ajoutée', 'success')
      onSaved(); onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erreur lors de la sauvegarde'
      setError(msg); showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{subject ? 'Modifier la matière' : 'Ajouter une matière'}</DialogTitle>
      <DialogContent>
        {error && (
          <Box sx={{ color: 'error.main', mb: 2, p: 1.5, bgcolor: '#fff5f5', borderRadius: 1, border: '1px solid #fecaca', fontSize: '0.85rem' }}>
            {error}
          </Box>
        )}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={8}>
            <TextField fullWidth label="Nom de la matière *" value={form.name} onChange={e => set('name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Code" value={form.code} onChange={e => set('code', e.target.value)} placeholder="Ex : MATH" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Coefficient" type="number" value={form.coefficient}
              onChange={e => set('coefficient', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              inputProps={{ min: 1, max: 10 }} />
          </Grid>
          <Grid item xs={12} sm={8}>
            <FormControl fullWidth size="small">
              <InputLabel>Classe</InputLabel>
              <Select value={form.class_id || ''} onChange={e => set('class_id', e.target.value)} label="Classe">
                <MenuItem value="">— Toutes les classes —</MenuItem>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Enseignant responsable</InputLabel>
              <Select value={form.teacher_id || ''} onChange={e => set('teacher_id', e.target.value)} label="Enseignant responsable">
                <MenuItem value="">— Non assigné —</MenuItem>
                {teachers.map(t => (
                  <MenuItem key={t.user_id} value={t.user_id}>{t.first_name} {t.last_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : subject ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function Subjects() {
  const { showToast } = useToast()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Subject | null>(null)
  const [toDelete, setToDelete] = useState<Subject | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, c, t] = await Promise.all([
        api.get('/subjects'),
        api.get('/classes'),
        api.get('/staff'),
      ])
      setSubjects(s.data.data)
      setClasses(c.data.data)
      setTeachers((t.data.data || []).filter((m: any) => m.role === 'teacher'))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/subjects/${toDelete.id}`)
      showToast(`Matière "${toDelete.name}" supprimée`, 'success')
      load()
    } catch { showToast('Erreur lors de la suppression', 'error') }
    finally { setDeleting(false); setToDelete(null) }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return subjects.filter(s => {
      const matchSearch = !search || s.name.toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q) || (s.teacher_name || '').toLowerCase().includes(q)
      const matchClass  = !classFilter || String(s.class_id) === classFilter
      return matchSearch && matchClass
    })
  }, [subjects, search, classFilter])

  // Grouper par classe pour l'affichage
  const grouped = useMemo(() => {
    const map = new Map<string, Subject[]>()
    for (const s of filtered) {
      const key = s.class_name || '— Sans classe —'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Matières</Typography>
          <Typography variant="body2" color="text.secondary">{filtered.length} matière{filtered.length > 1 ? 's' : ''}</Typography>
        </Box>
        <Button variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
          onClick={() => { setSelected(null); setFormOpen(true) }}>
          Ajouter
        </Button>
      </Box>

      {/* Filtres */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Rechercher par nom, code, enseignant…" value={search}
            onChange={e => setSearch(e.target.value)}
            size="small" sx={{ minWidth: { xs: '100%', sm: 240 }, flex: { sm: 1 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '0.85rem', color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            <InputLabel>Classe</InputLabel>
            <Select value={classFilter} onChange={e => setClassFilter(e.target.value)} label="Classe">
              <MenuItem value="">Toutes les classes</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Table groupée */}
      <Card>
        {loading ? (
          <SkeletonTable columns={5} rows={8} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={faBookOpen}
            title="Aucune matière trouvée"
            subtitle={search ? `Aucun résultat pour "${search}"` : 'Ajoutez votre première matière pour commencer.'}
            actionLabel={!search ? 'Ajouter une matière' : undefined}
            onAction={!search ? () => { setSelected(null); setFormOpen(true) } : undefined}
          />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Matière</TableCell>
                  <TableCell className="hide-xs">Code</TableCell>
                  <TableCell align="center">Coefficient</TableCell>
                  <TableCell className="hide-xs">Enseignant</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grouped.map(([className, items]) => (
                  <Fragment key={`group-frag-${className}`}>
                    {/* Ligne de groupe */}
                    <TableRow key={`group-${className}`}>
                      <TableCell colSpan={5} sx={{ bgcolor: '#f8fafc', py: 1, px: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 3, height: 16, borderRadius: 2, bgcolor: ECOLIO_BLUE }} />
                          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {className}
                          </Typography>
                          <Chip label={items.length} size="small" sx={{ height: 18, fontSize: '0.65rem', ml: 0.5, bgcolor: '#e2e8f0' }} />
                        </Box>
                      </TableCell>
                    </TableRow>
                    {/* Lignes de matières */}
                    {items.map(s => (
                      <TableRow key={s.id} className="MuiTableRow-body">
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: ECOLIO_NAVY, fontSize: '0.7rem' }}>
                              {s.name.slice(0, 2).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>{s.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell className="hide-xs">
                          {s.code ? (
                            <Chip label={s.code} size="small" sx={{ fontFamily: 'monospace', fontSize: '0.72rem', bgcolor: '#f0f4ff', color: ECOLIO_NAVY }} />
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`×${s.coefficient}`}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: COEFF_COLORS[s.coefficient] || '#f1f5f9', minWidth: 36 }}
                          />
                        </TableCell>
                        <TableCell className="hide-xs">
                          {s.teacher_name ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 22, height: 22, bgcolor: '#2E86AB', fontSize: '0.6rem' }}>
                                {s.teacher_name[0]}
                              </Avatar>
                              <Typography variant="caption">{s.teacher_name}</Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.disabled">Non assigné</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Modifier">
                            <IconButton size="small" sx={{ color: ECOLIO_BLUE }} onClick={() => { setSelected(s); setFormOpen(true) }}>
                              <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '0.85rem' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton size="small" color="error" onClick={() => setToDelete(s)}>
                              <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.85rem' }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <SubjectForm
        open={formOpen} onClose={() => setFormOpen(false)}
        subject={selected} classes={classes} teachers={teachers} onSaved={load}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer la matière"
        message={`Supprimer "${toDelete?.name}" ? Cette action est irréversible et supprimera aussi les notes associées.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </Box>
  )
}
