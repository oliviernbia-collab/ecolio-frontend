import { createTheme } from '@mui/material/styles'

export const ECOLIO_NAVY = '#1A3C5E'
export const ECOLIO_BLUE = '#2E86AB'
export const ECOLIO_LIGHT = '#E8F4FD'

export const theme = createTheme({
  palette: {
    primary: { main: ECOLIO_NAVY, light: '#2a5a8e', dark: '#0f2236', contrastText: '#fff' },
    secondary: { main: ECOLIO_BLUE, light: '#5ba3c3', dark: '#1e6b8a', contrastText: '#fff' },
    background: { default: '#f5f6fa', paper: '#ffffff' },
    success: { main: '#2ecc71' },
    warning: { main: '#f39c12' },
    error: { main: '#e74c3c' },
    info: { main: ECOLIO_BLUE },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        containedPrimary: {
          background: `linear-gradient(135deg, ${ECOLIO_NAVY} 0%, ${ECOLIO_BLUE} 100%)`,
          '&:hover': { background: `linear-gradient(135deg, #0f2236 0%, #1e6b8a 100%)` },
          // Le gris quasi invisible par défaut de MUI (texte 26% + fond 12% de noir) est
          // remplacé par du blanc à 75% sur un fond navy atténué, nettement plus lisible
          // tout en restant clairement "désactivé".
          '&.Mui-disabled': { background: `${ECOLIO_NAVY}59`, color: 'rgba(255,255,255,0.75)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #eef0f4' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { '& .MuiTableCell-head': { fontWeight: 600, backgroundColor: '#f8f9fc', color: '#374151' } },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: '#f9fafb' } },
      },
    },
  },
})
