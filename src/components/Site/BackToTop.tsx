import { Zoom, Fab, useScrollTrigger } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { ECOLIO_NAVY } from '../../theme'

// Bouton flottant "remonter en haut" — apparaît après 400px de défilement.
export default function BackToTop() {
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 400 })

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Zoom in={trigger}>
      <Fab onClick={scrollToTop} aria-label="Remonter en haut de la page" size="medium" sx={{
        position: 'fixed', bottom: { xs: 20, sm: 28 }, right: { xs: 20, sm: 28 }, zIndex: 20,
        bgcolor: ECOLIO_NAVY, color: 'white',
        boxShadow: '0 6px 18px rgba(26,60,94,0.35)',
        '&:hover': { bgcolor: '#0f2236' },
      }}>
        <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: '1rem' }} />
      </Fab>
    </Zoom>
  )
}
