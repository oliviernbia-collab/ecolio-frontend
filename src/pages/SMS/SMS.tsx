import { useState, useEffect } from 'react'
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Autocomplete, Avatar, ToggleButtonGroup, ToggleButton, Divider
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faCommentSms, faUserGroup, faUsers, faSchool } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { SmsLog } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En cours', color: '#d97706', bg: '#fef9c3' },
  sent:    { label: 'Envoyé',   color: '#16a34a', bg: '#dcfce7' },
  partial: { label: 'Partiel',  color: '#d97706', bg: '#fef3c7' },
  failed:  { label: 'Échec',    color: '#dc2626', bg: '#fee2e2' },
}
const TRIGGER_LABELS: Record<string, string> = { manuel: 'Manuel', absence: 'Auto — absence', facture: 'Auto — facture' }
const SMS_SEGMENT_LENGTH = 160

export default function SMS() {
  const { showToast } = useToast()
  const [history, setHistory] = useState<SmsLog[]>([])
  const [loading, setLoading] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/sms'); setHistory(r.data.data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Services SMS</Typography>
          <Typography variant="body2" color="text.secondary">Notifications par SMS aux parents et au personnel</Typography>
        </Box>
        <Button variant="contained"
          startIcon={<FontAwesomeIcon icon={faCommentSms} style={{ fontSize: '0.85rem' }} />}
          onClick={() => setComposeOpen(true)}>
          Nouveau SMS
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
          <Typography variant="subtitle2" fontWeight={700}>Historique des envois</Typography>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>
        ) : history.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            <FontAwesomeIcon icon={faCommentSms} style={{ fontSize: '2.5rem', opacity: 0.2, marginBottom: 12 }} />
            <Typography>Aucun SMS envoyé pour l'instant</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Message</TableCell>
                  <TableCell className="hide-xs">Déclencheur</TableCell>
                  <TableCell>Destinataires</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell className="hide-xs">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map(h => {
                  const st = STATUS_CFG[h.status]
                  return (
                    <TableRow key={h.id} hover>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography variant="body2" noWrap>{h.content}</Typography>
                      </TableCell>
                      <TableCell className="hide-xs">
                        <Chip label={TRIGGER_LABELS[h.trigger_type] || h.trigger_type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{h.sent_count}/{h.recipient_count}</Typography>
                        {h.failed_count > 0 && <Typography variant="caption" color="error"> ({h.failed_count} échec{h.failed_count > 1 ? 's' : ''})</Typography>}
                      </TableCell>
                      <TableCell><Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 600 }} /></TableCell>
                      <TableCell className="hide-xs">
                        <Typography variant="caption" color="text.secondary">
                          {new Date(h.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <ComposeSmsDialog open={composeOpen} onClose={() => setComposeOpen(false)}
        onSent={(sent, total) => { showToast(`SMS envoyé à ${sent}/${total} destinataire${total > 1 ? 's' : ''}`, 'success'); load() }} />
    </Box>
  )
}

function ComposeSmsDialog({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: (sent: number, total: number) => void }) {
  const { showToast } = useToast()
  const [mode, setMode] = useState<'group' | 'individual'>('group')
  const [groups, setGroups] = useState<Array<{ id: string; label: string; count: number }>>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [recipients, setRecipients] = useState<any[]>([])
  const [recipientSearch, setRecipientSearch] = useState('')
  const [recipientOptions, setRecipientOptions] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return
    setMode('group'); setSelectedGroup(''); setRecipients([]); setContent('')
    api.get('/sms/groups').then(r => setGroups(r.data.data)).catch(() => {})
  }, [open])

  useEffect(() => {
    if (mode !== 'individual') return
    const t = setTimeout(() => {
      api.get('/sms/recipients', { params: { q: recipientSearch } }).then(r => setRecipientOptions(r.data.data)).catch(() => {})
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
        ? { recipient_group: selectedGroup, content }
        : { recipient_ids: recipients.map((u: any) => u.id), content }
      const r = await api.post('/sms', payload)
      onSent(r.data.sent, r.data.total)
      onClose()
    } catch (e: any) {
      showToast(e.response?.data?.message || "Erreur lors de l'envoi", 'error')
    } finally { setSending(false) }
  }

  const selectedGroupData = groups.find(g => g.id === selectedGroup)
  const segments = Math.max(1, Math.ceil(content.length / SMS_SEGMENT_LENGTH))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>Nouveau SMS</DialogTitle>
      <DialogContent sx={{ pt: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
              Envoyer à
            </Typography>
            <ToggleButtonGroup value={mode} exclusive onChange={(_, v) => { if (v) setMode(v) }} size="small" fullWidth>
              <ToggleButton value="group"><FontAwesomeIcon icon={faUserGroup} style={{ marginRight: 6, fontSize: '0.85rem' }} />Par groupe</ToggleButton>
              <ToggleButton value="individual"><FontAwesomeIcon icon={faUsers} style={{ marginRight: 6, fontSize: '0.85rem' }} />Individuel</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {mode === 'group' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {groups.map(g => (
                <Box key={g.id} onClick={() => setSelectedGroup(g.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2,
                    border: '2px solid', cursor: 'pointer', transition: 'all 0.15s',
                    borderColor: selectedGroup === g.id ? ECOLIO_BLUE : 'divider',
                    bgcolor: selectedGroup === g.id ? '#f0f7fd' : 'transparent',
                    '&:hover': { borderColor: ECOLIO_BLUE, bgcolor: '#f7fbff' },
                  }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: selectedGroup === g.id ? ECOLIO_BLUE : '#f1f5f9', color: selectedGroup === g.id ? 'white' : 'text.secondary' }}>
                    <FontAwesomeIcon icon={faUsers} style={{ fontSize: '0.95rem' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={selectedGroup === g.id ? 600 : 400}>{g.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{g.count} numéro{g.count > 1 ? 's' : ''} valide{g.count > 1 ? 's' : ''}</Typography>
                  </Box>
                  {selectedGroup === g.id && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ECOLIO_BLUE }} />}
                </Box>
              ))}
              {groups.some(g => g.count === 0) && (
                <Typography variant="caption" color="text.secondary">
                  Certains groupes ont 0 destinataire : aucun numéro de téléphone renseigné pour ces utilisateurs.
                </Typography>
              )}
            </Box>
          )}

          {mode === 'individual' && (
            <Autocomplete multiple options={recipientOptions}
              value={recipients} onChange={(_, v) => setRecipients(v)}
              onInputChange={(_, v) => setRecipientSearch(v)}
              getOptionLabel={u => `${u.first_name} ${u.last_name}`}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              noOptionsText="Tapez pour rechercher (numéro requis)…"
              renderOption={(props, u) => (
                <Box component="li" {...props} sx={{ gap: 1.5 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: ECOLIO_NAVY }}>{u.first_name[0]}</Avatar>
                  <Box>
                    <Typography variant="body2">{u.first_name} {u.last_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{u.phone}</Typography>
                  </Box>
                </Box>
              )}
              renderInput={params => <TextField {...params} label="Destinataires" placeholder="Rechercher par nom…" />}
            />
          )}

          {mode === 'group' && selectedGroupData && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#f0f7fd', borderRadius: 1.5, border: '1px solid #c7d7fd' }}>
              <FontAwesomeIcon icon={faSchool} style={{ color: ECOLIO_BLUE, fontSize: '0.9rem' }} />
              <Typography variant="caption" fontWeight={500}>
                Ce SMS sera envoyé à <strong>{selectedGroupData.count}</strong> {selectedGroupData.label.toLowerCase()}
              </Typography>
            </Box>
          )}

          <Divider />

          <TextField fullWidth multiline rows={5} label="Message *" value={content}
            onChange={e => setContent(e.target.value)} inputProps={{ maxLength: 480 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
            {content.length} caractère{content.length > 1 ? 's' : ''} · {segments} segment{segments > 1 ? 's' : ''} SMS
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={sending}>Annuler</Button>
        <Button variant="contained" disabled={sending || !content.trim() || (mode === 'group' && !selectedGroup) || (mode === 'individual' && !recipients.length)}
          startIcon={<FontAwesomeIcon icon={faCommentSms} style={{ fontSize: '0.8rem' }} />}
          onClick={handleSend}>
          {sending ? <CircularProgress size={18} color="inherit" /> : 'Envoyer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
