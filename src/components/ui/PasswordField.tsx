import { useState } from 'react'
import { TextField, InputAdornment, IconButton, TextFieldProps } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

// Champ mot de passe standard de l'app : ajoute un bouton "œil" pour afficher/masquer
// la saisie, en conservant tout ce que TextField accepte (label, startAdornment, error...).
export default function PasswordField({ InputProps, ...props }: TextFieldProps) {
  const [show, setShow] = useState(false)

  return (
    <TextField
      {...props}
      type={show ? 'text' : 'password'}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShow(s => !s)}
              edge="end"
              size="small"
              aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              tabIndex={-1}
            >
              <FontAwesomeIcon icon={show ? faEyeSlash : faEye} style={{ fontSize: '0.85rem', color: '#9ca3af' }} />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  )
}
