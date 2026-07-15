import { useState, useEffect } from 'react'
import {
  Card, CardContent, Typography, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Chip
} from '@mui/material'
import { FontAwesomeIcon } from '../../../lib/icons'
import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons'
import api from '../../../lib/axios'
import { Invoice } from '../../../types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { usePortalChild } from '../../../contexts/PortalChildContext'
import ChildSelector from './ChildSelector'

const STATUS_META: Record<string, { label: string; color: string }> = {
  paid:      { label: 'Payée',   color: '#2ecc71' },
  pending:   { label: 'En attente', color: '#f39c12' },
  overdue:   { label: 'En retard', color: '#e74c3c' },
  cancelled: { label: 'Annulée', color: '#6b7280' },
}

const TYPE_LABELS: Record<string, string> = {
  scolarite: 'Scolarité',
  transport: 'Transport',
  cantine: 'Cantine',
  uniforme: 'Uniforme',
  activite: 'Activité',
  autre: 'Autre',
}

export default function ParentFinance() {
  const { selectedChild } = usePortalChild()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedChild) return
    setLoading(true)
    api.get(`/portal/parent/children/${selectedChild}/invoices`)
      .then(r => setInvoices(r.data.data))
      .finally(() => setLoading(false))
  }, [selectedChild])

  const total   = invoices.reduce((s, i) => s + i.amount, 0)
  const paid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const pending = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + i.amount, 0)

  const fmt = (v: number) => v.toLocaleString('fr-FR') + ' FCFA'

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ marginRight: 10, color: '#1A3C5E' }} />
        Finances
      </Typography>

      <ChildSelector />

      {!selectedChild ? (
        <Alert severity="info">Sélectionnez un enfant pour voir ses factures.</Alert>
      ) : loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : (
        <>
          {/* Résumé */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            {[
              { label: 'Total facturé', value: fmt(total),   color: '#1A3C5E' },
              { label: 'Payé',          value: fmt(paid),    color: '#2ecc71' },
              { label: 'Restant dû',    value: fmt(pending), color: pending > 0 ? '#e74c3c' : '#6b7280' },
            ].map(s => (
              <Card key={s.label} sx={{ flex: 1, minWidth: 160 }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography fontWeight={700} fontSize="1.1rem" sx={{ color: s.color }}>{s.value}</Typography>
                  <Typography fontSize="0.75rem" color="text.secondary">{s.label}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Card>
            <CardContent sx={{ p: 0 }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 520 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Facture</TableCell>
                      <TableCell className="hide-xs">Type</TableCell>
                      <TableCell>Montant</TableCell>
                      <TableCell className="hide-xs">Échéance</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.length === 0
                      ? <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary" py={3}>Aucune facture</Typography></TableCell></TableRow>
                      : invoices.map(inv => {
                        const meta = STATUS_META[inv.status] ?? { label: inv.status, color: '#6b7280' }
                        return (
                          <TableRow key={inv.id}>
                            <TableCell>
                              <Typography fontWeight={500} fontSize="0.85rem">{inv.invoice_number}</Typography>
                              {inv.description && <Typography fontSize="0.75rem" color="text.secondary">{inv.description}</Typography>}
                            </TableCell>
                            <TableCell className="hide-xs">{TYPE_LABELS[inv.type] ?? inv.type}</TableCell>
                            <TableCell><Typography fontWeight={600}>{fmt(inv.amount)}</Typography></TableCell>
                            <TableCell className="hide-xs">
                              {inv.due_date ? format(parseISO(inv.due_date), 'dd MMM yyyy', { locale: fr }) : '—'}
                            </TableCell>
                            <TableCell>
                              <Chip label={meta.label} size="small"
                                sx={{ bgcolor: `${meta.color}18`, color: meta.color, fontWeight: 600 }} />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}
