import { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { keyframes } from '@mui/system'
import { FontAwesomeIcon } from '../../lib/icons'
import { faBullhorn } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'

const scroll = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
`

// Bandeau rouge défilant en haut des pages publiques. Le texte est réglé par le super admin
// dans Paramètres > Plateforme ; rien n'est affiché quand le message est vide ou désactivé.
export default function AnnouncementBar() {
  const [text, setText] = useState('')

  useEffect(() => {
    api.get('/public/announcement').then(r => setText(r.data.text || '')).catch(() => {})
  }, [])

  if (!text) return null

  // Le texte est dupliqué pour que la boucle d'animation soit continue (sans saut au retour à 0).
  const item = (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 6 }}>
      <FontAwesomeIcon icon={faBullhorn} style={{ fontSize: '0.8rem' }} />
      {text}
    </Box>
  )
  // Durée proportionnelle à la longueur du texte : vitesse de lecture constante quel que soit le message
  const duration = Math.max(15, text.length * 0.25)

  return (
    <Box role="marquee" aria-label={text} sx={{ bgcolor: '#dc2626', color: '#fff', overflow: 'hidden', py: 0.75, fontSize: '0.85rem', fontWeight: 600 }}>
      <Box sx={{
        display: 'inline-flex', whiteSpace: 'nowrap', animation: `${scroll} ${duration}s linear infinite`,
        '&:hover': { animationPlayState: 'paused' },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}>
        {item}{item}{item}{item}
      </Box>
    </Box>
  )
}
