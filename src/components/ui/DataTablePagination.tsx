import { Box, Select, MenuItem, Typography, IconButton, FormControl } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faChevronLeft, faChevronRight, faAnglesLeft, faAnglesRight } from '@fortawesome/free-solid-svg-icons'

interface Props {
  total: number
  page: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rpp: number) => void
  rowsPerPageOptions?: number[]
}

export default function DataTablePagination({
  total, page, rowsPerPage, onPageChange, onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
}: Props) {
  const totalPages = Math.ceil(total / rowsPerPage)
  const from = total === 0 ? 0 : page * rowsPerPage + 1
  const to   = Math.min((page + 1) * rowsPerPage, total)

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      px: 2, py: 1.5, borderTop: '1px solid #f0f0f0', flexWrap: 'wrap', gap: 1,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">Lignes par page :</Typography>
        <FormControl size="small" variant="standard" sx={{ minWidth: 48 }}>
          <Select
            value={rowsPerPage}
            onChange={e => { onRowsPerPageChange(Number(e.target.value)); onPageChange(0); }}
            disableUnderline
            sx={{ fontSize: '0.8rem', fontWeight: 500 }}
          >
            {rowsPerPageOptions.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          {from}–{to} sur {total}
        </Typography>
        <IconButton size="small" onClick={() => onPageChange(0)} disabled={page === 0}>
          <FontAwesomeIcon icon={faAnglesLeft} style={{ fontSize: '0.75rem' }} />
        </IconButton>
        <IconButton size="small" onClick={() => onPageChange(page - 1)} disabled={page === 0}>
          <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '0.75rem' }} />
        </IconButton>
        <Typography variant="caption" sx={{ px: 1, fontWeight: 600, minWidth: 60, textAlign: 'center' }}>
          {page + 1} / {totalPages || 1}
        </Typography>
        <IconButton size="small" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}>
          <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '0.75rem' }} />
        </IconButton>
        <IconButton size="small" onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1}>
          <FontAwesomeIcon icon={faAnglesRight} style={{ fontSize: '0.75rem' }} />
        </IconButton>
      </Box>
    </Box>
  )
}
