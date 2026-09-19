import { useState, useEffect, useRef } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Grid, MenuItem, Select,
  FormControl, InputLabel, CircularProgress, Avatar, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { downloadFile } from '../../lib/download'
import {
  faIdCard, faIdBadge, faFileText, faPrint, faDownload,
  faUsers, faCamera, faRefresh, faGraduationCap
} from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { Student, StaffMember, Class } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import { printStudentCard, printBulkStudentCards } from './StudentCard'
import { printStaffBadge, printBulkStaffBadges } from './StaffBadge'
import { printBulletin } from './BulletinPrint'
import { printCollante, ExamInfo } from './Collante'

const PERIODS = [
  { value: 'trimestre1', label: '1er Trimestre' },
  { value: 'trimestre2', label: '2ème Trimestre' },
  { value: 'trimestre3', label: '3ème Trimestre' },
]

// Texte blanc lisible (au lieu du gris quasi invisible par défaut de MUI) sur les boutons désactivés
const DISABLED_BTN_SX = {
  '&.Mui-disabled': { bgcolor: `${ECOLIO_NAVY}59`, color: 'rgba(255,255,255,0.75)' },
}

// Scrollbar visible pour les listes déroulantes (élèves / personnel)
const SCROLL_BOX_SX = {
  '&::-webkit-scrollbar': { width: 8 },
  '&::-webkit-scrollbar-track': { background: '#f1f3f6', borderRadius: 4 },
  '&::-webkit-scrollbar-thumb': { background: `${ECOLIO_BLUE}99`, borderRadius: 4, '&:hover': { background: ECOLIO_BLUE } },
  scrollbarWidth: 'thin' as const,
  scrollbarColor: `${ECOLIO_BLUE}99 #f1f3f6`,
}

