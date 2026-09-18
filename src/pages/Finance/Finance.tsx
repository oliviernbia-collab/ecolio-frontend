import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Tooltip, InputAdornment, Avatar, Radio,
  RadioGroup, FormControlLabel
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faPlus, faCircleCheck, faMagnifyingGlass, faReceipt, faBan,
  faMobileScreen, faWallet, faFileExcel
} from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { downloadFile } from '../../lib/download'
import { Invoice } from '../../types'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { printHtml } from '../../lib/print'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SkeletonTable from '../../components/ui/SkeletonTable'
import EmptyState from '../../components/ui/EmptyState'
import DataTablePagination from '../../components/ui/DataTablePagination'

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  paid:      { bg: '#dcfce7', color: '#16a34a', label: 'Payée' },
  pending:   { bg: '#fef9c3', color: '#854d0e', label: 'En attente' },
  overdue:   { bg: '#fee2e2', color: '#dc2626', label: 'En retard' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280', label: 'Annulée' },
}

const typeLabels: Record<string, string> = {
  scolarite: 'Scolarité', transport: 'Transport', cantine: 'Cantine',
  uniforme: 'Uniforme', activite: 'Activité', autre: 'Autre',
}

const MOBILE_MONEY_OPERATORS = [
  { value: 'Orange Money',  color: '#f97316' },
  { value: 'MTN Money',     color: '#eab308' },
  { value: 'Wave',          color: '#3b82f6' },
  { value: 'Moov Money',    color: '#8b5cf6' },
  { value: 'Espèces',       color: '#6b7280' },
]

type SortKey = 'student_name' | 'amount' | 'status' | 'due_date' | 'created_at'
type SortDir  = 'asc' | 'desc'

// ── Payment Dialog ─────────────────────────────────────────────────────────────
function PaymentDialog({ open, invoice, onClose, onPaid }: {
  open: boolean; invoice: Invoice | null; onClose: () => void; onPaid: () => void
}) {
  const { showToast } = useToast()
  const [method, setMethod] = useState('Espèces')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) setMethod('Espèces') }, [open])

  const handlePay = async () => {
    if (!invoice) return
    setSaving(true)
    try {
      await api.put(`/finance/${invoice.id}/pay`, { payment_method: method })
      showToast('Paiement enregistré avec succès', 'success')
      onPaid(); onClose()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur lors du paiement', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={window.innerWidth < 600}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FontAwesomeIcon icon={faMobileScreen} style={{ color: ECOLIO_BLUE, fontSize: '1.1rem' }} />
          Enregistrer le paiement
        </Box>
      </DialogTitle>
      <DialogContent>
        {invoice && (
          <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">{invoice.student_name}</Typography>
            <Typography variant="h5" fontWeight={700} color={ECOLIO_NAVY}>
              {Number(invoice.amount).toLocaleString('fr-FR')} FCFA
            </Typography>
            <Typography variant="caption" color="text.secondary">{invoice.invoice_number}</Typography>
          </Box>
        )}
        <Typography variant="body2" fontWeight={600} mb={1.5}>Mode de paiement</Typography>
        <RadioGroup value={method} onChange={e => setMethod(e.target.value)}>
          {MOBILE_MONEY_OPERATORS.map(op => (
            <FormControlLabel
              key={op.value}
              value={op.value}
              control={<Radio size="small" sx={{ '&.Mui-checked': { color: op.color } }} />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: op.color }} />
                  <Typography variant="body2">{op.value}</Typography>
                </Box>
              }
              sx={{
                mx: 0, px: 1.5, py: 0.5, borderRadius: 2, mb: 0.5,
                bgcolor: method === op.value ? `${op.color}12` : 'transparent',
                border: `1px solid ${method === op.value ? op.color : 'transparent'}`,
                transition: 'all 0.15s ease',
              }}
            />
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handlePay} disabled={saving}
          startIcon={<FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: '0.85rem' }} />}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Confirmer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Receipt printer ────────────────────────────────────────────────────────────
