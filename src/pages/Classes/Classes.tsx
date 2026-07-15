import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, FormControl, InputLabel, CircularProgress,
  LinearProgress, IconButton, Tooltip, ToggleButtonGroup, ToggleButton, Divider
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faPlus, faPenToSquare, faTrash, faUsers, faChalkboard } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import SkeletonTable from '../../components/ui/SkeletonTable'

interface ClassItem {
  id: number
  name: string
  level?: string
  cycle: 'maternelle' | 'primaire' | 'secondaire'
  teacher_id?: number
  teacher_name?: string
  capacity: number
  student_count: number
  academic_year_id?: number
}

interface StaffMin { id: number; first_name: string; last_name: string; role: string }

const CYCLE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  maternelle: { bg: '#fce7f3', color: '#9d174d', label: 'Maternelle' },
  primaire:   { bg: '#dbeafe', color: '#1e40af', label: 'Primaire'   },
  secondaire: { bg: '#dcfce7', color: '#15803d', label: 'Secondaire' },
}

export default function Classes() {
  const { showToast } = useToast()
  const [classes,  setClasses]  = useState<ClassItem[]>([])
  const [teachers, setTeachers] = useState<StaffMin[]>([])
  const [loading,  setLoading]  = useState(true)
  const [cycleFilter, setCycleFilter] = useState('all')
  const [formOpen, setFormOpen]  = useState(false)
  const [selected, setSelected]  = useState<ClassItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null)
  const [deleting, setDeleting]  = useState(false)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/classes'); setClasses(r.data.data) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    api.get('/staff').then(r => setTeachers(r.data.data)).catch(() => {})
  }, [])

  const filtered = useMemo(() =>
    cycleFilter === 'all' ? classes : classes.filter(c => c.cycle === cycleFilter),
    [classes, cycleFilter])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/classes/${deleteTarget.id}`)
      showToast(`Classe "${deleteTarget.name}" supprimée`, 'success')
      setDeleteTarget(null); load()
    } catch (e: any) { showToast(e.response?.data?.message || 'Erreur', 'error') }
    finally { setDeleting(false) }
  }

  const cycleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: classes.length }
    classes.forEach(c => { counts[c.cycle] = (counts[c.cycle] || 0) + 1 })
    return counts
  }, [classes])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Gestion des classes</Typography>
          <Typography variant="body2" color="text.secondary">{classes.length} classe(s) au total</Typography>
        </Box>
        <Button variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
          onClick={() => { setSelected(null); setFormOpen(true) }}>
          Nouvelle classe
        </Button>
      </Box>

      {/* Filtres cycle */}
      <ToggleButtonGroup value={cycleFilter} exclusive onChange={(_, v) => v && setCycleFilter(v)}
        size="small" sx={{ mb: 3, flexWrap: 'wrap', gap: 0.5 }}>
        <ToggleButton value="all" sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
          Tous ({cycleCounts.all || 0})
        </ToggleButton>
        {Object.entries(CYCLE_COLORS).map(([key, val]) => (
          <ToggleButton key={key} value={key} sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
            {val.label} ({cycleCounts[key] || 0})
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {loading ? (
        <SkeletonTable columns={4} rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={faChalkboard}
          title="Aucune classe trouvée"
          subtitle={cycleFilter !== 'all' ? "Essayez un autre filtre." : "Créez votre première classe pour commencer."}
          actionLabel="Créer une classe"
          onAction={() => { setSelected(null); setFormOpen(true) }}
        />
      ) : (
        <Grid container spacing={2}>
          {filtered.map(cls => {
            const cycleStyle = CYCLE_COLORS[cls.cycle] || CYCLE_COLORS.primaire
            const fillPct    = cls.capacity > 0 ? Math.min(100, Math.round((cls.student_count / cls.capacity) * 100)) : 0
            const fillColor  = fillPct >= 90 ? '#ef4444' : fillPct >= 70 ? '#f59e0b' : '#22c55e'

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={cls.id}>
                <Card sx={{
                  height: '100%', position: 'relative',
                  borderTop: `4px solid ${cycleStyle.color}`,
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }
                }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{cls.name}</Typography>
                        {cls.level && (
                          <Typography variant="caption" color="text.secondary">{cls.level}</Typography>
                        )}
                      </Box>
                      <Chip
                        label={cycleStyle.label}
                        size="small"
                        sx={{ bgcolor: cycleStyle.bg, color: cycleStyle.color, fontSize: '0.65rem', fontWeight: 600 }}
                      />
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Enseignant principal */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: `${cycleStyle.color}20`, color: cycleStyle.color, fontSize: '0.7rem' }}>
                        {cls.teacher_name?.[0] || '?'}
                      </Avatar>
                      <Typography variant="caption" color={cls.teacher_name ? 'text.primary' : 'text.secondary'}>
                        {cls.teacher_name || 'Aucun titulaire'}
                      </Typography>
                    </Box>

                    {/* Jauge d'occupation */}
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FontAwesomeIcon icon={faUsers} style={{ fontSize: '0.7rem', color: '#888' }} />
                          <Typography variant="caption" color="text.secondary">
                            {cls.student_count} / {cls.capacity} élèves
                          </Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={600} sx={{ color: fillColor }}>{fillPct}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={fillPct}
                        sx={{ height: 6, borderRadius: 3, bgcolor: `${fillColor}22`,
                          '& .MuiLinearProgress-bar': { bgcolor: fillColor, borderRadius: 3 } }}
                      />
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1.5 }}>
                      <Tooltip title="Modifier">
                        <IconButton size="small" sx={{ color: ECOLIO_BLUE }}
                          onClick={() => { setSelected(cls); setFormOpen(true) }}>
                          <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '0.85rem' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" sx={{ color: '#dc2626' }}
                          onClick={() => setDeleteTarget(cls)}>
                          <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.85rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Formulaire */}
      <ClassForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        cls={selected}
        teachers={teachers}
        onSaved={() => { load() }}
      />

      {/* Confirmation suppression */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        variant="danger"
        title="Supprimer la classe"
        message={`Supprimer "${deleteTarget?.name}" ? Les élèves de cette classe ne seront pas supprimés, mais leur affectation de classe sera retirée.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  )
}

