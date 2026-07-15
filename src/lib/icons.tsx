import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconProp, SizeProp } from '@fortawesome/fontawesome-svg-core'
import { CSSProperties } from 'react'

interface FaProps {
  icon: IconProp
  fontSize?: 'inherit' | 'small' | 'medium' | 'large'
  size?: SizeProp
  style?: CSSProperties
  className?: string
  color?: string
  fixedWidth?: boolean
}

const sizeMap: Record<string, string> = {
  small: '1rem',
  medium: '1.25rem',
  large: '1.5rem',
  inherit: 'inherit',
}

export function FaIcon({ icon, fontSize, size, style, className, color, fixedWidth }: FaProps) {
  const fs = fontSize ? sizeMap[fontSize] : undefined
  return (
    <FontAwesomeIcon
      icon={icon}
      size={size}
      fixedWidth={fixedWidth}
      className={className}
      style={{ fontSize: fs, color, display: 'inline-block', ...style }}
    />
  )
}

export { FontAwesomeIcon }
export type { IconProp }