function buildReceiptHtml(inv: Invoice, schoolName: string, primaryColor: string, logoUrl?: string) {
  const statusMeta: Record<string, { label: string; color: string }> = {
    paid:      { label: 'PAYÉE',      color: '#16a34a' },
    pending:   { label: 'EN ATTENTE', color: '#854d0e' },
    overdue:   { label: 'EN RETARD',  color: '#dc2626' },
    cancelled: { label: 'ANNULÉE',    color: '#6b7280' },
  }
  const status = statusMeta[inv.status] ?? { label: inv.status.toUpperCase(), color: '#6b7280' }
  const fmt    = (n: number) => n.toLocaleString('fr-FR') + ' FCFA'
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

  return `
<style>
  .receipt { width: 680px; background: #fff; border-radius: 12px; overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,.12); font-family: 'Segoe UI', Arial, sans-serif; }
  .receipt-header { background: ${primaryColor}; color: #fff; padding: 28px 36px; display: flex; align-items: center; gap: 18px; }
  .receipt-header img { width: 56px; height: 56px; object-fit: contain; border-radius: 8px; background: rgba(255,255,255,.15); padding: 4px; }
  .receipt-header .school-name { font-size: 1.3rem; font-weight: 700; }
  .receipt-header .doc-type { font-size: 0.85rem; opacity: .8; margin-top: 4px; letter-spacing: 1.5px; text-transform: uppercase; }
  .receipt-body { padding: 32px 36px; }
  .receipt-num { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 24px; }
  .receipt-num .num { font-size: 1.4rem; font-weight: 700; color: ${primaryColor}; font-family: monospace; }
  .status-badge { padding: 4px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;
    color: ${status.color}; background: ${status.color}18; border: 1px solid ${status.color}40; }
  .section { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; margin-bottom: 24px; }
  .field label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: .8px; color: #9ca3af; display: block; margin-bottom: 3px; }
  .field span { font-size: 0.95rem; font-weight: 500; color: #111; }
  .amount-box { background: ${primaryColor}08; border: 2px solid ${primaryColor}20; border-radius: 10px;
    padding: 20px; text-align: center; margin: 24px 0; }
  .amount-box .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 6px; }
  .amount-box .amount { font-size: 2.2rem; font-weight: 800; color: ${primaryColor}; }
  .receipt-footer { text-align: center; padding: 18px 36px; background: #f8fafc; font-size: 0.78rem; color: #9ca3af; border-top: 1px solid #eee; }
</style>
<div class="receipt">
  <div class="receipt-header">
    ${logoUrl ? `<img src="${logoUrl}" alt="logo"/>` : ''}
    <div>
      <div class="school-name">${schoolName}</div>
      <div class="doc-type">Reçu de paiement</div>
    </div>
  </div>
  <div class="receipt-body">
    <div class="receipt-num">
      <div>
        <div style="font-size:0.72rem;color:#9ca3af;letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px">N° Facture</div>
        <div class="num">${inv.invoice_number}</div>
      </div>
      <span class="status-badge">${status.label}</span>
    </div>

    <div class="section">
      <div class="field"><label>Élève</label><span>${inv.student_name ?? '—'}</span></div>
      <div class="field"><label>Matricule</label><span>${inv.matricule ?? '—'}</span></div>
      <div class="field"><label>Classe</label><span>${inv.class_name ?? '—'}</span></div>
      <div class="field"><label>Type</label><span>${typeLabels[inv.type] ?? inv.type}</span></div>
      ${inv.description ? `<div class="field" style="grid-column:span 2"><label>Description</label><span>${inv.description}</span></div>` : ''}
    </div>

    <div class="amount-box">
      <div class="label">Montant</div>
      <div class="amount">${fmt(Number(inv.amount))}</div>
    </div>

    <div class="section">
      <div class="field"><label>Date de création</label><span>${fmtDate(inv.created_at)}</span></div>
      <div class="field"><label>Date d'échéance</label><span>${fmtDate(inv.due_date)}</span></div>
      ${inv.payment_method ? `<div class="field"><label>Mode de paiement</label><span>${inv.payment_method}</span></div>` : ''}
      ${inv.paid_at ? `<div class="field"><label>Date de paiement</label><span>${fmtDate(inv.paid_at)}</span></div>` : ''}
    </div>
  </div>
  <div class="receipt-footer">
    Document généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} — ${schoolName}
  </div>
</div>`
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Finance() {
  const { showToast } = useToast()
  const { user } = useAuth()

  const handlePrintReceipt = (inv: Invoice) => {
    const html = buildReceiptHtml(
      inv,
      user?.school_name ?? 'Écolio',
      user?.primary_color ?? '#1A3C5E',
      user?.school_logo ?? undefined,
    )
    printHtml(html, `Reçu ${inv.invoice_number}`)
  }
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [payDialog, setPayDialog] = useState<Invoice | null>(null)
  const [toCancel, setToCancel] = useState<Invoice | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      const r = await api.get('/finance', { params })
      setInvoices(r.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter])

  const handleCancel = async () => {
    if (!toCancel) return
    setCancelling(true)
    try {
      await api.put(`/finance/${toCancel.id}/cancel`)
      showToast('Facture annulée', 'success')
      load()
    } catch { showToast('Erreur lors de l\'annulation', 'error') }
    finally { setCancelling(false); setToCancel(null) }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(0)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return invoices
      .filter(inv => !search || `${inv.student_name} ${inv.matricule} ${inv.invoice_number}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = String(a[sortKey] ?? '')
        const vb = String(b[sortKey] ?? '')
        return sortDir === 'asc' ? va.localeCompare(vb, 'fr') : vb.localeCompare(va, 'fr')
      })
  }, [invoices, search, sortKey, sortDir])

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

  const totalPaid    = filtered.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const totalPending = filtered.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0)
  const totalLate    = filtered.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0)
  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' FCFA'

  const SortCell = ({ label, field }: { label: string; field: SortKey }) => (
    <TableCell>
      <TableSortLabel active={sortKey === field} direction={sortKey === field ? sortDir : 'asc'} onClick={() => handleSort(field)}>
        {label}
      </TableSortLabel>
    </TableCell>
  )

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Finance & Facturation</Typography>
          <Typography variant="body2" color="text.secondary">{filtered.length} facture(s)</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined"
            startIcon={<FontAwesomeIcon icon={faFileExcel} style={{ fontSize: '0.85rem' }} />}
            onClick={() => downloadFile(`/finance/export/excel${statusFilter ? `?status=${statusFilter}` : ''}`, 'factures.xlsx')}>
            Exporter Excel
          </Button>
          <Button variant="contained"
            startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
            onClick={() => setFormOpen(true)}>
            Nouvelle facture
          </Button>
        </Box>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 2 }} className="stagger">
        {[
          { label: 'Encaissé',   value: fmt(totalPaid),    color: '#16a34a', bg: '#dcfce7' },
          { label: 'En attente', value: fmt(totalPending), color: '#854d0e', bg: '#fef9c3' },
          { label: 'En retard',  value: fmt(totalLate),    color: '#dc2626', bg: '#fee2e2' },
        ].map(s => (
          <Grid item xs={12} sm={4} key={s.label} className="animate-fade-in-up">
            <Card sx={{ p: 2, bgcolor: s.bg, boxShadow: 'none' }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: s.color, fontSize: { xs: '1rem', sm: '1.25rem' } }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ color: s.color, opacity: 0.8 }}>{s.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Rechercher par élève, matricule, n° facture…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            size="small" sx={{ minWidth: { xs: '100%', sm: 240 }, flex: { sm: 1 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '0.85rem', color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <InputLabel>Statut</InputLabel>
            <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }} label="Statut">
              <MenuItem value="">Tous</MenuItem>
              {Object.entries(statusColors).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <SkeletonTable columns={7} rows={6} hasAvatar />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={faWallet}
            title="Aucune facture"
            subtitle={search ? `Aucun résultat pour "${search}"` : 'Créez votre première facture pour commencer.'}
            actionLabel={!search ? 'Nouvelle facture' : undefined}
            onAction={!search ? () => setFormOpen(true) : undefined}
          />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow>
                    <SortCell label="Élève" field="student_name" />
                    <TableCell>Type</TableCell>
                    <TableCell className="hide-xs">Description</TableCell>
                    <SortCell label="Montant" field="amount" />
                    <TableCell className="hide-xs">
                      <TableSortLabel active={sortKey === 'due_date'} direction={sortKey === 'due_date' ? sortDir : 'asc'} onClick={() => handleSort('due_date')}>
                        Échéance
                      </TableSortLabel>
                    </TableCell>
                    <SortCell label="Statut" field="status" />
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map(inv => {
                    const sc = statusColors[inv.status] || statusColors.pending
                    return (
                      <TableRow key={inv.id} className="MuiTableRow-body">
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: '0.7rem', bgcolor: ECOLIO_NAVY, display: { xs: 'none', sm: 'flex' } }}>
                              {inv.student_name?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>{inv.student_name}</Typography>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: ECOLIO_BLUE }}>{inv.matricule}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={typeLabels[inv.type] || inv.type} size="small"
                            sx={{ bgcolor: '#f0f4ff', color: ECOLIO_NAVY, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell className="hide-xs">
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{inv.description || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={600} color={ECOLIO_NAVY}
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                            {Number(inv.amount).toLocaleString('fr-FR')} FCFA
                          </Typography>
                        </TableCell>
                        <TableCell className="hide-xs">
                          <Typography variant="caption"
                            sx={{ color: inv.status === 'overdue' ? '#dc2626' : 'text.secondary', fontWeight: inv.status === 'overdue' ? 600 : 400 }}>
                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-FR') : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                              <Tooltip title="Enregistrer paiement">
                                <IconButton size="small" sx={{ color: '#16a34a' }} onClick={() => setPayDialog(inv)}>
                                  <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                              <Tooltip title="Annuler la facture">
                                <IconButton size="small" color="error" onClick={() => setToCancel(inv)}>
                                  <FontAwesomeIcon icon={faBan} style={{ fontSize: '0.85rem' }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Voir reçu">
                              <IconButton size="small" sx={{ color: ECOLIO_BLUE }} onClick={() => handlePrintReceipt(inv)}>
                                <FontAwesomeIcon icon={faReceipt} style={{ fontSize: '0.85rem' }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <DataTablePagination
              total={filtered.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
            />
          </>
        )}
      </Card>

      <InvoiceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => { load(); showToast('Facture créée avec succès', 'success') }}
      />

      <PaymentDialog
        open={!!payDialog}
        invoice={payDialog}
        onClose={() => setPayDialog(null)}
        onPaid={load}
      />

      <ConfirmDialog
        open={!!toCancel}
        title="Annuler la facture"
        message={`Annuler la facture ${toCancel?.invoice_number} de ${toCancel?.student_name} ? Cette action est irréversible.`}
        confirmLabel="Annuler la facture"
        variant="danger"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setToCancel(null)}
      />
    </Box>
  )
}

// ── Invoice Form ───────────────────────────────────────────────────────────────
function InvoiceForm({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast()
  const [students, setStudents] = useState<any[]>([])
  const [form, setForm] = useState<any>({ student_id: '', type: 'scolarite', description: '', amount: '', due_date: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (open) {
      setForm({ student_id: '', type: 'scolarite', description: '', amount: '', due_date: '' })
      api.get('/students').then(r => setStudents(r.data.data)).catch(() => {})
    }
  }, [open])

  const handleSave = async () => {
    if (!form.student_id || !form.amount) {
      showToast('Élève et montant sont requis', 'warning'); return
    }
    if (Number(form.amount) <= 0) {
      showToast('Le montant doit être supérieur à 0', 'warning'); return
    }
    setSaving(true)
    try {
      await api.post('/finance', form)
      onSaved(); onClose()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur lors de la création', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={window.innerWidth < 600}>
      <DialogTitle>Nouvelle facture</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Élève *</InputLabel>
              <Select value={form.student_id} onChange={e => set('student_id', e.target.value)} label="Élève *">
                {students.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.matricule})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select value={form.type} onChange={e => set('type', e.target.value)} label="Type">
                {Object.entries(typeLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Montant (FCFA) *" type="number" value={form.amount}
              onChange={e => set('amount', e.target.value)}
              inputProps={{ min: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Description" value={form.description}
              onChange={e => set('description', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Date d'échéance" type="date" value={form.due_date}
              onChange={e => set('due_date', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
