import { useEffect, useState } from 'react'
import {
  Box, Container, Typography, Card, CardContent, TextField, Button, Grid, Alert, Chip, CircularProgress, Divider
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faPaperPlane, faMagnifyingGlass, faEnvelope, faPhone, faReply } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { useAuth } from '../../contexts/AuthContext'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import SiteHeader from '../../components/Site/SiteHeader'
import SiteFooter from '../../components/Site/SiteFooter'

interface ContactThread {
  reference: string
  subject: string | null
  message: string
  reply: string | null
  replied_at: string | null
  status: 'new' | 'read' | 'replied'
  created_at: string
}

const formatDateTime = (d: string) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

function ThreadCard({ t }: { t: ContactThread }) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>{t.subject || 'Message'} · <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>{t.reference}</Box></Typography>
          {t.reply
            ? <Chip label="Répondu" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 600 }} />
            : <Chip label="En attente de réponse" size="small" sx={{ bgcolor: '#fef3c7', color: '#d97706', fontWeight: 600 }} />}
        </Box>
        <Typography variant="caption" color="text.secondary">Envoyé le {formatDateTime(t.created_at)}</Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{t.message}</Typography>
        {t.reply && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: '#eff6ff', borderLeft: `3px solid ${ECOLIO_BLUE}` }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: ECOLIO_BLUE, display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <FontAwesomeIcon icon={faReply} style={{ fontSize: '0.7rem' }} />
              Réponse d'Écolio{t.replied_at ? ` · ${formatDateTime(t.replied_at)}` : ''}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{t.reply}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default function Contact() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sentRef, setSentRef] = useState('')
  const [threads, setThreads] = useState<ContactThread[]>([])

  const [lookup, setLookup] = useState({ email: '', reference: '' })
  const [lookupResult, setLookupResult] = useState<ContactThread | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [lookingUp, setLookingUp] = useState(false)

  const loadMine = () => {
    if (user) api.get('/contact/mine').then(r => setThreads(r.data.data)).catch(() => {})
  }
  useEffect(loadMine, [user])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSentRef('')
    if (!user && (!form.name.trim() || !form.email.trim())) { setError('Votre nom et votre email sont requis'); return }
    if (form.message.trim().length < 5) { setError('Votre message est trop court'); return }
    setSending(true)
    try {
      const r = await api.post('/contact', form)
      setSentRef(r.data.reference)
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
      if (!user) setLookup({ email: form.email, reference: r.data.reference })
      loadMine()
    } catch (err: any) {
      setError(err.response?.data?.message || "Impossible d'envoyer le message")
    } finally { setSending(false) }
  }

  const doLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLookupError(''); setLookupResult(null)
    if (!lookup.email.trim() || !lookup.reference.trim()) { setLookupError("Saisissez votre email et la référence reçue à l'envoi"); return }
    setLookingUp(true)
    try {
      const r = await api.post('/contact/lookup', lookup)
      setLookupResult(r.data.data)
    } catch (err: any) {
      setLookupError(err.response?.data?.message || 'Message introuvable')
    } finally { setLookingUp(false) }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafbfc' }}>
      <SiteHeader />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: ECOLIO_NAVY, mb: 1 }}>Contactez-nous</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
          Une question, un problème ou une suggestion ? Laissez-nous un message, l'équipe Écolio vous répondra ici.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Envoyer un message</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {sentRef && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Message envoyé ! Votre référence : <b>{sentRef}</b>.{' '}
                    {user
                      ? 'Vous recevrez une notification lorsque nous aurons répondu.'
                      : "Notez-la : avec votre email, elle vous permettra de consulter notre réponse sur cette page."}
                  </Alert>
                )}
                <form onSubmit={send}>
                  <Grid container spacing={2}>
                    {user ? (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Envoyé en tant que <b>{user.first_name} {user.last_name}</b> ({user.email})
                        </Typography>
                      </Grid>
                    ) : (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth required label="Nom complet" value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth required type="email" label="Email" value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth type="tel" label="Téléphone (facultatif)" value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12} sm={user ? 12 : 6}>
                      <TextField fullWidth label="Objet" value={form.subject} inputProps={{ maxLength: 200 }}
                        onChange={e => setForm({ ...form, subject: e.target.value })} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth required multiline minRows={5} label="Votre message" value={form.message}
                        inputProps={{ maxLength: 5000 }}
                        onChange={e => setForm({ ...form, message: e.target.value })} />
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button type="submit" variant="contained" disabled={sending}
                      startIcon={sending ? undefined : <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '0.8rem' }} />}>
                      {sending ? <CircularProgress size={20} color="inherit" /> : 'Envoyer'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="h6" fontWeight={700} mb={1.5}>Nos coordonnées</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon icon={faEnvelope} style={{ color: ECOLIO_BLUE }} /> oliviernbia@gmail.com
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon icon={faPhone} style={{ color: ECOLIO_BLUE }} /> +225 0554183378
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {!user && (
              <Card>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>Consulter une réponse</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Saisissez votre email et la référence reçue lors de l'envoi.
                  </Typography>
                  {lookupError && <Alert severity="error" sx={{ mb: 2 }}>{lookupError}</Alert>}
                  <form onSubmit={doLookup}>
                    <TextField fullWidth size="small" type="email" label="Email" value={lookup.email} sx={{ mb: 1.5 }}
                      onChange={e => setLookup({ ...lookup, email: e.target.value })} />
                    <TextField fullWidth size="small" label="Référence (ex. ECO-7KX3QM)" value={lookup.reference} sx={{ mb: 1.5 }}
                      onChange={e => setLookup({ ...lookup, reference: e.target.value })} />
                    <Button type="submit" variant="outlined" fullWidth disabled={lookingUp}
                      startIcon={<FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '0.8rem' }} />}>
                      Consulter
                    </Button>
                  </form>
                  {lookupResult && <Box sx={{ mt: 2 }}><ThreadCard t={lookupResult} /></Box>}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {user && threads.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" fontWeight={700} mb={2}>Mes messages</Typography>
            {threads.map(t => <ThreadCard key={t.reference} t={t} />)}
          </Box>
        )}
      </Container>
      <SiteFooter />
    </Box>
  )
}
