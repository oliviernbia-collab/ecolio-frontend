import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Snackbar, Alert, Slide, SlideProps } from '@mui/material'
import type { AlertColor } from '@mui/material'

interface ToastState {
  message: string
  severity: AlertColor
  key: number
  open: boolean
}

interface ToastContextType {
  showToast: (message: string, severity?: AlertColor) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

function SlideUp(props: SlideProps) {
  return <Slide {...props} direction="up" />
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    message: '', severity: 'success', key: 0, open: false,
  })

  const showToast = useCallback((message: string, severity: AlertColor = 'success') => {
    setToast({ message, severity, key: Date.now(), open: true })
  }, [])

  const handleClose = (_: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return
    setToast(t => ({ ...t, open: false }))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        key={toast.key}
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleClose}
        TransitionComponent={SlideUp}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: { xs: 1, sm: 0 } }}
      >
        <Alert
          severity={toast.severity}
          onClose={handleClose}
          variant="filled"
          sx={{
            borderRadius: 2.5,
            fontWeight: 500,
            fontSize: '0.875rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            minWidth: 280,
            '& .MuiAlert-icon': { fontSize: '1.1rem' },
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
