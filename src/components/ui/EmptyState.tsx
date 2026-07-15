import { Box, Typography, Button } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

interface Props {
  icon: IconDefinition
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <Box
      className="animate-fade-in"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 72, height: 72, borderRadius: '50%',
          bgcolor: 'rgba(26,60,94,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mb: 1,
        }}
      >
        <FontAwesomeIcon icon={icon} style={{ fontSize: '1.8rem', color: '#1A3C5E', opacity: 0.45 }} />
      </Box>
      <Typography variant="subtitle1" fontWeight={600} color="text.primary">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
          {subtitle}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}
