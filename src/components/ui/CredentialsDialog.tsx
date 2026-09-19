import { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, IconButton, Tooltip } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faKey, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons'

export interface Credential {
  label: string
  email: string
  password: string
}

interface Props {
  open: boolean
  credentials: Credential[]
  onClose: () => void
}

function CredentialRow({ cred }: { cred: Credential }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(`${cred.email} / ${cred.password}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <Box sx={{ p: 1.5, bgcolor: '#f8f9fc', borderRadius: 2, border: '1px solid #eef0f4' }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{cred.label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 0.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>{cred.email}</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{cred.password}</Typography>
        </Box>
        <Tooltip title={copied ? 'Copié !' : 'Copier'}>
          <IconButton size="small" onClick={copy}>
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} style={{ fontSize: '0.8rem', color: copied ? '#16a34a' : undefined }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

// Affiche un mot de passe temporaire généré par le serveur, une seule fois, juste après
// la création d'un compte — il n'est jamais récupérable ensuite (haché en base).
export default function CredentialsDialog({ open, credentials, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FontAwesomeIcon icon={faKey} style={{ color: '#1A3C5E', fontSize: '0.95rem' }} />
          </Box>
          <Typography fontWeight={700} fontSize="1rem">Identifiants générés</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          À transmettre à la personne concernée — ce mot de passe ne sera plus jamais affiché. Un changement sera exigé à la première connexion.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {credentials.map((c, i) => <CredentialRow key={i} cred={c} />)}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="contained" size="small">J'ai noté</Button>
      </DialogActions>
    </Dialog>
  )
}
