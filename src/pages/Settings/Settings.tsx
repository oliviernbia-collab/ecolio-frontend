import { useState, useEffect, useRef } from 'react'
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid, Divider,
  CircularProgress, Avatar, Tabs, Tab, IconButton, Tooltip, Badge, Switch, FormControlLabel
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faFloppyDisk, faSchool, faUser, faLock, faCamera, faImage, faCreditCard } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { useAuth } from '../../contexts/AuthContext'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import SubscriptionPanel from '../../components/Subscription/SubscriptionPanel'
import PasswordField from '../../components/ui/PasswordField'

export default function Settings() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const [tab, setTab]       = useState(0)
  const [school, setSchool] = useState<any>(null)
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    phone:      user?.phone      || '',
  })
  const [pwd, setPwd]     = useState({ current_password: '', new_password: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [avatarLoading, setAvatarLoading]   = useState(false)
  const [logoLoading, setLogoLoading]       = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get('/schools').then(r => setSchool(r.data.school || {})).catch(() => {})
  }, [])

  // ── Photo de profil ──────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { showToast('Fichier trop volumineux (max 3 Mo)', 'error'); return }
    setAvatarLoading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const r = await api.post('/uploads/avatar', fd)
      updateUser({ avatar_url: r.data.url })
      showToast('Photo de profil mise à jour', 'success')
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur lors de l\'upload', 'error')
    } finally { setAvatarLoading(false); if (avatarInputRef.current) avatarInputRef.current.value = '' }
  }

  // ── Logo école ───────────────────────────────────────────────────────────────
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { showToast('Fichier trop volumineux (max 3 Mo)', 'error'); return }
    setLogoLoading(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const r = await api.post('/uploads/school-logo', fd)
      setSchool((s: any) => ({ ...s, logo_url: r.data.url }))
      showToast('Logo mis à jour', 'success')
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur lors de l\'upload', 'error')
    } finally { setLogoLoading(false); if (logoInputRef.current) logoInputRef.current.value = '' }
  }

  const saveSchool = async () => {
    setSaving(true)
    try { await api.put('/schools', school); showToast('École mise à jour', 'success') }
    catch (e: any) { showToast(e.response?.data?.message || 'Erreur', 'error') }
    finally { setSaving(false) }
  }

  const saveProfile = async () => {
    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      showToast('Prénom et nom sont requis', 'warning'); return
    }
    setSaving(true)
    try {
      await api.put('/auth/me', profile)
      updateUser(profile)
      showToast('Profil mis à jour', 'success')
    } catch (e: any) { showToast(e.response?.data?.message || 'Erreur', 'error') }
    finally { setSaving(false) }
  }

  const savePassword = async () => {
    if (pwd.new_password !== pwd.confirm) { showToast('Les mots de passe ne correspondent pas', 'error'); return }
    if (pwd.new_password.length < 8) { showToast('Mot de passe trop court (min. 8 caractères)', 'warning'); return }
    setSaving(true)
    try {
      await api.put('/auth/change-password', { current_password: pwd.current_password, new_password: pwd.new_password })
      setPwd({ current_password: '', new_password: '', confirm: '' })
      showToast('Mot de passe modifié avec succès', 'success')
    } catch (e: any) { showToast(e.response?.data?.message || 'Erreur', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Paramètres</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
        sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 500 } }}>
        <Tab icon={<FontAwesomeIcon icon={faSchool} style={{ fontSize: '0.9rem' }} />} iconPosition="start" label="École" />
        <Tab icon={<FontAwesomeIcon icon={faUser}   style={{ fontSize: '0.9rem' }} />} iconPosition="start" label="Mon profil" />
        <Tab icon={<FontAwesomeIcon icon={faLock}   style={{ fontSize: '0.9rem' }} />} iconPosition="start" label="Mot de passe" />
        {user?.school_id && (
          <Tab icon={<FontAwesomeIcon icon={faCreditCard} style={{ fontSize: '0.9rem' }} />} iconPosition="start" label="Abonnement" />
        )}
      </Tabs>

      {/* ── Onglet École ─────────────────────────────────────────────────────── */}
      {tab === 0 && school && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2.5}>Informations de l'école</Typography>

            {/* Logo upload */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  src={school.logo_url || ''}
                  sx={{ width: 72, height: 72, bgcolor: ECOLIO_NAVY, fontSize: '1.5rem', border: '3px solid #e8f0fe' }}
                >
                  {school.name?.[0] || 'É'}
                </Avatar>
                <Tooltip title="Changer le logo">
                  <IconButton
                    size="small"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoLoading}
                    sx={{
                      position: 'absolute', bottom: -4, right: -4,
                      bgcolor: ECOLIO_BLUE, color: 'white', width: 26, height: 26,
                      '&:hover': { bgcolor: ECOLIO_NAVY },
                    }}
                  >
                    {logoLoading
                      ? <CircularProgress size={12} color="inherit" />
                      : <FontAwesomeIcon icon={faImage} style={{ fontSize: '0.65rem' }} />
                    }
                  </IconButton>
                </Tooltip>
                <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleLogoChange} />
              </Box>
              <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
                <Typography variant="body2" fontWeight={600}>{school.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Cliquez sur l'icône pour changer le logo (JPEG, PNG · max 3 Mo)
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Nom de l'école" value={school.name || ''}
                  onChange={e => setSchool({ ...school, name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" value={school.email || ''}
                  onChange={e => setSchool({ ...school, email: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Téléphone" value={school.phone || ''}
                  onChange={e => setSchool({ ...school, phone: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Ville" value={school.city || ''}
                  onChange={e => setSchool({ ...school, city: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Adresse" value={school.address || ''}
                  onChange={e => setSchool({ ...school, address: e.target.value })} multiline rows={2} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={!!school.is_public}
                    onChange={e => setSchool({ ...school, is_public: e.target.checked })} />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Visible sur la page d'accueil publique</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Seuls le nom, la ville et le logo de l'école seront affichés publiquement, avec un filtre par ville.
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              {/* Couleurs */}
              <Grid item xs={6} sm={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Couleur principale</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input type="color" value={school.primary_color || ECOLIO_NAVY}
                      onChange={e => setSchool({ ...school, primary_color: e.target.value })}
                      style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
                    <Typography variant="caption">{school.primary_color}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Couleur secondaire</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input type="color" value={school.secondary_color || ECOLIO_BLUE}
                      onChange={e => setSchool({ ...school, secondary_color: e.target.value })}
                      style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
                    <Typography variant="caption">{school.secondary_color}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Box mt={3} display="flex" justifyContent="flex-end">
              <Button variant="contained"
                startIcon={<FontAwesomeIcon icon={faFloppyDisk} style={{ fontSize: '0.85rem' }} />}
                onClick={saveSchool} disabled={saving}>
                {saving ? <CircularProgress size={18} /> : 'Enregistrer'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Onglet Mon profil ─────────────────────────────────────────────────── */}
      {tab === 1 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            {/* Avatar upload */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3, flexWrap: 'wrap' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Tooltip title="Changer la photo">
                    <IconButton
                      size="small"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarLoading}
                      sx={{
                        bgcolor: ECOLIO_BLUE, color: 'white', width: 30, height: 30,
                        border: '2px solid white',
                        '&:hover': { bgcolor: ECOLIO_NAVY },
                      }}
                    >
                      {avatarLoading
                        ? <CircularProgress size={13} color="inherit" />
                        : <FontAwesomeIcon icon={faCamera} style={{ fontSize: '0.7rem' }} />
                      }
                    </IconButton>
                  </Tooltip>
                }
              >
                <Avatar
                  src={user?.avatar_url || ''}
                  sx={{ width: 72, height: 72, bgcolor: ECOLIO_NAVY, fontSize: '1.5rem', cursor: 'pointer' }}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </Avatar>
              </Badge>
              <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />

              <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
                <Typography variant="h6">{user?.first_name} {user?.last_name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Cliquez sur la photo pour la modifier (JPEG, PNG · max 3 Mo)
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Prénom *" value={profile.first_name}
                  onChange={e => setProfile({ ...profile, first_name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Nom *" value={profile.last_name}
                  onChange={e => setProfile({ ...profile, last_name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Téléphone" value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })} />
              </Grid>
            </Grid>

            <Box mt={3} display="flex" justifyContent="flex-end">
              <Button variant="contained"
                startIcon={<FontAwesomeIcon icon={faFloppyDisk} style={{ fontSize: '0.85rem' }} />}
                onClick={saveProfile} disabled={saving}>
                {saving ? <CircularProgress size={18} /> : 'Enregistrer'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Onglet Mot de passe ───────────────────────────────────────────────── */}
      {tab === 2 && (
        <Card sx={{ maxWidth: 480 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2.5}>Changer le mot de passe</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <PasswordField fullWidth label="Mot de passe actuel"
                value={pwd.current_password}
                onChange={e => setPwd({ ...pwd, current_password: e.target.value })} />
              <PasswordField fullWidth label="Nouveau mot de passe"
                value={pwd.new_password}
                onChange={e => setPwd({ ...pwd, new_password: e.target.value })}
                helperText="Minimum 8 caractères" />
              <PasswordField fullWidth label="Confirmer le mot de passe"
                value={pwd.confirm}
                onChange={e => setPwd({ ...pwd, confirm: e.target.value })}
                error={!!pwd.confirm && pwd.confirm !== pwd.new_password}
                helperText={pwd.confirm && pwd.confirm !== pwd.new_password ? 'Les mots de passe ne correspondent pas' : ''} />
            </Box>
            <Box mt={3} display="flex" justifyContent="flex-end">
              <Button variant="contained"
                startIcon={<FontAwesomeIcon icon={faLock} style={{ fontSize: '0.85rem' }} />}
                onClick={savePassword} disabled={saving}>
                {saving ? <CircularProgress size={18} /> : 'Modifier'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Onglet Abonnement ────────────────────────────────────────────────── */}
      {tab === 3 && user?.school_id && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2.5}>Abonnement</Typography>
            <SubscriptionPanel />
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
