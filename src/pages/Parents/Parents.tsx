import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, InputAdornment, Avatar,
  Chip, Collapse, IconButton, Grid, CircularProgress, Tooltip, Divider
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faMagnifyingGlass, faChevronDown, faChevronUp, faUserGroup,
  faPhone, faEnvelope, faGraduationCap
} from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import EmptyState from '../../components/ui/EmptyState'

interface ParentUser {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
}

interface ChildInfo {
  id: number
  first_name: string
  last_name: string
  matricule: string
  class_name?: string
  status: string
  photo_url?: string
}

interface ParentWithChildren extends ParentUser {
  children: ChildInfo[]
}

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  inscrit:    { bg: '#dcfce7', color: '#16a34a', label: 'Inscrit' },
  pre_inscrit:{ bg: '#fef9c3', color: '#854d0e', label: 'Pré-inscrit' },
  reinscrit:  { bg: '#dbeafe', color: '#1d4ed8', label: 'Réinscrit' },
  archive:    { bg: '#f3f4f6', color: '#6b7280', label: 'Archivé' },
}

function ParentCard({ parent }: { parent: ParentWithChildren }) {
  const [open, setOpen] = useState(false)

  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: '12px 16px !important' }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setOpen(o => !o)}
        >
          <Avatar sx={{ width: 40, height: 40, bgcolor: ECOLIO_NAVY, fontSize: '0.9rem', flexShrink: 0 }}>
            {parent.first_name[0]}{parent.last_name[0]}
          </Avatar>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography fontWeight={700} fontSize="0.95rem" noWrap>
              {parent.first_name} {parent.last_name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 0.3, flexWrap: 'wrap' }}>
              {parent.email && (
                <Typography fontSize="0.78rem" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '0.7rem' }} />
                  {parent.email}
                </Typography>
              )}
              {parent.phone && (
                <Typography fontSize="0.78rem" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FontAwesomeIcon icon={faPhone} style={{ fontSize: '0.7rem' }} />
                  {parent.phone}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Chip
              icon={<FontAwesomeIcon icon={faGraduationCap} style={{ fontSize: '0.7rem' }} />}
              label={`${parent.children.length} enfant${parent.children.length > 1 ? 's' : ''}`}
              size="small"
              sx={{ bgcolor: `${ECOLIO_BLUE}14`, color: ECOLIO_BLUE, fontWeight: 600, fontSize: '0.72rem' }}
            />
            <FontAwesomeIcon
              icon={open ? faChevronUp : faChevronDown}
              style={{ fontSize: '0.8rem', color: '#9ca3af' }}
            />
          </Box>
        </Box>

        <Collapse in={open}>
          <Divider sx={{ my: 1.5 }} />
          {parent.children.length === 0 ? (
            <Typography fontSize="0.85rem" color="text.secondary" sx={{ py: 1 }}>
              Aucun enfant associé
            </Typography>
          ) : (
            <Grid container spacing={1.5}>
              {parent.children.map(child => {
                const sc = statusColors[child.status] ?? statusColors.inscrit
                return (
                  <Grid item xs={12} sm={6} md={4} key={child.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.2, bgcolor: '#f8f9fc', borderRadius: 2, border: '1px solid #eef0f4' }}>
                      <Avatar src={child.photo_url} sx={{ width: 32, height: 32, bgcolor: ECOLIO_BLUE, fontSize: '0.75rem', flexShrink: 0 }}>
                        {child.first_name[0]}{child.last_name[0]}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography fontWeight={600} fontSize="0.85rem" noWrap>
                          {child.first_name} {child.last_name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.2, flexWrap: 'wrap' }}>
                          <Typography fontSize="0.7rem" color="text.secondary" fontFamily="monospace">
                            {child.matricule}
                          </Typography>
                          {child.class_name && (
                            <Typography fontSize="0.7rem" color="text.secondary">— {child.class_name}</Typography>
                          )}
                        </Box>
                      </Box>
                      <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontSize: '0.65rem', height: 20 }} />
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
          )}
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default function Parents() {
  const [parents, setParents] = useState<ParentUser[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/students/parents'),
      api.get('/students'),
    ]).then(([p, s]) => {
      setParents(p.data.data)
      setStudents(s.data.data)
    }).finally(() => setLoading(false))
  }, [])

  const parentsWithChildren = useMemo<ParentWithChildren[]>(() => {
    return parents.map(parent => ({
      ...parent,
      children: students.filter(s => s.parent_id === parent.id).map(s => ({
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        matricule: s.matricule,
        class_name: s.class_name,
        status: s.status,
        photo_url: s.photo_url,
      })),
    }))
  }, [parents, students])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return parentsWithChildren
    return parentsWithChildren.filter(p =>
      `${p.first_name} ${p.last_name} ${p.email} ${p.phone ?? ''}`
        .toLowerCase().includes(q) ||
      p.children.some(c => `${c.first_name} ${c.last_name} ${c.matricule}`.toLowerCase().includes(q))
    )
  }, [parentsWithChildren, search])

  const totalChildren = parentsWithChildren.reduce((s, p) => s + p.children.length, 0)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Parents & Tuteurs</Typography>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} parent(s) · {totalChildren} enfant(s) associé(s)
          </Typography>
        </Box>
      </Box>

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Rechercher par nom, email, téléphone ou nom d'enfant…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '0.85rem', color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={faUserGroup}
          title={search ? `Aucun résultat pour "${search}"` : 'Aucun parent enregistré'}
          subtitle={search ? 'Essayez un autre terme.' : 'Les parents sont créés lors de l\'inscription des élèves.'}
        />
      ) : (
        filtered.map(parent => <ParentCard key={parent.id} parent={parent} />)
      )}
    </Box>
  )
}
