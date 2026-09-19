import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, Typography, Button, TextField, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Chip, Avatar,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem,
  Select, FormControl, InputLabel, CircularProgress, Tooltip, Divider,
  ToggleButtonGroup, ToggleButton, Autocomplete, Alert, AlertTitle
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faMagnifyingGlass, faPlus, faPenToSquare, faBoxArchive, faUsers, faCopy, faKey, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { downloadFile } from '../../lib/download'
import { Student, Class } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SkeletonTable from '../../components/ui/SkeletonTable'
import EmptyState from '../../components/ui/EmptyState'
import DataTablePagination from '../../components/ui/DataTablePagination'

const statusColors: Record<string, string> = {
  inscrit: '#dcfce7', pre_inscrit: '#fef9c3', reinscrit: '#dbeafe', archive: '#f3f4f6',
}
const statusText: Record<string, string> = {
  inscrit: 'Inscrit', pre_inscrit: 'Pré-inscrit', reinscrit: 'Réinscrit', archive: 'Archivé',
}

const relationshipOptions = ['Père', 'Mère', 'Tuteur légal', 'Grand-père', 'Grand-mère', 'Oncle / Tante', 'Autre']

type SortKey = 'first_name' | 'last_name' | 'class_name' | 'status' | 'created_at'
type SortDir = 'asc' | 'desc'
type ParentMode = 'none' | 'existing' | 'new'

interface ParentOption {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
}

