import { useState, useEffect } from 'react'
import {
  Box, Card, Typography, Button, Grid, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, RadioGroup, FormControlLabel, Radio
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faMoneyBillWave, faPrint, faPenToSquare, faCircleCheck, faFilePdf } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { downloadFile } from '../../lib/download'
import { Payslip } from '../../types'
import { ECOLIO_NAVY } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { printPayslip } from './PayslipPrint'

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Brouillon', color: '#d97706', bg: '#fef9c3' },
  paid:  { label: 'Payé',      color: '#16a34a', bg: '#dcfce7' },
}

function currentMonth() { return new Date().toISOString().slice(0, 7) }

export default function Payroll() {
  const { showToast } = useToast()
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonth())
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editTarget, setEditTarget] = useState<Payslip | null>(null)
  const [payTarget, setPayTarget] = useState<Payslip | null>(null)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/payroll', { params: { period_month: month } }); setPayslips(r.data.data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [month])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const r = await api.post('/payroll/generate', { period_month: month })
      showToast(r.data.message, 'success')
      load()
    } catch (e: any) { showToast(e.response?.data?.message || 'Erreur', 'error') }
    finally { setGenerating(false) }
  }

  const totalNet = payslips.reduce((s, p) => s + Number(p.net_amount), 0)
  const paidCount = payslips.filter(p => p.status === 'paid').length

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Gestion de la paye</Typography>
          <Typography variant="body2" color="text.secondary">Bulletins de salaire du personnel</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField type="month" value={month} onChange={e => setMonth(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          <Button variant="contained" disabled={generating}
            startIcon={<FontAwesomeIcon icon={faMoneyBillWave} style={{ fontSize: '0.85rem' }} />}
            onClick={handleGenerate}>
            {generating ? <CircularProgress size={18} color="inherit" /> : 'Générer les bulletins du mois'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: 'Masse salariale', value: `${Math.round(totalNet / 1000)}k FCFA`, color: ECOLIO_NAVY, bg: '#f0f4ff' },
          { label: 'Bulletins', value: payslips.length, color: '#2E86AB', bg: '#dbeafe' },
          { label: 'Payés', value: `${paidCount}/${payslips.length}`, color: '#16a34a', bg: '#dcfce7' },
        ].map(s => (
          <Grid item xs={4} key={s.label}>
            <Card sx={{ p: 2, bgcolor: s.bg, boxShadow: 'none', border: 'none' }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ color: s.color, opacity: 0.8 }}>{s.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        {loading ? (
          <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>
        ) : payslips.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>Aucun bulletin pour ce mois — cliquez sur "Générer les bulletins du mois"</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Employé</TableCell>
                  <TableCell className="hide-xs">Brut</TableCell>
                  <TableCell className="hide-xs">Primes</TableCell>
                  <TableCell className="hide-xs">Retenues</TableCell>
                  <TableCell>Net</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payslips.map(p => {
                  const st = STATUS_CFG[p.status]
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{p.first_name} {p.last_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.position}</Typography>
                      </TableCell>
                      <TableCell className="hide-xs">{Number(p.base_salary).toLocaleString('fr-FR')}</TableCell>
                      <TableCell className="hide-xs" sx={{ color: '#16a34a' }}>+{Number(p.bonuses).toLocaleString('fr-FR')}</TableCell>
                      <TableCell className="hide-xs" sx={{ color: '#dc2626' }}>−{Number(p.deductions).toLocaleString('fr-FR')}</TableCell>
                      <TableCell><Typography fontWeight={700}>{Number(p.net_amount).toLocaleString('fr-FR')} F</Typography></TableCell>
                      <TableCell><Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 600 }} /></TableCell>
                      <TableCell align="right">
                        {p.status === 'draft' && (
                          <IconButton size="small" onClick={() => setEditTarget(p)} title="Modifier">
                            <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        )}
                        {p.status === 'draft' && (
                          <IconButton size="small" onClick={() => setPayTarget(p)} title="Marquer payé">
                            <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: '0.8rem', color: '#16a34a' }} />
                          </IconButton>
                        )}
                        <IconButton size="small" onClick={() => printPayslip(p as any, {
                          name: user?.school_name || 'Écolio', logo_url: user?.school_logo, primary_color: user?.primary_color,
                        })} title="Imprimer">
                          <FontAwesomeIcon icon={faPrint} style={{ fontSize: '0.8rem' }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => downloadFile(`/payroll/${p.id}/pdf`, `bulletin-paie-${p.reference}.pdf`)} title="Télécharger le PDF">
                          <FontAwesomeIcon icon={faFilePdf} style={{ fontSize: '0.8rem' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {editTarget && (
        <EditPayslipDialog payslip={editTarget} onClose={() => setEditTarget(null)}
          onSaved={() => { load(); showToast('Bulletin mis à jour', 'success') }} />
      )}
      {payTarget && (
        <PayDialog payslip={payTarget} onClose={() => setPayTarget(null)}
          onPaid={() => { load(); showToast('Bulletin marqué payé', 'success') }} />
      )}
    </Box>
  )
}

function EditPayslipDialog({ payslip, onClose, onSaved }: { payslip: Payslip; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast()
  const [form, setForm] = useState({
    base_salary: String(payslip.base_salary), bonuses: String(payslip.bonuses), bonuses_detail: payslip.bonuses_detail || '',
    deductions: String(payslip.deductions), deductions_detail: payslip.deductions_detail || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const net = (parseFloat(form.base_salary) || 0) + (parseFloat(form.bonuses) || 0) - (parseFloat(form.deductions) || 0)

  const handleSave = async () => {
    setSaving(true)
    try { await api.put(`/payroll/${payslip.id}`, form); onSaved(); onClose() }
    catch (e: any) { showToast(e.response?.data?.message || 'Erreur', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Modifier le bulletin — {payslip.first_name} {payslip.last_name}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}><TextField fullWidth type="number" label="Salaire de base (FCFA)" value={form.base_salary} onChange={e => set('base_salary', e.target.value)} size="small" /></Grid>
          <Grid item xs={12}><TextField fullWidth type="number" label="Primes (FCFA)" value={form.bonuses} onChange={e => set('bonuses', e.target.value)} size="small" /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Détail des primes" value={form.bonuses_detail} onChange={e => set('bonuses_detail', e.target.value)} size="small" placeholder="Ex : prime de transport" /></Grid>
          <Grid item xs={12}><TextField fullWidth type="number" label="Retenues (FCFA)" value={form.deductions} onChange={e => set('deductions', e.target.value)} size="small" /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Détail des retenues" value={form.deductions_detail} onChange={e => set('deductions_detail', e.target.value)} size="small" placeholder="Ex : avance sur salaire" /></Grid>
          <Grid item xs={12}>
            <Box sx={{ p: 1.5, bgcolor: '#f0f4ff', borderRadius: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Net à payer</Typography>
              <Typography variant="h6" fontWeight={700} color={ECOLIO_NAVY}>{net.toLocaleString('fr-FR')} FCFA</Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}</Button>
      </DialogActions>
    </Dialog>
  )
}

function PayDialog({ payslip, onClose, onPaid }: { payslip: Payslip; onClose: () => void; onPaid: () => void }) {
  const { showToast } = useToast()
  const [method, setMethod] = useState('Espèces')
  const [saving, setSaving] = useState(false)

  const handlePay = async () => {
    setSaving(true)
    try { await api.put(`/payroll/${payslip.id}/pay`, { payment_method: method }); onPaid(); onClose() }
    catch (e: any) { showToast(e.response?.data?.message || 'Erreur', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Marquer payé — {payslip.first_name} {payslip.last_name}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={1}>Net à payer : <strong>{Number(payslip.net_amount).toLocaleString('fr-FR')} FCFA</strong></Typography>
        <RadioGroup value={method} onChange={e => setMethod(e.target.value)}>
          {['Espèces', 'Virement', 'Orange Money', 'MTN Money', 'Wave'].map(m => (
            <FormControlLabel key={m} value={m} control={<Radio size="small" />} label={m} />
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handlePay} disabled={saving}>{saving ? <CircularProgress size={18} color="inherit" /> : 'Confirmer le paiement'}</Button>
      </DialogActions>
    </Dialog>
  )
}
