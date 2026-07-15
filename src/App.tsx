import { ThemeProvider, CssBaseline } from '@mui/material'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { PortalChildProvider } from './contexts/PortalChildContext'
import { theme } from './theme'
import Layout from './components/Layout/Layout'
import PortalLayout from './components/Layout/PortalLayout'
import Landing from './pages/Landing/Landing'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import Students from './pages/Students/Students'
import Grades from './pages/Grades/Grades'
import Attendance from './pages/Attendance/Attendance'
import Schedule from './pages/Schedule/Schedule'
import Staff from './pages/Staff/Staff'
import Finance from './pages/Finance/Finance'
import Messages from './pages/Messages/Messages'
import Settings from './pages/Settings/Settings'
import AcademicYears from './pages/AcademicYears/AcademicYears'
import CardsPage from './pages/Cards/CardsPage'
import Classes from './pages/Classes/Classes'
import Subjects from './pages/Subjects/Subjects'
import Parents from './pages/Parents/Parents'
import Exams from './pages/Exams/Exams'
import StaffAttendance from './pages/StaffAttendance/StaffAttendance'
import Payroll from './pages/Payroll/Payroll'
import SMS from './pages/SMS/SMS'
import ForcePasswordChange from './pages/ForcePasswordChange/ForcePasswordChange'
import Library from './pages/Library/Library'
import Health from './pages/Health/Health'
import Services from './pages/Services/Services'
import SuperAdmin from './pages/SuperAdmin/SuperAdmin'
// Portail Élève
import StudentDashboard from './pages/Portal/Student/StudentDashboard'
import StudentGrades from './pages/Portal/Student/StudentGrades'
import StudentAttendance from './pages/Portal/Student/StudentAttendance'
import StudentSchedule from './pages/Portal/Student/StudentSchedule'
// Portail Parent
import ParentDashboard from './pages/Portal/Parent/ParentDashboard'
import ParentGrades from './pages/Portal/Parent/ParentGrades'
import ParentAttendance from './pages/Portal/Parent/ParentAttendance'
import ParentSchedule from './pages/Portal/Parent/ParentSchedule'
import ParentFinance from './pages/Portal/Parent/ParentFinance'

import { CircularProgress, Box } from '@mui/material'

function LoadingScreen() {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  )
}

const STAFF_ROLES = ['super_admin', 'director', 'teacher', 'accountant', 'counselor', 'librarian', 'nurse', 'maintenance', 'secretary']

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!user) {
    return (
      <Routes>
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  if (user.must_change_password) {
    return <ForcePasswordChange />
  }

  // Portail Élève
  if (user.role === 'student') {
    return (
      <Routes>
        <Route path="/portal/student" element={<PortalLayout />}>
          <Route index                  element={<StudentDashboard />} />
          <Route path="grades"          element={<StudentGrades />} />
          <Route path="attendance"      element={<StudentAttendance />} />
          <Route path="schedule"        element={<StudentSchedule />} />
        </Route>
        <Route path="*" element={<Navigate to="/portal/student" replace />} />
      </Routes>
    )
  }

  // Portail Parent
  if (user.role === 'parent') {
    return (
      <PortalChildProvider>
        <Routes>
          <Route path="/portal/parent" element={<PortalLayout />}>
            <Route index               element={<ParentDashboard />} />
            <Route path="grades"       element={<ParentGrades />} />
            <Route path="attendance"   element={<ParentAttendance />} />
            <Route path="schedule"     element={<ParentSchedule />} />
            <Route path="finance"      element={<ParentFinance />} />
          </Route>
          <Route path="*" element={<Navigate to="/portal/parent" replace />} />
        </Routes>
      </PortalChildProvider>
    )
  }

  // Espace Admin / Staff
  return (
    <Routes>
      <Route path="/login"    element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/accueil"  element={<Landing />} />
      <Route path="/" element={<Layout />}>
        <Route index                  element={<Dashboard />} />
        <Route path="students"        element={<Students />} />
        <Route path="grades"          element={<Grades />} />
        <Route path="attendance"      element={<Attendance />} />
        <Route path="schedule"        element={<Schedule />} />
        <Route path="staff"           element={<Staff />} />
        <Route path="finance"         element={<Finance />} />
        <Route path="messages"        element={<Messages />} />
        <Route path="settings"        element={<Settings />} />
        <Route path="academic-years"  element={<AcademicYears />} />
        <Route path="cards"           element={<CardsPage />} />
        <Route path="classes"         element={<Classes />} />
        <Route path="subjects"        element={<Subjects />} />
        <Route path="parents"         element={<Parents />} />
        <Route path="exams"           element={<Exams />} />
        <Route path="staff-attendance" element={<StaffAttendance />} />
        <Route path="payroll"         element={<Payroll />} />
        <Route path="sms"             element={<SMS />} />
        <Route path="library"         element={<Library />} />
        <Route path="health"          element={<Health />} />
        <Route path="services"        element={<Services />} />
        <Route path="admin"           element={<SuperAdmin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