// ── Photo upload mini-component ───────────────────────────────────────────────
function StudentPhotoCell({ student, onUpdated }: { student: Student; onUpdated: (url: string) => void }) {
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const fd = new FormData(); fd.append('photo', file)
      const r = await api.post(`/uploads/student/${student.id}`, fd)
      onUpdated(r.data.url)
      showToast('Photo mise à jour', 'success')
    } catch (e: any) {
      showToast(e.response?.data?.message || "Erreur lors de l'envoi de la photo", 'error')
    }
    finally { setLoading(false); if (inputRef.current) inputRef.current.value = '' }
  }

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Avatar src={student.photo_url || ''} sx={{ width: 40, height: 40, bgcolor: ECOLIO_NAVY, fontSize: '0.8rem', cursor: 'pointer' }}
        onClick={() => inputRef.current?.click()}>
        {student.first_name[0]}{student.last_name[0]}
      </Avatar>
      {loading
        ? <CircularProgress size={14} sx={{ position: 'absolute', bottom: -2, right: -2 }} />
        : (
          <Tooltip title="Changer la photo">
            <Box onClick={() => inputRef.current?.click()} sx={{
              position: 'absolute', bottom: -2, right: -2, width: 16, height: 16,
              bgcolor: ECOLIO_BLUE, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', border: '1px solid white',
            }}>
              <FontAwesomeIcon icon={faCamera} style={{ fontSize: '7px', color: 'white' }} />
            </Box>
          </Tooltip>
        )
      }
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleChange} />
    </Box>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ icon, color, bg, title, subtitle, children }: {
  icon: any; color: string; bg: string; title: string; subtitle: string; children: React.ReactNode
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesomeIcon icon={icon} style={{ color, fontSize: '1.1rem' }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
            <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CardsPage() {
  const { showToast } = useToast()
  const [school, setSchool]     = useState<any>(null)
  const [classes, setClasses]   = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [staff, setStaff]       = useState<StaffMember[]>([])

  // Carte scolaire
  const [cardClass,   setCardClass]   = useState('')
  const [cardStudent, setCardStudent] = useState('')
  const [cardLoading, setCardLoading] = useState(false)

  // Bulletin
  const [bullStudent, setBullStudent] = useState('')
  const [bullPeriod,  setBullPeriod]  = useState('trimestre1')
  const [bullLoading, setBullLoading] = useState(false)

  // Badge
  const [badgeStaff,   setBadgeStaff]   = useState('')
  const [badgeLoading, setBadgeLoading] = useState(false)

  // Relevé / collante (classes d'examen)
  const [collStudent, setCollStudent] = useState('')
  const [collType,    setCollType]    = useState<ExamInfo['type']>('bac')
  const [collSerie,   setCollSerie]   = useState('')
  const [collLoading, setCollLoading] = useState(false)

  // Chargement initial
  useEffect(() => {
    Promise.all([
      api.get('/schools'),
      api.get('/classes'),
      api.get('/staff'),
    ]).then(([sc, cl, st]) => {
      setSchool(sc.data.school)
      setClasses(cl.data.data)
      setStaff(st.data.data)
    }).catch(() => {})
  }, [])

  // Élèves selon la classe choisie
  useEffect(() => {
    if (!cardClass) { setStudents([]); return }
    api.get('/students', { params: { class_id: cardClass } })
      .then(r => setStudents(r.data.data))
      .catch(() => {})
  }, [cardClass])

  const currentYear = school
    ? `${new Date(school.start_date || Date.now()).getFullYear()}-${new Date(school.end_date || Date.now()).getFullYear() + 1}`
    : new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)

  // ── Carte scolaire ──────────────────────────────────────────────────────────
  const handlePrintCard = async (single = true) => {
    if (!school) return
    setCardLoading(true)
    try {
      if (single) {
        const s = students.find(s => String(s.id) === cardStudent)
        if (!s) { showToast('Sélectionnez un élève', 'warning'); return }
        await printStudentCard(s, school, currentYear)
      } else {
        if (!students.length) { showToast('Aucun élève dans cette classe', 'warning'); return }
        await printBulkStudentCards(students, school, currentYear)
      }
    } finally { setCardLoading(false) }
  }

  // ── Bulletin ────────────────────────────────────────────────────────────────
  const handlePrintBulletin = async () => {
    if (!bullStudent || !school) { showToast('Sélectionnez un élève', 'warning'); return }
    setBullLoading(true)
    try {
      const r = await api.get(`/grades/bulletin/${bullStudent}`, { params: { period: bullPeriod } })
      const periodLabel = PERIODS.find(p => p.value === bullPeriod)?.label || bullPeriod
      await printBulletin(r.data.data, school, periodLabel)
    } catch { showToast('Erreur lors de la génération du bulletin', 'error') }
    finally { setBullLoading(false) }
  }

  // ── Badge personnel ─────────────────────────────────────────────────────────
  const handlePrintBadge = async (all = false) => {
    if (!school) return
    setBadgeLoading(true)
    try {
      if (all) {
        await printBulkStaffBadges(staff.map(s => ({
          id: s.id, first_name: s.first_name, last_name: s.last_name,
          email: s.email, phone: s.phone, position: s.position, role: s.role,
          avatar_url: s.avatar_url,
        })), school)
      } else {
        const s = staff.find(s => String(s.id) === badgeStaff)
        if (!s) { showToast('Sélectionnez un membre du personnel', 'warning'); return }
        await printStaffBadge({
          id: s.id, first_name: s.first_name, last_name: s.last_name,
          email: s.email, phone: s.phone, position: s.position, role: s.role,
          avatar_url: s.avatar_url,
        }, school)
      }
    } finally { setBadgeLoading(false) }
  }

  // ── Relevé / collante ───────────────────────────────────────────────────────
  const handlePrintCollante = async () => {
    if (!collStudent || !school) { showToast('Sélectionnez un élève', 'warning'); return }
    setCollLoading(true)
    try {
      const r = await api.get(`/grades/bulletin/${collStudent}`)
      const { student, subjects, generalAverage } = r.data.data
      const info: ExamInfo = { type: collType, session: currentYear, serie: collSerie || undefined }
      await printCollante(student, subjects, generalAverage, school, info)
    } catch { showToast('Erreur lors de la génération du relevé', 'error') }
    finally { setCollLoading(false) }
  }

  const bullStudents = cardClass
    ? students
    : (() => {
        // Charger tous les élèves si aucune classe sélectionnée pour le bulletin
        return students
      })()

  const [allStudents, setAllStudents] = useState<Student[]>([])
  useEffect(() => {
    api.get('/students').then(r => setAllStudents(r.data.data)).catch(() => {})
  }, [])

  const updateStudentPhoto = (studentId: number, url: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, photo_url: url } : s))
    setAllStudents(prev => prev.map(s => s.id === studentId ? { ...s, photo_url: url } : s))
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Cartes, Badges & Bulletins</Typography>
        <Typography variant="body2" color="text.secondary">
          Génération automatique de documents imprimables ou PDF
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* ── Cartes scolaires ─────────────────────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <SectionCard icon={faIdCard} color="#1A3C5E" bg="#e8f0fe" title="Carte scolaire" subtitle="Pour chaque élève inscrit">
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Classe</InputLabel>
              <Select value={cardClass} onChange={e => { setCardClass(e.target.value); setCardStudent('') }} label="Classe">
                <MenuItem value="">— Toutes —</MenuItem>
                {classes.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Élève</InputLabel>
              <Select value={cardStudent} onChange={e => setCardStudent(e.target.value)} label="Élève">
                <MenuItem value="">— Sélectionner —</MenuItem>
                {students.filter(s => s.status !== 'archive').map(s => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {s.first_name} {s.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Liste des élèves de la classe avec upload photo */}
            {cardClass && students.length > 0 && (
              <Box sx={{ mb: 2, maxHeight: 180, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 1, ...SCROLL_BOX_SX }}>
                {students.filter(s => s.status !== 'archive').map(s => (
                  <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderBottom: '1px solid #fafafa' }}>
                    <StudentPhotoCell student={s} onUpdated={url => updateStudentPhoto(s.id, url)} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={600} noWrap>{s.first_name} {s.last_name}</Typography>
                      <Typography variant="caption" sx={{ color: ECOLIO_BLUE, fontFamily: 'monospace', display: 'block', fontSize: '0.65rem' }}>{s.matricule}</Typography>
                    </Box>
                    {s.photo_url && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#16a34a' }} />}
                  </Box>
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="contained" fullWidth disabled={!cardStudent || cardLoading} sx={DISABLED_BTN_SX}
                startIcon={cardLoading ? <CircularProgress size={14} color="inherit" /> : <FontAwesomeIcon icon={faPrint} style={{ fontSize: '0.85rem' }} />}
                onClick={() => handlePrintCard(true)}>
                Carte individuelle
              </Button>
              <Button variant="outlined" fullWidth disabled={!cardClass || !students.length || cardLoading}
                startIcon={<FontAwesomeIcon icon={faUsers} style={{ fontSize: '0.85rem' }} />}
                onClick={() => handlePrintCard(false)}>
                Toute la classe ({students.filter(s => s.status !== 'archive').length})
              </Button>
            </Box>
          </SectionCard>
        </Grid>

        {/* ── Bulletins ──────────────────────────────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <SectionCard icon={faFileText} color="#16a34a" bg="#dcfce7" title="Bulletin de notes" subtitle="Avec moyennes et appréciations">
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Élève</InputLabel>
              <Select value={bullStudent} onChange={e => setBullStudent(e.target.value)} label="Élève">
                <MenuItem value="">— Sélectionner —</MenuItem>
                {allStudents.filter(s => s.status !== 'archive').map(s => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {s.first_name} {s.last_name}
                    {s.class_name ? ` (${s.class_name})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
              <InputLabel>Période</InputLabel>
              <Select value={bullPeriod} onChange={e => setBullPeriod(e.target.value)} label="Période">
                {PERIODS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </Select>
            </FormControl>

            <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Le bulletin inclut : notes par matière, coefficient, moyenne pondérée,
                appréciation (Très Bien → Insuffisant) et zones de signature.
              </Typography>
            </Box>

            <Button variant="contained" fullWidth color="success" disabled={!bullStudent || bullLoading}
              startIcon={bullLoading ? <CircularProgress size={14} color="inherit" /> : <FontAwesomeIcon icon={faPrint} style={{ fontSize: '0.85rem' }} />}
              onClick={handlePrintBulletin} sx={{ mb: 1 }}>
              Générer le bulletin (impression navigateur)
            </Button>
            <Button variant="outlined" fullWidth color="success" disabled={!bullStudent}
              startIcon={<FontAwesomeIcon icon={faDownload} style={{ fontSize: '0.85rem' }} />}
              onClick={() => downloadFile(`/grades/bulletin/${bullStudent}/pdf${bullPeriod ? `?period=${bullPeriod}` : ''}`, 'bulletin.pdf')}>
              Télécharger le PDF
            </Button>
          </SectionCard>
        </Grid>

        {/* ── Badges personnel ──────────────────────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <SectionCard icon={faIdBadge} color="#d97706" bg="#fef3c7" title="Badge personnel" subtitle="Pour enseignants, direction, admin">
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Membre du personnel</InputLabel>
              <Select value={badgeStaff} onChange={e => setBadgeStaff(e.target.value)} label="Membre du personnel">
                <MenuItem value="">— Sélectionner —</MenuItem>
                {staff.map(s => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {s.first_name} {s.last_name} — {s.position || s.role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 1, mb: 2, ...SCROLL_BOX_SX }}>
              {staff.map(s => (
                <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderBottom: '1px solid #fafafa' }}>
                  <Avatar src={(s as any).avatar_url || ''} sx={{ width: 34, height: 34, bgcolor: '#d97706', fontSize: '0.7rem' }}>
                    {s.first_name[0]}{s.last_name[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={600} noWrap>{s.first_name} {s.last_name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                      {s.position || s.role}
                    </Typography>
                  </Box>
                  {(s as any).avatar_url && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#16a34a' }} />}
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="contained" fullWidth
                sx={{ '&:not(.Mui-disabled)': { backgroundImage: 'none !important', bgcolor: '#d97706 !important' }, '&:hover': { bgcolor: '#b45309 !important' }, ...DISABLED_BTN_SX }}
                disabled={!badgeStaff || badgeLoading}
                startIcon={badgeLoading ? <CircularProgress size={14} color="inherit" /> : <FontAwesomeIcon icon={faPrint} style={{ fontSize: '0.85rem' }} />}
                onClick={() => handlePrintBadge(false)}>
                Badge individuel
              </Button>
              <Button variant="outlined" fullWidth disabled={!staff.length || badgeLoading}
                sx={{ borderColor: '#d97706', color: '#d97706', '&:hover': { borderColor: '#b45309', color: '#b45309' } }}
                startIcon={<FontAwesomeIcon icon={faUsers} style={{ fontSize: '0.85rem' }} />}
                onClick={() => handlePrintBadge(true)}>
                Tout le personnel ({staff.length})
              </Button>
            </Box>
          </SectionCard>
        </Grid>

        {/* ── Relevé annuel / collante (classes d'examen) ─────────────────────── */}
        <Grid item xs={12} md={4}>
          <SectionCard icon={faGraduationCap} color="#7c3aed" bg="#ede9fe" title="Relevé annuel" subtitle="Pour les classes d'examen (BEPC, BAC)">
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Élève</InputLabel>
              <Select value={collStudent} onChange={e => setCollStudent(e.target.value)} label="Élève">
                <MenuItem value="">— Sélectionner —</MenuItem>
                {allStudents.filter(s => s.status !== 'archive').map(s => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {s.first_name} {s.last_name}
                    {s.class_name ? ` (${s.class_name})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select value={collType} onChange={e => setCollType(e.target.value as ExamInfo['type'])} label="Type">
                <MenuItem value="bepc">BEPC</MenuItem>
                <MenuItem value="bac">Baccalauréat</MenuItem>
                <MenuItem value="generique">Relevé général</MenuItem>
              </Select>
            </FormControl>

            {collType === 'bac' && (
              <TextField fullWidth size="small" label="Série (ex. C, D, A4)" value={collSerie}
                onChange={e => setCollSerie(e.target.value)} sx={{ mb: 2.5 }} />
            )}

            <Box sx={{ p: 1.5, bgcolor: '#faf5ff', borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Document interne basé sur les notes annuelles enregistrées (moyenne, matières,
                coefficients). Ne remplace pas l'attestation officielle de la DECO.
              </Typography>
            </Box>

            <Button variant="contained" fullWidth disabled={!collStudent || collLoading}
              sx={{ '&:not(.Mui-disabled)': { backgroundImage: 'none !important', bgcolor: '#7c3aed !important' }, '&:hover': { bgcolor: '#6d28d9 !important' }, ...DISABLED_BTN_SX }}
              startIcon={collLoading ? <CircularProgress size={14} color="inherit" /> : <FontAwesomeIcon icon={faPrint} style={{ fontSize: '0.85rem' }} />}
              onClick={handlePrintCollante}>
              Générer le relevé
            </Button>
          </SectionCard>
        </Grid>

      </Grid>

      {/* ── Info panneau ───────────────────────────────────────────────────────── */}
      <Card sx={{ mt: 3, bgcolor: '#f8fafc' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>Comment générer un PDF ?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            1. Sélectionnez les paramètres ci-dessus et cliquez sur <strong>Générer / Imprimer</strong>.<br />
            2. Une fenêtre d'aperçu s'ouvre avec le document mis en forme.<br />
            3. Cliquez sur <strong>🖨️ Imprimer / PDF</strong> dans l'aperçu.<br />
            4. Dans la boîte d'impression du navigateur, sélectionnez <strong>"Enregistrer en PDF"</strong> comme imprimante.<br />
            5. Le PDF est sauvegardé sur votre ordinateur.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
