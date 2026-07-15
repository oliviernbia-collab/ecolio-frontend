import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from '@mui/material'

interface Props {
  columns: number
  rows?: number
  hasAvatar?: boolean
}

function SkeletonCell({ wide, avatar }: { wide?: boolean; avatar?: boolean }) {
  return (
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {avatar && (
          <Box className="skeleton skeleton-avatar" sx={{ width: 32, height: 32, flexShrink: 0 }} />
        )}
        <Box className="skeleton skeleton-text" sx={{ width: wide ? '80%' : `${40 + Math.random() * 40}%` }} />
      </Box>
    </TableCell>
  )
}

export default function SkeletonTable({ columns, rows = 5, hasAvatar = false }: Props) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableCell key={i}>
                <Box className="skeleton skeleton-text" sx={{ width: '60%' }} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, ri) => (
            <TableRow key={ri}>
              {Array.from({ length: columns }).map((_, ci) => (
                <SkeletonCell key={ci} avatar={ci === 0 && hasAvatar} wide={ci === 0} />
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