// ── Formulaire ────────────────────────────────────────────────────────────────
function ClassForm({ open, onClose, cls, teachers, onSaved }: {
  open: boolean; onClose: () => void; cls: ClassItem | null
  teachers: StaffMin[]; onSaved: () => void
}) {
  const { showToast } = useToast()
  const empty = { name: '', level: '', cycle: 'primaire', teacher_id: '', capacity: 30 }
  const [form, setForm]   = useState<any>(empty)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  useEffect(() => {
    setForm(cls ? { ...cls, teacher_id: cls.teacher_id || '' } : empty)
  }, [cls, open])

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Le nom de la classe est requis', 'warning'); return }
    setSaving(true)
    try {
      if (cls) await api.put(`/classes/${cls.id}`, form)
      else     await api.post('/classes', form)
      showToast(cls ? 'Classe modifiée' : 'Classe créée avec succès', 'success')
      onSaved(); onClose()
    } catch (e: any) { showToast(e.response?.data?.message || 'Erreur', 'error') }
    finally { setSaving(false) }
  }

  const staffTeachers = teachers.filter(t => ['teacher','director','super_admin','counselor'].includes(t.role))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {cls ? 'Modifier la classe' : 'Nouvelle classe'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 0.5 }}>
          <Grid item xs={12} sm={8}>
            <TextField fullWidth label="Nom de la classe *" value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ex : 6ème A, CP1, CE2..." />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Niveau" value={form.level || ''}
              onChange={e => set('level', e.target.value)}
              placeholder="Ex : 6ème, CE2..." />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Cycle *</InputLabel>
              <Select value={form.cycle} onChange={e => set('cycle', e.target.value)} label="Cycle *">
                <MenuItem value="maternelle">🌱 Maternelle</MenuItem>
                <MenuItem value="primaire">📚 Primaire</MenuItem>
                <MenuItem value="secondaire">🎓 Secondaire</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Capacité" type="number"
              value={form.capacity} onChange={e => set('capacity', parseInt(e.target.value) || 30)}
              inputProps={{ min: 1, max: 100 }} />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Enseignant titulaire</InputLabel>
              <Select value={form.teacher_id || ''} onChange={e => set('teacher_id', e.target.value)} label="Enseignant titulaire">
                <MenuItem value="">— Aucun —</MenuItem>
                {staffTeachers.map(t => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.first_name} {t.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : cls ? 'Mettre à jour' : 'Créer la classe'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
