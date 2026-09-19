import { useState, useEffect } from 'react'
import { Box, Container, Typography, Card, Avatar, Grid, Chip, CircularProgress } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faLocationDot, faPhone, faEnvelope, faNewspaper, faImage, faVideo, faBullhorn, faFile, faArrowLeft
} from '@fortawesome/free-solid-svg-icons'
import { Link, useParams } from 'react-router-dom'
import api from '../../lib/axios'
import { PublicSchoolDetail, Publication } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import SiteHeader from '../../components/Site/SiteHeader'
import SiteFooter from '../../components/Site/SiteFooter'
import EmptyState from '../../components/ui/EmptyState'

const TYPE_LABELS: Record<string, string> = { image: 'Image', video: 'Vidéo', announcement: 'Annonce', other: 'Publication' }
const TYPE_ICONS: Record<string, any> = { image: faImage, video: faVideo, announcement: faBullhorn, other: faFile }

export default function SchoolProfile() {
  const { id } = useParams()
  const [school, setSchool] = useState<PublicSchoolDetail | null>(null)
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true); setNotFound(false)
    Promise.all([
      api.get(`/public/schools/${id}`),
      api.get(`/public/schools/${id}/publications`),
    ])
      .then(([s, p]) => { setSchool(s.data.data); setPublications(p.data.data) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafbfc' }}>
      <SiteHeader />

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      ) : notFound || !school ? (
        <Container maxWidth="sm" sx={{ py: 10 }}>
          <EmptyState icon={faLocationDot} title="École non trouvée"
            subtitle="Cette école n'existe pas ou n'a pas activé sa fiche publique." />
        </Container>
      ) : (
        <>
          <Box sx={{
            color: 'white', py: { xs: 5, md: 7 },
            background: `linear-gradient(135deg, ${school.primary_color || ECOLIO_NAVY} 0%, ${school.secondary_color || ECOLIO_BLUE} 100%)`,
          }}>
            <Container maxWidth="lg">
              <Link to="/#ecoles" style={{ color: 'white', opacity: 0.85, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', marginBottom: 16 }}>
                <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '0.75rem' }} /> Retour aux écoles partenaires
              </Link>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap', mt: 2 }}>
                <Avatar src={school.logo_url} sx={{ width: 84, height: 84, bgcolor: 'rgba(255,255,255,0.15)', fontSize: '2rem', border: '3px solid rgba(255,255,255,0.4)' }}>
                  {school.name[0]}
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={800}>{school.name}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                    {school.city && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, opacity: 0.9 }}>
                        <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: '0.8rem' }} /> {school.city}
                      </Typography>
                    )}
                    {school.phone && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, opacity: 0.9 }}>
                        <FontAwesomeIcon icon={faPhone} style={{ fontSize: '0.8rem' }} /> {school.phone}
                      </Typography>
                    )}
                    {school.email && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, opacity: 0.9 }}>
                        <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '0.8rem' }} /> {school.email}
                      </Typography>
                    )}
                  </Box>
                  {school.address && (
                    <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>{school.address}</Typography>
                  )}
                </Box>
              </Box>
            </Container>
          </Box>

          <Container maxWidth="lg" sx={{ py: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <FontAwesomeIcon icon={faNewspaper} style={{ fontSize: '1.2rem', color: ECOLIO_BLUE }} />
              <Typography variant="h5" fontWeight={800} sx={{ color: ECOLIO_NAVY }}>Actualités de l'école</Typography>
            </Box>

            {publications.length === 0 ? (
              <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: 'white', boxShadow: 'none', border: '1px dashed #d8dee8' }}>
                <Typography color="text.secondary">Cette école n'a publié aucune actualité pour le moment.</Typography>
              </Card>
            ) : (
              <Grid container spacing={3} className="stagger">
                {publications.map(p => (
                  <Grid item xs={12} sm={6} md={4} key={p.id} className="animate-fade-in-up">
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 3 }}>
                      {p.type === 'image' && p.media_url && (
                        <Box component="img" src={p.media_url} alt={p.title || ''} sx={{ width: '100%', height: 180, objectFit: 'cover' }} />
                      )}
                      {p.type === 'video' && p.media_url && (
                        <Box component="video" src={p.media_url} controls sx={{ width: '100%', height: 180, objectFit: 'cover', bgcolor: '#000' }} />
                      )}
                      <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        <Chip size="small" icon={<FontAwesomeIcon icon={TYPE_ICONS[p.type] || faFile} style={{ fontSize: '0.8rem' }} />}
                          label={TYPE_LABELS[p.type] || p.type}
                          sx={{ alignSelf: 'flex-start', bgcolor: '#f0f4ff', color: ECOLIO_BLUE, fontWeight: 600 }} />
                        {p.title && <Typography variant="subtitle1" fontWeight={700}>{p.title}</Typography>}
                        {p.content && <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', flex: 1 }}>{p.content}</Typography>}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
                          {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Container>
        </>
      )}

      <SiteFooter />
    </Box>
  )
}