const EMPTY_PARENT_DATA = {
  first_name: '', last_name: '', email: '', phone: '', relationship: 'Père',
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Grid item xs={12}>
      <Divider textAlign="left" sx={{ mt: 1, mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </Typography>
      </Divider>
    </Grid>
  )
}

function StudentForm({ open, onClose, student, classes, onSaved }: {
  open: boolean; onClose: () => void; student: Student | null; classes: Class[]; onSaved: () => void
}) {
  const { showToast } = useToast()

  const emptyStudent = {
    first_name: '', last_name: '', matricule: '', birth_date: '', birth_place: '', gender: 'M',
    class_id: '', status: 'inscrit', address: '', emergency_contact_name: '',
    emergency_contact_phone: '', blood_type: '', medical_notes: '',
  }

  const [form, setForm] = useState<any>(emptyStudent)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Parent
  const [parentMode, setParentMode] = useState<ParentMode>('none')
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([])
  const [parentSearch, setParentSearch] = useState('')
  const [parentLoading, setParentLoading] = useState(false)
  const [selectedParent, setSelectedParent] = useState<ParentOption | null>(null)
  const [parentData, setParentData] = useState({ ...EMPTY_PARENT_DATA })

  useEffect(() => {
    if (!open) return
    if (student) {
      setForm({ ...student, class_id: student.class_id || '', birth_date: student.birth_date?.split('T')[0] || '' })
      if ((student as any).parent_id) {
        setParentMode('existing')
        setSelectedParent({
          id: (student as any).parent_id,
          first_name: '',
          last_name: (student as any).parent_name || '',
          email: (student as any).parent_email || '',
          phone: (student as any).parent_phone || '',
        })
      } else {
        setParentMode('none')
        setSelectedParent(null)
      }
    } else {
      setForm(emptyStudent)
      setParentMode('none')
      setSelectedParent(null)
      setParentData({ ...EMPTY_PARENT_DATA })
    }
    setError('')
  }, [student, open])

  // Charger les parents existants (debounce 300ms)
  useEffect(() => {
    if (parentMode !== 'existing') return
    setParentLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await api.get('/students/parents', { params: { q: parentSearch } })
        setParentOptions(r.data.data)
      } finally { setParentLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [parentSearch, parentMode])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))
  const setP = (k: string, v: any) => setParentData(d => ({ ...d, [k]: v }))

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.gender) {
      setError('Prénom, nom et genre sont requis')
      return
    }
    if (parentMode === 'new' && (!parentData.first_name.trim() || !parentData.last_name.trim())) {
      setError('Prénom et nom du parent sont requis')
      return
    }
    setSaving(true); setError('')
    try {
      const payload: any = { ...form }
      if (parentMode === 'existing' && selectedParent) {
        payload.parent_id = selectedParent.id
      } else if (parentMode === 'new') {
        payload.parent_id = null
        payload.parent_data = parentData
      } else {
        payload.parent_id = null
      }

      if (student) await api.put(`/students/${student.id}`, payload)
      else         await api.post('/students', payload)

      showToast(student ? 'Élève modifié avec succès' : 'Élève ajouté avec succès', 'success')
      onSaved(); onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erreur lors de la sauvegarde'
      setError(msg); showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      fullScreen={window.innerWidth < 600}>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        {student ? "Modifier l'élève" : 'Ajouter un élève'}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Box className="animate-shake" sx={{ color: 'error.main', mb: 2, p: 1.5, bgcolor: '#fff5f5', borderRadius: 1, border: '1px solid #fecaca', fontSize: '0.85rem' }}>
            {error}
          </Box>
        )}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>

          {/* ── Informations personnelles ── */}
          <SectionLabel label="Informations personnelles" />

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Prénom *" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Nom *" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Matricule" value={form.matricule || ''} onChange={e => set('matricule', e.target.value)}
              placeholder="Ex : ECO-0013"
              helperText={student ? '' : 'Laissez vide pour une génération automatique'} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Date de naissance" type="date" value={form.birth_date}
              onChange={e => set('birth_date', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Lieu de naissance" value={form.birth_place || ''} onChange={e => set('birth_place', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Genre *</InputLabel>
              <Select value={form.gender} onChange={e => set('gender', e.target.value)} label="Genre *">
                <MenuItem value="M">Masculin</MenuItem>
                <MenuItem value="F">Féminin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Groupe sanguin" value={form.blood_type || ''} onChange={e => set('blood_type', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Adresse" value={form.address || ''} onChange={e => set('address', e.target.value)} multiline rows={2} />
          </Grid>

          {/* ── Scolarité ── */}
          <SectionLabel label="Scolarité" />

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Classe</InputLabel>
              <Select value={form.class_id || ''} onChange={e => set('class_id', e.target.value)} label="Classe">
                <MenuItem value="">— Sans classe —</MenuItem>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select value={form.status} onChange={e => set('status', e.target.value)} label="Statut">
                {Object.entries(statusText).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* ── Contact d'urgence ── */}
          <SectionLabel label="Contact d'urgence" />

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Nom" value={form.emergency_contact_name || ''} onChange={e => set('emergency_contact_name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Téléphone" value={form.emergency_contact_phone || ''} onChange={e => set('emergency_contact_phone', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Notes médicales" value={form.medical_notes || ''} onChange={e => set('medical_notes', e.target.value)} multiline rows={2} />
          </Grid>

          {/* ── Parent / Tuteur ── */}
          <SectionLabel label="Parent / Tuteur" />

          <Grid item xs={12}>
            <ToggleButtonGroup
              value={parentMode}
              exclusive
              onChange={(_, v) => {
                if (v !== null) {
                  setParentMode(v)
                  setSelectedParent(null)
                  setParentData({ ...EMPTY_PARENT_DATA })
                  setParentSearch('')
                }
              }}
              size="small"
              sx={{ mb: 1 }}
            >
              <ToggleButton value="none"     sx={{ px: 2, fontSize: '0.78rem' }}>Sans parent</ToggleButton>
              <ToggleButton value="existing" sx={{ px: 2, fontSize: '0.78rem' }}>Parent existant</ToggleButton>
              <ToggleButton value="new"      sx={{ px: 2, fontSize: '0.78rem' }}>Nouveau parent</ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          {/* Sélection d'un parent existant */}
          {parentMode === 'existing' && (
            <Grid item xs={12}>
              <Autocomplete
                options={parentOptions}
                loading={parentLoading}
                value={selectedParent}
                onChange={(_, v) => setSelectedParent(v)}
                onInputChange={(_, v) => setParentSearch(v)}
                getOptionLabel={o => `${o.first_name} ${o.last_name}${o.email ? ` — ${o.email}` : ''}`}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                noOptionsText={parentSearch.length < 1 ? 'Tapez pour rechercher…' : 'Aucun parent trouvé'}
                renderOption={(props, o) => (
                  <Box component="li" {...props}>
                    <Avatar sx={{ width: 28, height: 28, mr: 1.5, bgcolor: ECOLIO_NAVY, fontSize: '0.7rem' }}>
                      {o.first_name?.[0]}{o.last_name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{o.first_name} {o.last_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{o.email}{o.phone ? ` · ${o.phone}` : ''}</Typography>
                    </Box>
                  </Box>
                )}
                renderInput={params => (
                  <TextField {...params} label="Rechercher un parent" placeholder="Nom, email…"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: <>{parentLoading && <CircularProgress size={16} />}{params.InputProps.endAdornment}</>
                    }} />
                )}
              />
              {selectedParent && (
                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f0f4ff', borderRadius: 1, border: '1px solid #c7d7fd' }}>
                  <Typography variant="body2" fontWeight={600}>{selectedParent.first_name} {selectedParent.last_name}</Typography>
                  {selectedParent.email && <Typography variant="caption" color="text.secondary" display="block">{selectedParent.email}</Typography>}
                  {selectedParent.phone && <Typography variant="caption" color="text.secondary">{selectedParent.phone}</Typography>}
                </Box>
              )}
            </Grid>
          )}

          {/* Création d'un nouveau parent */}
          {parentMode === 'new' && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Prénom *" value={parentData.first_name} onChange={e => setP('first_name', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Nom *" value={parentData.last_name} onChange={e => setP('last_name', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" type="email" value={parentData.email}
                  onChange={e => setP('email', e.target.value)}
                  helperText="Le parent pourra se connecter avec cet email" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Téléphone" value={parentData.phone} onChange={e => setP('phone', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Lien de parenté</InputLabel>
                  <Select value={parentData.relationship} onChange={e => setP('relationship', e.target.value)} label="Lien de parenté">
                    {relationshipOptions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 1.5, bgcolor: '#fffbeb', borderRadius: 1, border: '1px solid #fde68a' }}>
                  <Typography variant="caption" color="text.secondary">
                    Un compte parent sera créé avec le mot de passe provisoire <strong>Ecolio1234!</strong>.
                    Le parent devra le changer lors de sa première connexion.
                  </Typography>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : student ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function Students() {
  const { showToast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('inscrit')
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Student | null>(null)
  const [toArchive, setToArchive] = useState<Student | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('last_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const load = async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([api.get('/students'), api.get('/classes')])
      setStudents(s.data.data)
      setClasses(c.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(0)
  }

  const handleArchive = async () => {
    if (!toArchive) return
    setArchiving(true)
    try {
      await api.put(`/students/${toArchive.id}`, { ...toArchive, status: 'archive' })
      showToast(`${toArchive.first_name} ${toArchive.last_name} archivé(e)`, 'success')
      load()
    } catch { showToast("Erreur lors de l'archivage", 'error') }
    finally { setArchiving(false); setToArchive(null) }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return students
      .filter(s => {
        const matchSearch  = !search || `${s.first_name} ${s.last_name} ${s.matricule}`.toLowerCase().includes(q)
        const matchClass   = !classFilter || String(s.class_id) === classFilter
        const matchStatus  = !statusFilter || s.status === statusFilter
        return matchSearch && matchClass && matchStatus
      })
      .sort((a, b) => {
        const va = (a[sortKey] ?? '') as string
        const vb = (b[sortKey] ?? '') as string
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      })
  }, [students, search, classFilter, statusFilter, sortKey, sortDir])

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

  const SortCell = ({ label, field }: { label: string; field: SortKey }) => (
    <TableCell>
      <TableSortLabel
        active={sortKey === field}
        direction={sortKey === field ? sortDir : 'asc'}
        onClick={() => handleSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  )

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Élèves</Typography>
          <Typography variant="body2" color="text.secondary">{filtered.length} élève{filtered.length > 1 ? 's' : ''}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined"
            startIcon={<FontAwesomeIcon icon={faFileExcel} style={{ fontSize: '0.85rem' }} />}
            onClick={() => downloadFile('/students/export/excel', 'eleves.xlsx')}>
            Exporter Excel
          </Button>
          <Button variant="contained"
            startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
            onClick={() => { setSelected(null); setFormOpen(true) }}>
            Ajouter
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Rechercher par nom, matricule…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            size="small" sx={{ minWidth: { xs: '100%', sm: 240 }, flex: { sm: 1 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '0.85rem', color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <InputLabel>Classe</InputLabel>
            <Select value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(0) }} label="Classe">
              <MenuItem value="">Toutes les classes</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
            <InputLabel>Statut</InputLabel>
            <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }} label="Statut">
              <MenuItem value="">Tous</MenuItem>
              {Object.entries(statusText).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <SkeletonTable columns={7} rows={8} hasAvatar />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={faUsers}
            title="Aucun élève trouvé"
            subtitle={search ? `Aucun résultat pour "${search}"` : 'Ajoutez votre premier élève pour commencer.'}
            actionLabel={!search ? 'Ajouter un élève' : undefined}
            onAction={!search ? () => { setSelected(null); setFormOpen(true) } : undefined}
          />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 500 }}>
                <TableHead>
                  <TableRow>
                    <SortCell label="Élève" field="first_name" />
                    <TableCell className="hide-xs">Matricule</TableCell>
                    <SortCell label="Classe" field="class_name" />
                    <TableCell className="hide-xs">Genre</TableCell>
                    <SortCell label="Statut" field="status" />
                    <TableCell className="hide-xs">Parent</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map(s => (
                    <TableRow key={s.id} className="MuiTableRow-body">
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: ECOLIO_NAVY, fontSize: '0.75rem', display: { xs: 'none', sm: 'flex' } }}>
                            {s.first_name[0]}{s.last_name[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{s.first_name} {s.last_name}</Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: ECOLIO_BLUE, display: { xs: 'block', sm: 'none' } }}>
                              {s.matricule}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell className="hide-xs">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: ECOLIO_BLUE }}>{s.matricule}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={s.class_name || '—'} size="small"
                          sx={{ bgcolor: '#f0f4ff', color: ECOLIO_NAVY, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell className="hide-xs">
                        <Chip label={s.gender === 'M' ? 'Garçon' : 'Fille'} size="small"
                          sx={{ bgcolor: s.gender === 'M' ? '#dbeafe' : '#fce7f3', color: s.gender === 'M' ? '#1d4ed8' : '#be185d', fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={statusText[s.status]} size="small"
                          sx={{ bgcolor: statusColors[s.status], fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell className="hide-xs">
                        {(s as any).parent_name ? (
                          <Box>
                            <Typography variant="caption" fontWeight={500} display="block">{(s as any).parent_name}</Typography>
                            {(s as any).parent_phone && (
                              <Typography variant="caption" color="text.secondary">{(s as any).parent_phone}</Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Modifier">
                          <IconButton size="small" sx={{ color: ECOLIO_BLUE }} onClick={() => { setSelected(s); setFormOpen(true) }}>
                            <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '0.85rem' }} />
                          </IconButton>
                        </Tooltip>
                        {s.status !== 'archive' && (
                          <Tooltip title="Archiver">
                            <IconButton size="small" color="warning" onClick={() => setToArchive(s)}>
                              <FontAwesomeIcon icon={faBoxArchive} style={{ fontSize: '0.85rem' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <DataTablePagination
              total={filtered.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
            />
          </>
        )}
      </Card>

      <StudentForm open={formOpen} onClose={() => setFormOpen(false)} student={selected} classes={classes} onSaved={load} />

      <ConfirmDialog
        open={!!toArchive}
        title="Archiver l'élève"
        message={`Archiver ${toArchive?.first_name} ${toArchive?.last_name} ? L'élève ne sera plus visible dans les listes actives.`}
        confirmLabel="Archiver"
        variant="warning"
        loading={archiving}
        onConfirm={handleArchive}
        onCancel={() => setToArchive(null)}
      />
    </Box>
  )
}
