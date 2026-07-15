import { useState, useEffect } from 'react'
import {
  Box, Container, Typography, Button, Grid, Card, Avatar, Chip,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Divider
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faGraduationCap, faChartLine, faEnvelope, faWallet, faCalendarCheck,
  faSchool, faLocationDot, faNewspaper, faArrowRight, faUsers, faGauge,
  faShieldHalved, faBolt, faHeadset, faUserPlus, faGear, faListCheck
} from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import { PublicSchool } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useAuth } from '../../contexts/AuthContext'

const FEATURE_COLORS = ['#1A3C5E', '#2E86AB', '#16a34a', '#d97706', '#7c3aed', '#0ea5e9']

const FEATURES = [
  { icon: faUsers,          label: 'Élèves & inscriptions',      desc: 'Dossiers complets, matricules automatiques, suivi par classe.' },
  { icon: faChartLine,      label: 'Notes & bulletins',          desc: 'Saisie des notes, moyennes calculées, bulletins imprimables.' },
  { icon: faCalendarCheck,  label: 'Présences & emploi du temps',desc: "Appel numérique, détection de conflits d'horaires." },
  { icon: faWallet,         label: 'Finance & paye',             desc: 'Factures, paiements mobiles, bulletins de salaire du personnel.' },
  { icon: faEnvelope,       label: 'Communication',              desc: 'Messagerie interne et SMS vers les familles.' },
  { icon: faGraduationCap,  label: 'Examens',                    desc: 'Planification des examens, salles, surveillants, notes.' },
]

const STEPS = [
  { icon: faUserPlus,   title: 'Inscrivez votre école',   desc: 'Créez votre compte directeur et configurez votre établissement en quelques minutes.' },
  { icon: faGear,       title: 'Ajoutez vos données',      desc: 'Classes, personnel, élèves et emploi du temps : la configuration se fait simplement, étape par étape.' },
  { icon: faListCheck,  title: 'Gérez au quotidien',        desc: 'Notes, présences, finances, examens et communication, depuis un seul endroit, sur ordinateur ou mobile.' },
]

const TRUST_POINTS = [
  { icon: faShieldHalved, label: 'Données sécurisées' },
  { icon: faBolt,         label: 'Rapide et intuitif' },
  { icon: faHeadset,      label: 'Support réactif' },
]

const NEWS_ITEMS = [
  {
    category: 'Rentrée scolaire',
    date: '2026-09-01',
    title: 'Rentrée 2026-2027 : ce qui change pour les établissements',
    summary: "Calendrier scolaire, nouveaux programmes et recommandations du ministère pour la rentrée à venir.",
  },
  {
    category: 'Numérique éducatif',
    date: '2026-06-15',
    title: 'La digitalisation des écoles s\'accélère en Côte d\'Ivoire',
    summary: 'De plus en plus d\'établissements adoptent des outils numériques pour la gestion administrative et pédagogique.',
  },
  {
    category: 'Examens',
    date: '2026-05-20',
    title: 'Préparer sereinement les examens de fin d\'année',
    summary: 'Conseils aux équipes pédagogiques pour organiser la planification des examens et la correction des copies.',
  },
]

