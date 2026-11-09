import { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Alert, CircularProgress } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faKey, faUserGraduate, faUserGroup, faRotate } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { Student } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import { Credential } from '../../components/ui/CredentialsDialog'

type Account = 'student' | 'parent'

interface Props {
  student: Student | null
  onClose: () => void
  onCredentials: (creds: Credential[]) => void
}

// Identifiants de connexion de l'élève et de son parent, avec réinitialisation du mot de passe
// (le mot de passe initial n'est affiché qu'une fois, à l'inscription).
export default function LoginAccountsDialog({ student, onClose, onCredentials }: Props) {
  const { showToast } = useToast()
  const [confirming, setConfirming] = useState<Account | null>(null)
  const [loading, setLoading] = useState(false)

  const close = () => { setConfirming(null); onClose() }

  const reset = async (account: Account) => {
    if (!student) return
    setLoading(true)
    try {
      const r = await api.post(`/students/${student.id}/reset-password`, { account })
      const label = account === 'student'
        ? `Compte élève — ${student.first_name} ${student.last_name}`
        : `Compte parent — ${student.parent_name ?? ''}`
      showToast('Mot de passe réinitialisé', 'success')
      close()
      onCredentials([{ label, ...r.data.credentials }])
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Impossible de réinitialiser le mot de passe', 'error')
    } finally { setLoading(false) }
  }

  const rows: { account: Account; title: string; name?: string; email?: string | null; icon: typeof faKey; empty: string }[] = student ? [
    { account: 'student', title: 'Compte élève', name: `${student.first_name} ${student.last_name}`,
      email: student.student_login_email, icon: faUserGraduate, empty: "Cet élève n'a pas de compte de connexion." },
    { account: 'parent', title: 'Compte parent', name: student.parent_name,
      email: student.parent_id ? student.parent_email : null, icon: faUserGroup, empty: "Aucun parent n'est lié à cet élève." },
  ] : []

  return (
    <Dialog open={!!student} onClose={loading ? undefined : close} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FontAwesomeIcon icon={faKey} style={{ color: ECOLIO_NAVY, fontSize: '0.95rem' }} />
        </Box>
        <Typography fontWeight={700} fontSize="1rem">Identifiants de connexion</Typography>
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          L'élève et son parent se connectent sur la page « Se connecter » avec l'identifiant ci-dessous.
          En cas de mot de passe perdu, réinitialisez-le : un mot de passe temporaire sera affiché, à changer à la prochaine connexion.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {rows.map(r => (
            <Box key={r.account} sx={{ p: 1.5, bgcolor: '#f8f9fc', borderRadius: 2, border: '1px solid #eef0f4' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <FontAwesomeIcon icon={r.icon} style={{ color: ECOLIO_BLUE, fontSize: '0.8rem' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {r.title}{r.email && r.name ? ` — ${r.name}` : ''}
                </Typography>
              </Box>
              {r.email ? (
                <>
                  <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>{r.email}</Typography>
                  {confirming === r.account ? (
                    <Alert severity="warning" sx={{ mt: 1, py: 0.5, alignItems: 'center' }}
                      action={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button size="small" color="inherit" disabled={loading} onClick={() => setConfirming(null)}>Non</Button>
                          <Button size="small" color="warning" variant="contained" disabled={loading} onClick={() => reset(r.account)}>
                            {loading ? <CircularProgress size={16} color="inherit" /> : 'Oui'}
                          </Button>
                        </Box>
                      }>
                      L'ancien mot de passe ne fonctionnera plus.
                    </Alert>
                  ) : (
                    <Button size="small" sx={{ mt: 0.5, px: 0 }} onClick={() => setConfirming(r.account)}
                      startIcon={<FontAwesomeIcon icon={faRotate} style={{ fontSize: '0.75rem' }} />}>
                      Réinitialiser le mot de passe
                    </Button>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">{r.empty}</Typography>
              )}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={close} disabled={loading}>Fermer</Button>
      </DialogActions>
    </Dialog>
  )
}
