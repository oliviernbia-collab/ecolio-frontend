import { useState, useEffect, useRef } from 'react'
import {
  Box, Card, Typography, Button, List, ListItem, ListItemButton,
  Avatar, Chip, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Autocomplete, CircularProgress, InputBase, Paper,
  ToggleButtonGroup, ToggleButton, Badge
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faPaperPlane, faInbox, faShareFromSquare, faMagnifyingGlass,
  faArrowLeft, faReply, faUsers, faChalkboard,
  faUserGroup, faUserTie, faSchool
} from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { Message } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

const ROLE_COLORS: Record<string, string> = {
  director: '#1A3C5E', teacher: '#2E86AB', parent: '#16a34a',
  accountant: '#d97706', counselor: '#7c3aed', student: '#64748b',
  secretary: '#0ea5e9',
}
const ROLE_LABELS: Record<string, string> = {
  director: 'Directeur', teacher: 'Enseignant', parent: 'Parent',
  accountant: 'Comptable', counselor: 'Conseiller', student: 'Élève',
  librarian: 'Bibliothécaire', nurse: 'Infirmier', maintenance: 'Maintenance',
  super_admin: 'Admin', secretary: 'Secrétaire',
}

const GROUP_ICONS: Record<string, any> = {
  all_teachers: faChalkboard,
  all_parents:  faUserGroup,
  all_students: faUsers,
  all_staff:    faUserTie,
  all_school:   faUsers,
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function SenderAvatar({ name, role, url, size = 36 }: { name?: string; role?: string; url?: string; size?: number }) {
  return (
    <Avatar src={url || ''} sx={{ width: size, height: size, fontSize: size * 0.28, bgcolor: ROLE_COLORS[role || ''] || ECOLIO_NAVY, flexShrink: 0 }}>
      {!url && name?.[0]}
    </Avatar>
  )
}

// ── Boîte de réponse ─────────────────────────────────────────────────────────
function ReplyBox({ messageId, onReplied }: { messageId: number; onReplied: () => void }) {
  const { showToast } = useToast()
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!content.trim()) return
    setSending(true)
    try {
      await api.post(`/messages/${messageId}/reply`, { content })
      setContent('')
      showToast('Réponse envoyée', 'success')
      onReplied()
    } catch (e: any) {
      showToast(e.response?.data?.message || "Erreur lors de l'envoi", 'error')
    } finally { setSending(false) }
  }

  return (
    <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
        Votre réponse
      </Typography>
      <TextField
        fullWidth multiline rows={3} placeholder="Écrivez votre réponse…"
        value={content} onChange={e => setContent(e.target.value)}
        sx={{ mb: 1.5 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" size="small" disabled={sending || !content.trim()}
          startIcon={<FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '0.78rem' }} />}
          onClick={handleSend}>
          {sending ? <CircularProgress size={16} color="inherit" /> : 'Envoyer'}
        </Button>
      </Box>
    </Box>
  )
}

