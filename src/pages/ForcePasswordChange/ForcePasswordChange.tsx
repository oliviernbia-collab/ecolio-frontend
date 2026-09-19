import { useState } from 'react'
import { Box, Card, CardContent, Typography, Button, TextField, Alert } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { useAuth } from '../../contexts/AuthContext'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'

export default function ForcePasswordChange() {
  const { updateUser, logout } = useAuth()
  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setError('')
    if (pwd.new_password.length < 8) { setError('Le nouveau mot de passe doit contenir au moins 8 caractères'); return }
    if (pwd.new_password !== pwd.confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setSaving(true)
    try {
      await api.put('/auth/change-password', { current_password: pwd.current_password, new_password: pwd.new_password })
      updateUser({ must_change_password: false })
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors du changement de mot de passe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="#F4F6F8" p={2}>
      <Card sx={{ maxWidth: 440, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} color={ECOLIO_NAVY} mb={1}>
            Changement de mot de passe requis
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Pour des raisons de sécurité, vous devez définir un nouveau mot de passe personnel avant de continuer.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField fullWidth label="Mot de passe actuel" type="password"
              value={pwd.current_password}
              onChange={e => setPwd({ ...pwd, current_password: e.target.value })} />
            <TextField fullWidth label="Nouveau mot de passe" type="password"
              value={pwd.new_password}
              onChange={e => setPwd({ ...pwd, new_password: e.target.value })}
              helperText="Minimum 8 caractères" />
            <TextField fullWidth label="Confirmer le mot de passe" type="password"
              value={pwd.confirm}
              onChange={e => setPwd({ ...pwd, confirm: e.target.value })}
              error={!!pwd.confirm && pwd.confirm !== pwd.new_password}
              helperText={pwd.confirm && pwd.confirm !== pwd.new_password ? 'Les mots de passe ne correspondent pas' : ''} />
          </Box>
          <Box mt={3} display="flex" flexDirection="column" gap={1}>
            <Button fullWidth variant="contained"
              sx={{ '&:not(.Mui-disabled)': { backgroundImage: 'none !important', bgcolor: `${ECOLIO_BLUE} !important` } }}
              startIcon={<FontAwesomeIcon icon={faLock} style={{ fontSize: '0.85rem' }} />}
              onClick={submit} disabled={saving}>
              Valider le nouveau mot de passe
            </Button>
            <Button fullWidth variant="text" onClick={logout}>Se déconnecter</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
