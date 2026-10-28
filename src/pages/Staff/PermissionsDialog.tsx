import { useState, useEffect, useMemo } from 'react'
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, FormControlLabel, Chip, CircularProgress, Alert, Divider
} from '@mui/material'
import api from '../../lib/axios'
import { StaffMember } from '../../types'
import { useToast } from '../../contexts/ToastContext'

interface PermissionRow { code: string; label: string; module: string; role_default: boolean; granted: boolean }

const moduleLabels: Record<string, string> = {
  students: 'Élèves', classes: 'Classes', subjects: 'Matières', grades: 'Notes & bulletins',
  attendance: 'Présences', exams: 'Examens', schedule: 'Emploi du temps', staff: 'Personnel',
  staff_attendance: 'Pointages', payroll: 'Paye', finance: 'Finance', services: 'Cantine & transport',
  messages: 'Messagerie', sms: 'SMS', publications: 'Publications', library: 'Bibliothèque',
  health: 'Infirmerie', academic_years: 'Années scolaires', top_students: "Tableau d'honneur",
  cards: 'Cartes & badges', activity_logs: "Journal d'activité", reports: 'Rapports',
  settings: 'Paramètres', subscription: 'Abonnement',
}

export default function PermissionsDialog({ member, roleLabel, onClose }: { member: StaffMember | null; roleLabel: string; onClose: () => void }) {
  const { showToast } = useToast()
  const [rows, setRows] = useState<PermissionRow[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!member) return
    setLoading(true); setError('')
    api.get(`/staff/${member.id}/permissions`)
      .then(r => {
        const perms: PermissionRow[] = r.data.data.permissions
        setRows(perms)
        setChecked(new Set(perms.filter(p => p.granted).map(p => p.code)))
      })
      .catch(e => setError(e.response?.data?.message || 'Impossible de charger les permissions'))
      .finally(() => setLoading(false))
  }, [member])

  const modules = useMemo(() => {
    const map = new Map<string, PermissionRow[]>()
    for (const p of rows) {
      if (!map.has(p.module)) map.set(p.module, [])
      map.get(p.module)!.push(p)
    }
    return Array.from(map.entries())
  }, [rows])

  const changes = rows.filter(p => checked.has(p.code) !== p.role_default).length

  const toggle = (code: string) => setChecked(prev => {
    const next = new Set(prev)
    next.has(code) ? next.delete(code) : next.add(code)
    return next
  })

  const resetToRole = () => setChecked(new Set(rows.filter(p => p.role_default).map(p => p.code)))

  const handleSave = async () => {
    if (!member) return
    setSaving(true)
    try {
      await api.put(`/staff/${member.id}/permissions`, { permissions: Array.from(checked) })
      showToast(`Permissions de ${member.first_name} ${member.last_name} mises à jour`, 'success')
      onClose()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur lors de la sauvegarde', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={!!member} onClose={onClose} maxWidth="md" fullWidth fullScreen={window.innerWidth < 600}>
      <DialogTitle>
        Permissions de {member?.first_name} {member?.last_name}
        <Typography variant="body2" color="text.secondary">
          Rôle : {roleLabel}. Les cases cochées par défaut sont celles du rôle, ajustez-les pour ce membre uniquement.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {modules.map(([module, perms]) => (
              <Box key={module} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>{moduleLabels[module] || module}</Typography>
                <Divider sx={{ mb: 0.5 }} />
                {perms.map(p => {
                  const isChecked = checked.has(p.code)
                  const differs = isChecked !== p.role_default
                  return (
                    <Box key={p.code} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={isChecked} onChange={() => toggle(p.code)} />}
                        label={<Typography variant="body2">{p.label}</Typography>}
                      />
                      {differs && (
                        <Chip size="small" label={isChecked ? 'Accordée' : 'Retirée'}
                          sx={{ fontSize: '0.65rem', height: 20, bgcolor: isChecked ? '#dcfce7' : '#fee2e2', color: isChecked ? '#166534' : '#991b1b' }} />
                      )}
                    </Box>
                  )
                })}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
          {changes === 0 ? 'Identique au rôle' : `${changes} écart(s) par rapport au rôle`}
        </Typography>
        <Button onClick={resetToRole} disabled={loading || saving || changes === 0}>Rétablir le rôle</Button>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading || saving || !!error}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
