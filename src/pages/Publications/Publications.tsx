import { useState, useEffect, useRef } from 'react'
import {
  Box, Card, Typography, Button, Grid, MenuItem, Select, FormControl, InputLabel,
  TextField, CircularProgress, IconButton, Tooltip, Chip
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faPlus, faTrash, faNewspaper, faImage, faVideo, faBullhorn, faEye, faCloudArrowUp, faFile
} from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import { Publication } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'

const TYPES = [
  { value: 'announcement', label: 'Annonce', icon: faBullhorn },
  { value: 'image',        label: 'Image',    icon: faImage },
  { value: 'video',        label: 'Vidéo',    icon: faVideo },
  { value: 'other',        label: 'Autre',    icon: faFile },
]

function TypeIcon({ type }: { type: string }) {
  const cfg = TYPES.find(t => t.value === type) || TYPES[0]
  return <FontAwesomeIcon icon={cfg.icon} style={{ fontSize: '0.85rem' }} />
}

function PublicationForm({ onCreated }: { onCreated: () => void }) {
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState('announcement')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const needsFile = type === 'image' || type === 'video'

  const handleFile = (f: File | null) => {
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const reset = () => {
    setType('announcement'); setTitle(''); setContent(''); handleFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async () => {
    setError('')
    if (needsFile && !file) { setError('Ajoutez une image ou une vidéo'); return }
    if (type === 'announcement' && !content.trim()) { setError('Le contenu de l\'annonce est requis'); return }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('type', type)
      if (title) fd.append('title', title)
      if (content) fd.append('content', content)
      if (file) fd.append('media', file)
      await api.post('/publications', fd)
      showToast('Publication publiée', 'success')
      reset(); onCreated()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erreur lors de la publication'
      setError(msg); showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} mb={2}>Nouvelle publication</Typography>
      {error && (
        <Box sx={{ color: 'error.main', mb: 2, p: 1.5, bgcolor: '#fff5f5', borderRadius: 1, border: '1px solid #fecaca', fontSize: '0.85rem' }}>
          {error}
        </Box>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select value={type} label="Type" onChange={e => { setType(e.target.value); handleFile(null) }}>
              {TYPES.map(t => (
                <MenuItem key={t.value} value={t.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon icon={t.icon} style={{ fontSize: '0.8rem' }} /> {t.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField fullWidth size="small" label="Titre (optionnel)" value={title} onChange={e => setTitle(e.target.value)} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth size="small" multiline minRows={2} label={type === 'announcement' ? 'Contenu de l\'annonce' : 'Légende (optionnel)'}
            value={content} onChange={e => setContent(e.target.value)} />
        </Grid>
        {needsFile && (
          <Grid item xs={12}>
            <Button variant="outlined" component="label" startIcon={<FontAwesomeIcon icon={faCloudArrowUp} style={{ fontSize: '0.85rem' }} />}>
              {file ? file.name : `Choisir ${type === 'image' ? 'une image' : 'une vidéo'}`}
              <input ref={fileRef} type="file" hidden accept={type === 'image' ? 'image/*' : 'video/*'}
                onChange={e => handleFile(e.target.files?.[0] || null)} />
            </Button>
            {preview && type === 'image' && (
              <Box component="img" src={preview} alt="" sx={{ display: 'block', mt: 1.5, maxHeight: 160, borderRadius: 2 }} />
            )}
            {preview && type === 'video' && (
              <Box component="video" src={preview} controls sx={{ display: 'block', mt: 1.5, maxHeight: 200, borderRadius: 2 }} />
            )}
          </Grid>
        )}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.8rem' }} />}>
          Publier
        </Button>
      </Box>
    </Card>
  )
}

export default function Publications() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [items, setItems] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [toDelete, setToDelete] = useState<Publication | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/publications')
      setItems(r.data.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/publications/${toDelete.id}`)
      showToast('Publication supprimée', 'success'); load()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur lors de la suppression', 'error')
    } finally { setDeleting(false); setToDelete(null) }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Publications</Typography>
          <Typography variant="body2" color="text.secondary">
            Images, vidéos et annonces visibles publiquement sur la fiche de votre école.
          </Typography>
        </Box>
        {user?.school_id && (
          <Button variant="outlined" component={Link} to={`/ecoles/${user.school_id}`}
            startIcon={<FontAwesomeIcon icon={faEye} style={{ fontSize: '0.8rem' }} />}>
            Voir la fiche publique
          </Button>
        )}
      </Box>

      <PublicationForm onCreated={load} />

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <EmptyState icon={faNewspaper} title="Aucune publication"
          subtitle="Publiez une image, une vidéo ou une annonce pour qu'elle apparaisse sur la fiche publique de votre école." />
      ) : (
        <Grid container spacing={2}>
          {items.map(p => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {p.type === 'image' && p.media_url && (
                  <Box component="img" src={p.media_url} alt="" sx={{ width: '100%', height: 160, objectFit: 'cover' }} />
                )}
                {p.type === 'video' && p.media_url && (
                  <Box component="video" src={p.media_url} controls sx={{ width: '100%', height: 160, objectFit: 'cover', bgcolor: '#000' }} />
                )}
                <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Chip size="small" icon={<TypeIcon type={p.type} />} label={TYPES.find(t => t.value === p.type)?.label || p.type}
                      sx={{ bgcolor: '#f0f4ff', color: ECOLIO_BLUE, fontWeight: 600 }} />
                    <Tooltip title="Supprimer">
                      <IconButton size="small" color="error" onClick={() => setToDelete(p)}>
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.75rem' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {p.title && <Typography variant="subtitle2" fontWeight={700} sx={{ color: ECOLIO_NAVY }}>{p.title}</Typography>}
                  {p.content && <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{p.content}</Typography>}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
                    {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {p.created_by_name ? ` · ${p.created_by_name}` : ''}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <ConfirmDialog open={!!toDelete} title="Supprimer la publication"
        message={`Supprimer définitivement "${toDelete?.title || toDelete?.type}" ?`}
        confirmLabel="Supprimer" variant="danger" loading={deleting}
        onConfirm={handleDelete} onCancel={() => setToDelete(null)} />
    </Box>
  )
}
