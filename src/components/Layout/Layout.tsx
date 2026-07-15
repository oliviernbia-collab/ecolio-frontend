import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Box, Toolbar } from '@mui/material'
import Sidebar from './Sidebar'
import Header from './Header'

const DRAWER_WIDTH = 240

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header onMenuClick={() => setMobileOpen(true)} sidebarWidth={DRAWER_WIDTH} />
        <Toolbar sx={{ minHeight: '60px !important' }} />
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, backgroundColor: '#f5f6fa' }}>
          <Box key={location.pathname} className="page-enter">
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