export default function Landing() {
  const { user } = useAuth()
  const [schools, setSchools] = useState<PublicSchool[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/public/cities').then(r => setCities(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api.get('/public/schools', { params: city ? { city } : {} })
      .then(r => setSchools(r.data.data))
      .catch(() => setSchools([]))
      .finally(() => setLoading(false))
  }, [city])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafbfc' }}>
      {/* ── Header ── */}
      <Box sx={{ borderBottom: '1px solid #eef0f4', bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '50%', bgcolor: 'white',
                border: `2px solid ${ECOLIO_BLUE}20`, boxShadow: '0 2px 10px rgba(46,134,171,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
              }}>
                <Box component="img" src="/ecolio.png" alt="Écolio" sx={{ height: 28, width: 28, objectFit: 'contain' }} />
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: ECOLIO_NAVY, letterSpacing: -0.5 }}>Écolio</Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3.5 }}>
              {[{ id: 'fonctionnalites', label: 'Fonctionnalités' }, { id: 'actualites', label: 'Actualités' }, { id: 'ecoles', label: 'Écoles partenaires' }].map(l => (
                <Typography key={l.id} component="a" href={`#${l.id}`}
                  sx={{ color: 'text.secondary', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', '&:hover': { color: ECOLIO_BLUE } }}>
                  {l.label}
                </Typography>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {user ? (
                <Button component={Link} to="/" variant="contained"
                  startIcon={<FontAwesomeIcon icon={faGauge} style={{ fontSize: '0.8rem' }} />}
                  sx={{
                    borderRadius: 999, px: 2.5, fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(26,60,94,0.25)',
                    '&:hover': { boxShadow: '0 6px 18px rgba(26,60,94,0.32)' },
                  }}>
                  Retour au tableau de bord
                </Button>
              ) : (
                <>
                  <Button component={Link} to="/login" variant="outlined" sx={{ borderRadius: 999 }}>Se connecter</Button>
                  <Button component={Link} to="/register" variant="contained" sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderRadius: 999, fontWeight: 700 }}>
                    Inscrire votre école
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Hero ── */}
      <Box sx={{
        background: `linear-gradient(135deg, ${ECOLIO_NAVY} 0%, ${ECOLIO_BLUE} 100%)`, color: 'white',
        py: { xs: 7, md: 10 }, position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: -120, right: -100, width: 420, height: 420, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'absolute', bottom: -100, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7} className="animate-fade-in-up">
              <Chip label="Gestion scolaire nouvelle génération" size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', mb: 2, fontWeight: 600 }} />
              <Typography variant="h3" fontWeight={800} sx={{ mb: 2, letterSpacing: -1, fontSize: { xs: '1.9rem', md: '2.6rem' }, lineHeight: 1.15 }}>
                Toute la gestion de votre école, en une seule application
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.85, fontWeight: 300, mb: 4, fontSize: { xs: '1rem', md: '1.15rem' } }}>
                Élèves, notes, présences, finances, personnel, paye et communication —
                Écolio réunit tous les outils du quotidien scolaire pour les directions, enseignants,
                parents et personnel administratif.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                {user ? (
                  <Button component={Link} to="/" variant="contained" size="large"
                    sx={{
                      bgcolor: 'white', color: ECOLIO_NAVY, px: 4, py: 1.3, borderRadius: 999, fontWeight: 700,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      '&:hover': { bgcolor: '#f0f4ff', transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(0,0,0,0.22)' },
                      '& .MuiButton-endIcon': { transition: 'transform 0.15s' },
                      '&:hover .MuiButton-endIcon': { transform: 'translateX(3px)' },
                    }}
                    endIcon={<FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '0.8rem' }} />}>
                    Retour au tableau de bord
                  </Button>
                ) : (
                  <>
                    <Button component={Link} to="/register" variant="contained" size="large"
                      sx={{
                        bgcolor: 'white', color: ECOLIO_NAVY, px: 4, py: 1.3, borderRadius: 999, fontWeight: 700,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        '&:hover': { bgcolor: '#f0f4ff', transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(0,0,0,0.22)' },
                        '& .MuiButton-endIcon': { transition: 'transform 0.15s' },
                        '&:hover .MuiButton-endIcon': { transform: 'translateX(3px)' },
                      }}
                      endIcon={<FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '0.8rem' }} />}>
                      Inscrire votre école
                    </Button>
                    <Button component={Link} to="/login" variant="outlined" size="large"
                      sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', px: 3.5, borderRadius: 999, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}>
                      Se connecter
                    </Button>
                  </>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: { xs: 2.5, sm: 4 }, flexWrap: 'wrap' }}>
                {TRUST_POINTS.map(t => (
                  <Box key={t.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon icon={t.icon} style={{ fontSize: '0.85rem', opacity: 0.85 }} />
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>{t.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }} className="animate-scale-in">
              <Box sx={{
                width: '100%', aspectRatio: '1', borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Box sx={{
                  width: '62%', aspectRatio: '1', borderRadius: '50%', bgcolor: 'white',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  <Box component="img" src="/ecolio.png" alt="" sx={{ width: '58%', objectFit: 'contain' }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Comment ça marche ── */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Typography variant="h4" fontWeight={800} textAlign="center" sx={{ mb: 1, color: ECOLIO_NAVY }}>
          Opérationnel en trois étapes
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 5, maxWidth: 560, mx: 'auto' }}>
          Aucune installation, aucun matériel supplémentaire — tout se passe dans votre navigateur.
        </Typography>
        <Grid container spacing={3} className="stagger">
          {STEPS.map((s, i) => (
            <Grid item xs={12} md={4} key={s.title} className="animate-fade-in-up">
              <Box sx={{ textAlign: 'center', px: 2, position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <Box sx={{
                    display: { xs: 'none', md: 'block' }, position: 'absolute', top: 32, left: '58%', width: '90%',
                    borderTop: '2px dashed #d8dee8', zIndex: 0,
                  }} />
                )}
                <Box sx={{
                  width: 64, height: 64, borderRadius: '50%', bgcolor: ECOLIO_NAVY, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5,
                  position: 'relative', zIndex: 1, boxShadow: '0 8px 20px rgba(26,60,94,0.25)',
                }}>
                  <FontAwesomeIcon icon={s.icon} style={{ fontSize: '1.4rem' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} mb={1}>{i + 1}. {s.title}</Typography>
                <Typography variant="body2" color="text.secondary">{s.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ── Fonctionnalités ── */}
      <Box id="fonctionnalites" sx={{ bgcolor: 'white', borderTop: '1px solid #eef0f4', borderBottom: '1px solid #eef0f4', py: { xs: 6, md: 9 }, scrollMarginTop: '80px' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={800} textAlign="center" sx={{ mb: 1, color: ECOLIO_NAVY }}>
            Un outil pour chaque acteur de l'école
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 5, maxWidth: 560, mx: 'auto' }}>
            Dirigeants, enseignants, secrétariat, comptables, parents et élèves partagent la même plateforme.
          </Typography>
          <Grid container spacing={3} className="stagger">
            {FEATURES.map((f, i) => (
              <Grid item xs={12} sm={6} md={4} key={f.label} className="animate-fade-in-up">
                <Card sx={{
                  p: 3, height: '100%', borderRadius: 3, transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 32px rgba(0,0,0,0.08)' },
                }}>
                  <Box sx={{
                    width: 48, height: 48, borderRadius: 2, bgcolor: `${FEATURE_COLORS[i]}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                  }}>
                    <FontAwesomeIcon icon={f.icon} style={{ fontSize: '1.2rem', color: FEATURE_COLORS[i] }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={0.5}>{f.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Actualités éducation ── */}
      <Container maxWidth="lg" id="actualites" sx={{ py: { xs: 6, md: 9 }, scrollMarginTop: '80px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <FontAwesomeIcon icon={faNewspaper} style={{ fontSize: '1.3rem', color: ECOLIO_BLUE }} />
          <Typography variant="h4" fontWeight={800} sx={{ color: ECOLIO_NAVY }}>Actualités de l'éducation</Typography>
        </Box>
        <Grid container spacing={3} className="stagger">
          {NEWS_ITEMS.map(n => (
            <Grid item xs={12} md={4} key={n.title} className="animate-fade-in-up">
              <Card sx={{
                height: '100%', borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 32px rgba(0,0,0,0.08)' },
              }}>
                <Box sx={{ height: 6, bgcolor: ECOLIO_BLUE }} />
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Chip label={n.category} size="small" sx={{ alignSelf: 'flex-start', mb: 1.5, bgcolor: '#f0f4ff', color: ECOLIO_BLUE, fontWeight: 600 }} />
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>{n.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>{n.summary}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ── Écoles partenaires ── */}
      <Box sx={{ bgcolor: 'white', borderTop: '1px solid #eef0f4', borderBottom: '1px solid #eef0f4', py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg" id="ecoles" sx={{ scrollMarginTop: '80px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, flexWrap: 'wrap', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FontAwesomeIcon icon={faSchool} style={{ fontSize: '1.3rem', color: ECOLIO_BLUE }} />
              <Typography variant="h4" fontWeight={800} sx={{ color: ECOLIO_NAVY }}>Elles utilisent Écolio</Typography>
            </Box>
            {cities.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filtrer par ville</InputLabel>
                <Select value={city} onChange={e => setCity(e.target.value)} label="Filtrer par ville"
                  startAdornment={<FontAwesomeIcon icon={faLocationDot} style={{ fontSize: '0.8rem', color: '#9ca3af', marginRight: 8 }} />}>
                  <MenuItem value="">Toutes les villes</MenuItem>
                  {cities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : schools.length === 0 ? (
            <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#fafbfc', boxShadow: 'none', border: '1px dashed #d8dee8' }}>
              <Typography color="text.secondary">
                {city ? `Aucune école partenaire à ${city} pour le moment.` : 'Les écoles partenaires seront bientôt affichées ici.'}
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={3} className="stagger">
              {schools.map(s => (
                <Grid item xs={12} sm={6} md={4} key={s.id} className="animate-fade-in-up">
                  <Card sx={{
                    p: 3, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 28px rgba(0,0,0,0.08)' },
                  }}>
                    <Avatar src={s.logo_url} sx={{ width: 56, height: 56, bgcolor: s.primary_color || ECOLIO_NAVY, fontSize: '1.3rem' }}>
                      {s.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>{s.name}</Typography>
                      {s.city && (
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: '0.7rem' }} /> {s.city}
                        </Typography>
                      )}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {/* ── CTA final ── */}
      {!user && (
        <Box sx={{ background: `linear-gradient(135deg, ${ECOLIO_BLUE} 0%, ${ECOLIO_NAVY} 100%)`, color: 'white', py: { xs: 6, md: 8 } }}>
          <Container maxWidth="md" sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 1.5 }}>
              Prêt à moderniser la gestion de votre école ?
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, mb: 4, maxWidth: 480, mx: 'auto' }}>
              Rejoignez les établissements qui simplifient déjà leur quotidien administratif avec Écolio.
            </Typography>
            <Button component={Link} to="/register" variant="contained" size="large"
              sx={{
                bgcolor: 'white', color: ECOLIO_NAVY, px: 4.5, py: 1.4, borderRadius: 999, fontWeight: 700,
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                '&:hover': { bgcolor: '#f0f4ff' },
              }}
              endIcon={<FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '0.8rem' }} />}>
              Inscrire votre école gratuitement
            </Button>
          </Container>
        </Box>
      )}

      {/* ── Footer ── */}
      <Box sx={{ bgcolor: ECOLIO_NAVY, color: 'rgba(255,255,255,0.7)', py: 5 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box component="img" src="/ecolio.png" alt="Écolio" sx={{ height: 28, width: 28, objectFit: 'contain' }} />
                <Typography variant="subtitle1" fontWeight={800} color="white">Écolio</Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                La plateforme de gestion scolaire tout-en-un pour les établissements maternels, primaires et secondaires.
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="white" fontWeight={700} mb={1.5}>Navigation</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography component="a" href="#fonctionnalites" variant="body2" sx={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, '&:hover': { opacity: 1 } }}>Fonctionnalités</Typography>
                <Typography component="a" href="#actualites" variant="body2" sx={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, '&:hover': { opacity: 1 } }}>Actualités</Typography>
                <Typography component="a" href="#ecoles" variant="body2" sx={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, '&:hover': { opacity: 1 } }}>Écoles partenaires</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="white" fontWeight={700} mb={1.5}>Accès</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {user ? (
                  <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <Typography variant="body2" sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}>Retour au tableau de bord</Typography>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
                      <Typography variant="body2" sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}>Se connecter</Typography>
                    </Link>
                    <Link to="/register" style={{ color: 'inherit', textDecoration: 'none' }}>
                      <Typography variant="body2" sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}>Inscrire votre école</Typography>
                    </Link>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 3 }} />
          <Typography variant="body2" sx={{ opacity: 0.6, textAlign: { xs: 'center', sm: 'left' } }}>
            © {new Date().getFullYear()} Écolio — Gestion scolaire
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}
