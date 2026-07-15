import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faTriangleExclamation, faTrash } from '@fortawesome/free-solid-svg-icons'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const VARIANT_CONFIG = {
  danger:  { icon: faTrash,               color: '#dc2626', bg: '#fee2e2', btnColor: 'error'   as const },
  warning: { icon: faTriangleExclamation, color: '#d97706', bg: '#fef3c7', btnColor: 'warning' as const },
  default: { icon: faTriangleExclamation, color: '#1A3C5E', bg: '#e8f0fe', btnColor: 'primary' as const },
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler',
  variant = 'default', loading = false, onConfirm, onCancel
}: Props) {
  const cfg = VARIANT_CONFIG[variant]

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      className={variant === 'danger' ? 'confirm-danger' : ''}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '50%', bgcolor: cfg.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <FontAwesomeIcon icon={cfg.icon} style={{ color: cfg.color, fontSize: '0.95rem' }} />
          </Box>
          <Typography fontWeight={700} fontSize="1rem">{title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onCancel} disabled={loading} variant="outlined" size="small">
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={cfg.btnColor}
          size="small"
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
