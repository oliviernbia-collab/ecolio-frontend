import { useState, useEffect } from 'react'
import { Box, Avatar, Typography, Chip, CircularProgress } from '@mui/material'
import api from '../../../lib/axios'
import { usePortalChild } from '../../../contexts/PortalChildContext'

interface Child {
  id: number; first_name: string; last_name: string
  class_name?: string; photo_url?: string
}

export default function ChildSelector() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedChild, setSelectedChild } = usePortalChild()

  useEffect(() => {
    api.get('/portal/parent/children').then(r => {
      const list: Child[] = r.data.data
      setChildren(list)
      if (!selectedChild && list.length > 0) setSelectedChild(list[0].id)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <CircularProgress size={20} sx={{ my: 1 }} />
  if (children.length <= 1) return null

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
      {children.map(c => (
        <Chip
          key={c.id}
          avatar={
            <Avatar src={c.photo_url} sx={{ bgcolor: '#1A3C5E' }}>
              {c.first_name[0]}
            </Avatar>
          }
          label={`${c.first_name} ${c.last_name}${c.class_name ? ` — ${c.class_name}` : ''}`}
          onClick={() => setSelectedChild(c.id)}
          variant={selectedChild === c.id ? 'filled' : 'outlined'}
          sx={{
            fontWeight: selectedChild === c.id ? 700 : 400,
            bgcolor: selectedChild === c.id ? '#1A3C5E' : undefined,
            color: selectedChild === c.id ? '#fff' : undefined,
          }}
        />
      ))}
    </Box>
  )
}