// ── Détail d'un message + fil de réponses ─────────────────────────────────────
function MessageDetail({
  message, onBack, onReplied, canReply,
}: {
  message: Message; onBack: () => void; onReplied: () => void; canReply: boolean
}) {
  return (
    <Box className="animate-fade-in" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Bouton retour mobile */}
      <Button startIcon={<FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '0.85rem' }} />}
        onClick={onBack} size="small"
        sx={{ display: { md: 'none' }, mb: 2, alignSelf: 'flex-start', color: 'text.secondary' }}>
        Retour
      </Button>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* En-tête du message */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, fontSize: { xs: '1rem', sm: '1.2rem' }, lineHeight: 1.3 }}>
            {message.subject || '(sans sujet)'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SenderAvatar name={message.sender_name} role={message.sender_role} url={message.sender_avatar} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600}>{message.sender_name}</Typography>
              <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip label={ROLE_LABELS[message.sender_role || ''] || message.sender_role} size="small"
                  sx={{ fontSize: '0.62rem', height: 18, bgcolor: ROLE_COLORS[message.sender_role || ''] || ECOLIO_NAVY, color: 'white' }} />
                <Typography variant="caption" color="text.secondary">
                  {new Date(message.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Typography>
                {message.recipient_count !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    · {message.recipient_count} destinataire{message.recipient_count > 1 ? 's' : ''}
                    {message.read_count !== undefined && ` · ${message.read_count} lu${message.read_count > 1 ? 's' : ''}`}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* Corps du message */}
        <Typography variant="body2" sx={{ lineHeight: 1.9, whiteSpace: 'pre-wrap', color: 'text.primary' }}>
          {message.content}
        </Typography>

        {/* Fil de réponses */}
        {message.replies && message.replies.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider textAlign="left" sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {message.replies.length} réponse{message.replies.length > 1 ? 's' : ''}
              </Typography>
            </Divider>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {message.replies.map(r => (
                <Box key={r.id} sx={{ pl: 2, borderLeft: `3px solid ${ROLE_COLORS[r.sender_role || ''] || '#e2e8f0'}`, ml: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <SenderAvatar name={r.sender_name} role={r.sender_role} url={r.sender_avatar} size={28} />
                    <Box>
                      <Typography variant="caption" fontWeight={600}>{r.sender_name}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center' }}>
                        <Chip label={ROLE_LABELS[r.sender_role || ''] || r.sender_role} size="small"
                          sx={{ fontSize: '0.58rem', height: 16, bgcolor: ROLE_COLORS[r.sender_role || ''] || ECOLIO_NAVY, color: 'white' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                          {new Date(r.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'text.secondary', pl: 0.5 }}>
                    {r.content}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Zone de réponse pour les enseignants */}
        {canReply && <ReplyBox messageId={message.id} onReplied={onReplied} />}
      </Box>
    </Box>
  )
}

// ── Dialog de composition (directeur / admin) ─────────────────────────────────
function ComposeDialog({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: (count: number) => void }) {
  const { showToast } = useToast()
  const [mode, setMode] = useState<'group' | 'individual'>('group')
  const [groups, setGroups] = useState<Array<{ id: string; label: string; count: number }>>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [recipients, setRecipients] = useState<any[]>([])
  const [recipientSearch, setRecipientSearch] = useState('')
  const [recipientOptions, setRecipientOptions] = useState<any[]>([])
  const [recipientLoading, setRecipientLoading] = useState(false)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return
    setMode('group'); setSelectedGroup(''); setRecipients([]); setSubject(''); setContent('')
    api.get('/messages/groups').then(r => setGroups(r.data.data)).catch(() => {})
  }, [open])

  useEffect(() => {
    if (mode !== 'individual') return
    setRecipientLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await api.get('/messages/recipients', { params: { q: recipientSearch } })
        setRecipientOptions(r.data.data)
      } finally { setRecipientLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [recipientSearch, mode])

  const handleSend = async () => {
    if (!content.trim()) { showToast('Le message est requis', 'warning'); return }
    if (mode === 'group' && !selectedGroup) { showToast('Sélectionnez un groupe', 'warning'); return }
    if (mode === 'individual' && !recipients.length) { showToast('Ajoutez au moins un destinataire', 'warning'); return }

    setSending(true)
    try {
      const payload = mode === 'group'
        ? { recipient_group: selectedGroup, subject, content }
        : { recipient_ids: recipients.map((u: any) => u.id), subject, content }
      const r = await api.post('/messages', payload)
      onSent(r.data.recipient_count || recipients.length)
      onClose()
    } catch (e: any) {
      showToast(e.response?.data?.message || "Erreur lors de l'envoi", 'error')
    } finally { setSending(false) }
  }

  const selectedGroupData = groups.find(g => g.id === selectedGroup)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={window.innerWidth < 600}>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        Nouveau message
      </DialogTitle>
      <DialogContent sx={{ pt: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Mode groupe / individuel */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
              Envoyer à
            </Typography>
            <ToggleButtonGroup value={mode} exclusive onChange={(_, v) => { if (v) setMode(v) }} size="small" fullWidth>
              <ToggleButton value="group">
                <FontAwesomeIcon icon={faUserGroup} style={{ marginRight: 6, fontSize: '0.85rem' }} />
                Par groupe
              </ToggleButton>
              <ToggleButton value="individual">
                <FontAwesomeIcon icon={faUsers} style={{ marginRight: 6, fontSize: '0.85rem' }} />
                Individuel
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Sélecteur de groupe */}
          {mode === 'group' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {groups.map(g => (
                <Box key={g.id}
                  onClick={() => setSelectedGroup(g.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2,
                    border: '2px solid', cursor: 'pointer', transition: 'all 0.15s',
                    borderColor: selectedGroup === g.id ? ECOLIO_BLUE : 'divider',
                    bgcolor: selectedGroup === g.id ? '#f0f7fd' : 'transparent',
                    '&:hover': { borderColor: ECOLIO_BLUE, bgcolor: '#f7fbff' },
                  }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: selectedGroup === g.id ? ECOLIO_BLUE : '#f1f5f9', color: selectedGroup === g.id ? 'white' : 'text.secondary' }}>
                    <FontAwesomeIcon icon={GROUP_ICONS[g.id] || faUsers} style={{ fontSize: '0.95rem' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={selectedGroup === g.id ? 600 : 400}>{g.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{g.count} personne{g.count > 1 ? 's' : ''}</Typography>
                  </Box>
                  {selectedGroup === g.id && (
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ECOLIO_BLUE }} />
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Sélection individuelle */}
          {mode === 'individual' && (
            <Autocomplete multiple options={recipientOptions} loading={recipientLoading}
              value={recipients} onChange={(_, v) => setRecipients(v)}
              onInputChange={(_, v) => setRecipientSearch(v)}
              getOptionLabel={u => `${u.first_name} ${u.last_name}`}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              noOptionsText="Tapez pour rechercher…"
              renderOption={(props, u) => (
                <Box component="li" {...props} sx={{ gap: 1.5 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: ROLE_COLORS[u.role] || ECOLIO_NAVY }}>
                    {u.first_name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{u.first_name} {u.last_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{ROLE_LABELS[u.role] || u.role} · {u.email}</Typography>
                  </Box>
                </Box>
              )}
              renderInput={params => (
                <TextField {...params} label="Destinataires" placeholder="Rechercher par nom ou rôle…"
                  InputProps={{ ...params.InputProps, endAdornment: <>{recipientLoading && <CircularProgress size={16} />}{params.InputProps.endAdornment}</> }} />
              )}
            />
          )}

          {/* Résumé des destinataires sélectionnés */}
          {mode === 'group' && selectedGroupData && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#f0f7fd', borderRadius: 1.5, border: '1px solid #c7d7fd' }}>
              <FontAwesomeIcon icon={faSchool} style={{ color: ECOLIO_BLUE, fontSize: '0.9rem' }} />
              <Typography variant="caption" fontWeight={500}>
                Ce message sera envoyé à <strong>{selectedGroupData.count}</strong> {selectedGroupData.label.toLowerCase()}
              </Typography>
            </Box>
          )}

          <Divider />

          {/* Sujet */}
          <TextField fullWidth label="Sujet" value={subject} onChange={e => setSubject(e.target.value)} size="small" />

          {/* Contenu */}
          <TextField fullWidth multiline rows={6} label="Message *" value={content} onChange={e => setContent(e.target.value)} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={sending}>Annuler</Button>
        <Button variant="contained" disabled={sending || !content.trim() || (mode === 'group' && !selectedGroup) || (mode === 'individual' && !recipients.length)}
          startIcon={<FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '0.8rem' }} />}
          onClick={handleSend}>
          {sending ? <CircularProgress size={18} color="inherit" /> : 'Envoyer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function Messages() {
  const { showToast } = useToast()
  const { user } = useAuth()
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox')
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showDetail, setShowDetail] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

  const canCompose = ['director', 'super_admin', 'secretary'].includes(user?.role || '')
  const canReply   = ['teacher', 'director', 'super_admin', 'secretary'].includes(user?.role || '')

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get(tab === 'inbox' ? '/messages' : '/messages/sent')
      setMessages(r.data.data)
      if (!selected) { setShowDetail(false) }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [tab])

  const openMessage = async (msg: Message) => {
    setShowDetail(true)
    try {
      const r = await api.get(`/messages/${msg.id}`)
      setSelected(r.data.data)
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read_at: new Date().toISOString() } : m))
    } catch { setSelected(msg) }
    setTimeout(() => detailRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  const handleReplied = async () => {
    if (!selected) return
    try {
      const r = await api.get(`/messages/${selected.id}`)
      setSelected(r.data.data)
    } catch {}
  }

  const filtered = messages.filter(m => {
    const q = search.toLowerCase()
    return !search || (m.subject || '').toLowerCase().includes(q) || (m.sender_name || '').toLowerCase().includes(q)
  })

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Messagerie</Typography>
          <Typography variant="body2" color="text.secondary">Communication école-famille</Typography>
        </Box>
        {canCompose && (
          <Button variant="contained"
            startIcon={<FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '0.85rem' }} />}
            onClick={() => setComposeOpen(true)}>
            Nouveau message
          </Button>
        )}
      </Box>

      <Card sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: { xs: 400, md: 600 }, overflow: 'hidden' }}>

        {/* ── Sidebar liste ── */}
        <Box sx={{
          width: { xs: '100%', md: 300 },
          borderRight: { md: '1px solid #f0f0f0' },
          borderBottom: { xs: '1px solid #f0f0f0', md: 'none' },
          display: { xs: showDetail ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column', flexShrink: 0,
        }}>
          {/* Onglets */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
            {[
              { id: 'inbox' as const, label: 'Reçus',   icon: faInbox },
              { id: 'sent'  as const, label: 'Envoyés', icon: faShareFromSquare },
            ].map(t => (
              <Button key={t.id}
                startIcon={<FontAwesomeIcon icon={t.icon} style={{ fontSize: '0.85rem' }} />}
                onClick={() => { setTab(t.id); setSelected(null); setShowDetail(false) }}
                size="small" fullWidth
                sx={{
                  borderRadius: 0, py: 1.5,
                  borderBottom: tab === t.id ? `2px solid ${ECOLIO_BLUE}` : '2px solid transparent',
                  color: tab === t.id ? ECOLIO_BLUE : 'text.secondary',
                  fontWeight: tab === t.id ? 600 : 400,
                }}>
                {t.label}
              </Button>
            ))}
          </Box>

          {/* Recherche */}
          <Box sx={{ p: 1.5, borderBottom: '1px solid #f0f0f0' }}>
            <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5, borderRadius: 2 }}>
              <FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: '#9ca3af', fontSize: '0.8rem', marginRight: 8 }} />
              <InputBase placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
                sx={{ fontSize: '0.85rem', flex: 1 }} />
            </Paper>
          </Box>

          {/* Liste */}
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress size={24} /></Box>
          ) : (
            <List dense sx={{ overflow: 'auto', flex: 1, py: 0 }}>
              {filtered.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <FontAwesomeIcon icon={faInbox} style={{ fontSize: '2rem', opacity: 0.2, marginBottom: 8 }} />
                  <Typography variant="caption" display="block">Aucun message</Typography>
                </Box>
              ) : filtered.map(msg => {
                const unread = tab === 'inbox' && !msg.read_at
                const isSelected = selected?.id === msg.id
                return (
                  <ListItem key={msg.id} disablePadding divider>
                    <ListItemButton selected={isSelected} onClick={() => openMessage(msg)}
                      sx={{
                        py: 1.5, px: 2, alignItems: 'flex-start', gap: 1.5,
                        '&.Mui-selected': { bgcolor: '#f0f7fd' },
                        bgcolor: unread ? '#fafeff' : 'transparent',
                      }}>
                      <SenderAvatar name={msg.sender_name} role={msg.sender_role} url={msg.sender_avatar} size={32} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5, mb: 0.25 }}>
                          <Typography variant="caption" fontWeight={unread ? 700 : 500} noWrap>
                            {tab === 'inbox' ? msg.sender_name : `${msg.recipient_count || 0} destinataire${(msg.recipient_count || 0) > 1 ? 's' : ''}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.65rem' }}>
                            {formatDate(msg.created_at)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={unread ? 600 : 400} noWrap display="block"
                          color={unread ? 'text.primary' : 'text.secondary'}>
                          {msg.subject || '(sans sujet)'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25, alignItems: 'center', flexWrap: 'wrap' }}>
                          {unread && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: ECOLIO_BLUE, flexShrink: 0 }} />}
                          {(msg.reply_count || 0) > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                              <FontAwesomeIcon icon={faReply} style={{ fontSize: '0.6rem', color: (msg.unread_reply_count || 0) > 0 ? ECOLIO_BLUE : '#9ca3af' }} />
                              <Typography variant="caption" sx={{
                                fontSize: '0.65rem',
                                color: (msg.unread_reply_count || 0) > 0 ? ECOLIO_BLUE : 'text.secondary',
                                fontWeight: (msg.unread_reply_count || 0) > 0 ? 700 : 400,
                              }}>
                                {msg.reply_count} rép.{(msg.unread_reply_count || 0) > 0 ? ` (${msg.unread_reply_count} non lu${msg.unread_reply_count! > 1 ? 's' : ''})` : ''}
                              </Typography>
                            </Box>
                          )}
                          {tab === 'sent' && msg.read_count !== undefined && (
                            <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>
                              {msg.read_count}/{msg.recipient_count} lu{(msg.read_count || 0) > 1 ? 's' : ''}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
          )}
        </Box>

        {/* ── Panneau détail ── */}
        <Box ref={detailRef} sx={{
          flex: 1, p: { xs: 2, sm: 3 }, overflow: 'auto',
          display: { xs: showDetail ? 'block' : 'none', md: 'block' },
        }}>
          {!selected || !showDetail ? (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', flexDirection: 'column', gap: 1.5, minHeight: 300 }}>
              <FontAwesomeIcon icon={faInbox} style={{ fontSize: '3.5rem', opacity: 0.18 }} />
              <Typography variant="body2" color="text.secondary">Sélectionnez un message</Typography>
              {canCompose && (
                <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => setComposeOpen(true)}
                  startIcon={<FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '0.8rem' }} />}>
                  Nouveau message
                </Button>
              )}
            </Box>
          ) : (
            <MessageDetail
              message={selected}
              onBack={() => { setShowDetail(false); setSelected(null) }}
              onReplied={handleReplied}
              canReply={canReply && tab === 'inbox'}
            />
          )}
        </Box>
      </Card>

      <ComposeDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={(count) => {
          showToast(`Message envoyé à ${count} destinataire${count > 1 ? 's' : ''} !`, 'success')
          load()
        }}
      />
    </Box>
  )
}
