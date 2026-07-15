import { useState, useEffect } from 'react'
import {
  Grid, Card, CardContent, Typography, Box, CircularProgress, Avatar, Chip,
  List, ListItem, ListItemText, ListItemAvatar, Divider, LinearProgress, Table,
  TableBody, TableCell, TableHead, TableRow, TableContainer, Button
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faUsers, faIdBadge, faChalkboard, faTriangleExclamation, faWallet,
  faCalendarCheck, faEnvelope, faBook, faChartLine,
  faChild, faClockRotateLeft, faCircleCheck, faUserClock
} from '@fortawesome/free-solid-svg-icons'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts'
import api from '../../lib/axios'
import { useAuth } from '../../contexts/AuthContext'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string; value: number | string; icon: any; color: string
  subtitle?: string; trend?: string; to?: string
}
function StatCard({ title, value, icon, color, subtitle, trend, to }: StatCardProps) {
  const navigate = useNavigate()
  return (
    <Card
      onClick={to ? () => navigate(to) : undefined}
      sx={{
        height: '100%',
        borderTop: `4px solid ${color}`,
        cursor: to ? 'pointer' : 'default',
        transition: 'transform 0.18s, box-shadow 0.18s',
        '&:hover': to ? { transform: 'translateY(-3px)', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }
                       : { boxShadow: '0 6px 24px rgba(0,0,0,0.10)' },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}
              sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}
              sx={{ color, mt: 0.5, lineHeight: 1, fontSize: { xs: '1.8rem', sm: '2.1rem' }, animation: 'fadeInUp 0.4s ease-out both' }}>
              {value}
            </Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: `${color}18`, width: 48, height: 48 }}>
            <Box sx={{ color }}><FontAwesomeIcon icon={icon} style={{ fontSize: '1.3rem' }} /></Box>
          </Avatar>
        </Box>
        {trend && <Chip label={trend} size="small" sx={{ fontSize: '0.7rem', bgcolor: `${color}18`, color }} />}
      </CardContent>
    </Card>
  )
}

// ── Greet bar ─────────────────────────────────────────────────────────────────
function Greeting({ name }: { name?: string }) {
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" fontWeight={700}>{hello}, {name} 👋</Typography>
      <Typography variant="body2" color="text.secondary">
        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </Typography>
    </Box>
  )
}

// ── Empty data placeholder ───────────────────────────────────────────────────
function NoData({ label }: { label: string }) {
  return <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>{label}</Typography>
}

// ── DIRECTOR / SUPER_ADMIN DASHBOARD ─────────────────────────────────────────
function DirectorDashboard({ data }: { data: any }) {
  const attendanceRate = data.attendance.today.total > 0
    ? Math.round((data.attendance.today.present / data.attendance.today.total) * 100) : 0
  const collectedRate = data.finance.total > 0
    ? Math.round((data.finance.collected / data.finance.total) * 100) : 0

  const chartData = (data.attendance.trend || []).map((d: any) => ({
    date: d.date ? format(parseISO(d.date), 'dd/MM', { locale: fr }) : '',
    Présents: d.present, Absents: d.absent,
  }))
  const avgData = (data.classAverages || []).map((c: any) => ({
    classe: c.class_name, Moyenne: parseFloat(String(c.average)),
  }))

  return (
    <>
      <Grid container spacing={2.5} sx={{ mb: 3 }} className="stagger">
        <Grid item xs={12} sm={6} lg={3}><StatCard title="Élèves inscrits" value={data.counters.students} icon={faUsers} color={ECOLIO_NAVY} subtitle="Année en cours" to="/students" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><StatCard title="Personnel" value={data.counters.teachers} icon={faIdBadge} color={ECOLIO_BLUE} subtitle="Enseignants & staff" to="/staff" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><StatCard title="Classes" value={data.counters.classes} icon={faChalkboard} color="#2ecc71" subtitle="Tous cycles" to="/classes" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><StatCard title="Factures impayées" value={data.counters.unpaid_invoices} icon={faTriangleExclamation} color="#e74c3c" subtitle="En attente" trend={data.counters.unpaid_invoices > 0 ? 'À traiter' : 'À jour'} to="/finance" /></Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Présences — Aujourd'hui</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="h3" fontWeight={700} color={ECOLIO_NAVY}>{attendanceRate}%</Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">Présents: <b style={{ color: '#2ecc71' }}>{data.attendance.today.present}</b></Typography><br />
                  <Typography variant="caption" color="text.secondary">Absents: <b style={{ color: '#e74c3c' }}>{data.attendance.today.absent}</b></Typography><br />
                  <Typography variant="caption" color="text.secondary">Total: <b>{data.attendance.today.total}</b></Typography>
                </Box>
              </Box>
              <LinearProgress variant="determinate" value={attendanceRate}
                sx={{ height: 8, borderRadius: 4, bgcolor: '#fee2e2', '& .MuiLinearProgress-bar': { bgcolor: '#2ecc71' } }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Finances</Typography>
              <Typography variant="h5" fontWeight={700} color={ECOLIO_NAVY} mb={0.5}>
                {(data.finance.collected / 1000).toFixed(0)}k <Typography component="span" variant="caption">FCFA collectés</Typography>
              </Typography>
              <LinearProgress variant="determinate" value={collectedRate}
                sx={{ height: 8, borderRadius: 4, mb: 1.5, bgcolor: '#fef3c7', '& .MuiLinearProgress-bar': { bgcolor: ECOLIO_BLUE } }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Collecté: <b>{collectedRate}%</b></Typography>
                <Typography variant="caption" color="error">En attente: {(data.finance.pending / 1000).toFixed(0)}k FCFA</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1.5}>Absences récentes</Typography>
              {!data.recentAbsences?.length ? <NoData label="Aucune absence récente" /> : (
                <List dense disablePadding>
                  {data.recentAbsences.slice(0, 4).map((a: any, i: number) => (
                    <ListItem key={i} disablePadding sx={{ py: 0.5 }}>
                      <ListItemAvatar sx={{ minWidth: 36 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: '#fee2e2', color: '#e74c3c' }}>
                          {a.student_name?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="caption" fontWeight={500}>{a.student_name}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{a.class_name} · {a.date}</Typography>} />
                      <Chip label={a.justified ? 'Justifié' : 'Non justifié'} size="small"
                        sx={{ fontSize: '0.6rem', height: 18, bgcolor: a.justified ? '#dcfce7' : '#fee2e2', color: a.justified ? '#16a34a' : '#dc2626' }} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Évolution des présences (7 jours)</Typography>
              {chartData.length === 0 ? <NoData label="Aucune donnée" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-present" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={ECOLIO_BLUE} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={ECOLIO_BLUE} stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="Présents" stroke={ECOLIO_BLUE} fill="url(#grad-present)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Absents" stroke="#e74c3c" fill="none" strokeWidth={2} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Moyennes par classe</Typography>
              {avgData.length === 0 ? <NoData label="Aucune note disponible" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={avgData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="classe" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                    <ChartTooltip />
                    <Bar dataKey="Moyenne" fill={ECOLIO_NAVY} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

// ── TEACHER DASHBOARD ─────────────────────────────────────────────────────────
function TeacherDashboard({ data }: { data: any }) {
  return (
    <>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard title="Mes classes" value={data.counters.my_classes} icon={faChalkboard} color="#6366f1" subtitle="Classes assignées" to="/classes" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Mes élèves" value={data.counters.my_students} icon={faUsers} color={ECOLIO_NAVY} subtitle="Total actifs" to="/students" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Notes saisies" value={data.counters.grades_given} icon={faChartLine} color="#2ecc71" subtitle="Récentes (10)" to="/grades" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Messages non lus" value={data.counters.unread_messages} icon={faEnvelope} color="#e74c3c" trend={data.counters.unread_messages > 0 ? 'Non lus' : 'À jour'} to="/messages" /></Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Emploi du temps du jour */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', borderTop: '4px solid #6366f1' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Mes cours aujourd'hui</Typography>
              {!data.todaySchedule?.length ? <NoData label="Aucun cours aujourd'hui" /> : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {data.todaySchedule.map((s: any, i: number) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1.5, p: 1.5, bgcolor: '#f8f9ff', borderRadius: 1.5,
                      borderLeft: '3px solid #6366f1' }}>
                      <Box sx={{ textAlign: 'center', minWidth: 48 }}>
                        <Typography variant="caption" fontWeight={700} color="#6366f1" display="block">{s.start_time?.slice(0,5)}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.end_time?.slice(0,5)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{s.subject_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.class_name}{s.room_name ? ` · ${s.room_name}` : ''}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Mes classes */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderTop: `4px solid ${ECOLIO_NAVY}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Mes classes</Typography>
              {!data.myClasses?.length ? <NoData label="Aucune classe assignée" /> : (
                <Grid container spacing={1.5}>
                  {data.myClasses.map((c: any) => (
                    <Grid item xs={6} key={c.id}>
                      <Box sx={{ p: 1.5, border: '1px solid #e8f0fe', borderRadius: 1.5, bgcolor: '#f8faff' }}>
                        <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.student_count || 0} élèves · {c.cycle}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Notes récentes */}
        <Grid item xs={12}>
          <Card sx={{ borderTop: `4px solid #2ecc71` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Dernières notes saisies</Typography>
              {!data.recentGrades?.length ? <NoData label="Aucune note saisie récemment" /> : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 480 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Élève</TableCell>
                        <TableCell>Matière</TableCell>
                        <TableCell align="center">Note</TableCell>
                        <TableCell className="hide-xs">Période</TableCell>
                        <TableCell className="hide-xs">Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.recentGrades.map((g: any) => (
                        <TableRow key={g.id}>
                          <TableCell><Typography variant="body2" fontWeight={500}>{g.student_name}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{g.subject_name}</Typography></TableCell>
                          <TableCell align="center">
                            <Chip label={`${g.value}/${g.max_value}`} size="small"
                              sx={{ bgcolor: parseFloat(g.value) >= parseFloat(g.max_value)/2 ? '#dcfce7' : '#fee2e2',
                                   color:  parseFloat(g.value) >= parseFloat(g.max_value)/2 ? '#16a34a' : '#dc2626',
                                   fontWeight: 700, fontSize: '0.7rem' }} />
                          </TableCell>
                          <TableCell className="hide-xs"><Typography variant="caption">{g.period}</Typography></TableCell>
                          <TableCell className="hide-xs"><Typography variant="caption">{g.created_at?.split('T')[0]}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

// ── PARENT DASHBOARD ──────────────────────────────────────────────────────────
function ParentDashboard({ data }: { data: any }) {
  return (
    <>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard title="Mes enfants" value={data.counters.children} icon={faChild} color={ECOLIO_NAVY} subtitle="Inscrits" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Absences" value={data.counters.absences} icon={faCalendarCheck} color="#e74c3c" subtitle="Récentes" to="/attendance" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Factures impayées" value={data.counters.unpaid} icon={faWallet} color="#d97706" trend={data.counters.unpaid > 0 ? 'À régler' : 'À jour'} to="/finance" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Messages" value={data.counters.unread_messages} icon={faEnvelope} color="#6366f1" trend={data.counters.unread_messages > 0 ? 'Non lus' : 'À jour'} to="/messages" /></Grid>
      </Grid>

      {/* Mes enfants */}
      {data.myChildren?.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {data.myChildren.map((child: any) => (
            <Grid item xs={12} sm={6} md={4} key={child.id}>
              <Card sx={{ borderTop: `4px solid ${ECOLIO_BLUE}` }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Avatar src={child.photo_url || ''} sx={{ width: 44, height: 44, bgcolor: ECOLIO_NAVY }}>
                      {child.first_name?.[0]}{child.last_name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight={700}>{child.first_name} {child.last_name}</Typography>
                      <Chip label={child.class_name || 'Sans classe'} size="small"
                        sx={{ bgcolor: '#e8f0fe', color: ECOLIO_NAVY, fontSize: '0.65rem', mt: 0.3 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Grid container spacing={2.5}>
        {/* Dernières notes */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderTop: `4px solid #2ecc71` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Dernières notes</Typography>
              {!data.recentGrades?.length ? <NoData label="Aucune note disponible" /> : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 420 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Enfant</TableCell>
                        <TableCell>Matière</TableCell>
                        <TableCell align="center">Note</TableCell>
                        <TableCell>Période</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.recentGrades.slice(0, 8).map((g: any) => (
                        <TableRow key={g.id}>
                          <TableCell><Typography variant="caption">{g.student_name}</Typography></TableCell>
                          <TableCell><Typography variant="caption">{g.subject_name}</Typography></TableCell>
                          <TableCell align="center">
                            <Chip label={`${g.value}/${g.max_value}`} size="small"
                              sx={{ bgcolor: parseFloat(g.value) >= parseFloat(g.max_value)/2 ? '#dcfce7' : '#fee2e2',
                                   color:  parseFloat(g.value) >= parseFloat(g.max_value)/2 ? '#16a34a' : '#dc2626',
                                   fontWeight: 700, fontSize: '0.7rem' }} />
                          </TableCell>
                          <TableCell><Typography variant="caption">{g.period}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Absences + factures */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card sx={{ borderTop: '4px solid #e74c3c' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Absences récentes</Typography>
                {!data.recentAbsences?.length ? <NoData label="Aucune absence" /> : (
                  <List dense disablePadding>
                    {data.recentAbsences.slice(0, 4).map((a: any, i: number) => (
                      <ListItem key={i} disablePadding sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={<Typography variant="caption" fontWeight={500}>{a.student_name}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary">{a.class_name} · {a.date}</Typography>} />
                        <Chip label={a.justified ? 'Justifié' : 'Non just.'} size="small"
                          sx={{ fontSize: '0.6rem', height: 18, bgcolor: a.justified ? '#dcfce7' : '#fee2e2', color: a.justified ? '#16a34a' : '#dc2626' }} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
            <Card sx={{ borderTop: '4px solid #d97706' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Factures à payer</Typography>
                {!data.unpaidInvoices?.length ? <NoData label="Aucune facture impayée" /> : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {data.unpaidInvoices.map((inv: any) => (
                      <Box key={inv.id} sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5,
                        bgcolor: '#fffbeb', borderRadius: 1, border: '1px solid #fde68a' }}>
                        <Box>
                          <Typography variant="caption" fontWeight={600}>{inv.student_name}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">{inv.type} · Éch. {inv.due_date}</Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={700} color="#d97706">
                          {parseInt(inv.amount).toLocaleString('fr-FR')} F
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </>
  )
}

// ── ACCOUNTANT DASHBOARD ──────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  scolarite: 'Scolarité', transport: 'Transport', cantine: 'Cantine',
  uniforme: 'Uniforme', activite: 'Activité', autre: 'Autre'
}
const PIE_COLORS = ['#1A3C5E','#2E86AB','#2ecc71','#f59e0b','#e74c3c','#8b5cf6']

function AccountantDashboard({ data }: { data: any }) {
  const { counters, byType = [], recentInvoices = [], monthlyTrend = [] } = data
  const trendData = monthlyTrend.map((m: any) => ({
    mois: m.month?.slice(5), Collecté: parseFloat(m.collected),
  }))
  const pieData = byType.map((t: any) => ({
    name: TYPE_LABELS[t.type] || t.type,
    value: parseFloat(t.collected) + parseFloat(t.pending),
  })).filter((d: any) => d.value > 0)

  return (
    <>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard title="Total facturé" value={`${Math.round(counters.total/1000)}k F`} icon={faWallet} color={ECOLIO_NAVY} subtitle="FCFA" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Collecté" value={`${Math.round(counters.collected/1000)}k F`} icon={faCircleCheck} color="#2ecc71" subtitle={`${counters.paid_count} paiements`} /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="En attente" value={`${Math.round(counters.pending/1000)}k F`} icon={faUserClock} color="#d97706" subtitle={`${counters.pending_count} factures`} /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="En retard" value={`${Math.round(counters.overdue/1000)}k F`} icon={faTriangleExclamation} color="#e74c3c" subtitle={`${counters.overdue_count} factures`} trend={counters.overdue_count > 0 ? 'À relancer' : 'RAS'} to="/finance" /></Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderTop: `4px solid ${ECOLIO_NAVY}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Tendance mensuelle des paiements</Typography>
              {trendData.length === 0 ? <NoData label="Aucune donnée mensuelle" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v/1000)}k`} />
                    <ChartTooltip formatter={(v: any) => [`${parseInt(v).toLocaleString('fr-FR')} FCFA`]} />
                    <Bar dataKey="Collecté" fill={ECOLIO_BLUE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderTop: '4px solid #2ecc71', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Répartition par type</Typography>
              {pieData.length === 0 ? <NoData label="Aucune donnée" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip formatter={(v: any) => [`${parseInt(v).toLocaleString('fr-FR')} FCFA`]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card sx={{ borderTop: '4px solid #d97706' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Dernières factures</Typography>
              {!recentInvoices.length ? <NoData label="Aucune facture" /> : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 500 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Élève</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Montant</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell className="hide-xs">Échéance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentInvoices.map((inv: any) => (
                        <TableRow key={inv.id}>
                          <TableCell><Typography variant="body2">{inv.student_name}</Typography></TableCell>
                          <TableCell><Typography variant="caption">{TYPE_LABELS[inv.type] || inv.type}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="caption" fontWeight={600}>{parseInt(inv.amount).toLocaleString('fr-FR')} F</Typography></TableCell>
                          <TableCell>
                            <Chip size="small" label={inv.status}
                              sx={{ fontSize: '0.65rem', height: 18,
                                bgcolor: inv.status==='paid' ? '#dcfce7' : inv.status==='overdue' ? '#fee2e2' : '#fef3c7',
                                color: inv.status==='paid' ? '#16a34a' : inv.status==='overdue' ? '#dc2626' : '#92400e' }} />
                          </TableCell>
                          <TableCell className="hide-xs"><Typography variant="caption">{inv.due_date}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

// ── COUNSELOR DASHBOARD ───────────────────────────────────────────────────────
function CounselorDashboard({ data }: { data: any }) {
  const { todaySummary, attendanceByClass = [], absentToday = [], trend = [] } = data
  const rate = todaySummary?.total > 0 ? Math.round((todaySummary.present / todaySummary.total) * 100) : 0
  const chartData = trend.map((d: any) => ({
    date: d.date ? format(parseISO(d.date), 'dd/MM', { locale: fr }) : '',
    Présents: d.present, Absents: d.absent,
  }))

  return (
    <>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard title="Présents" value={todaySummary?.present || 0} icon={faCircleCheck} color="#2ecc71" subtitle="Aujourd'hui" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Absents" value={todaySummary?.absent || 0} icon={faTriangleExclamation} color="#e74c3c" subtitle="Aujourd'hui" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Retards" value={todaySummary?.late || 0} icon={faClockRotateLeft} color="#d97706" subtitle="Aujourd'hui" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Taux de présence" value={`${rate}%`} icon={faCalendarCheck} color={ECOLIO_BLUE} subtitle="Aujourd'hui" /></Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderTop: `4px solid ${ECOLIO_NAVY}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Présences par classe — Aujourd'hui</Typography>
              {!attendanceByClass.length ? <NoData label="Aucune donnée de présence aujourd'hui" /> : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 480 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Classe</TableCell>
                        <TableCell align="center">Présents</TableCell>
                        <TableCell align="center">Absents</TableCell>
                        <TableCell align="center">Retards</TableCell>
                        <TableCell>Taux</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceByClass.map((c: any) => {
                        const total = c.present + c.absent + c.late
                        const p = total > 0 ? Math.round((c.present / total) * 100) : 0
                        return (
                          <TableRow key={c.class_id}>
                            <TableCell><Typography variant="body2" fontWeight={500}>{c.class_name}</Typography></TableCell>
                            <TableCell align="center"><Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>{c.present}</Typography></TableCell>
                            <TableCell align="center"><Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>{c.absent}</Typography></TableCell>
                            <TableCell align="center"><Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600 }}>{c.late}</Typography></TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress variant="determinate" value={p}
                                  sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#f0f0f0',
                                    '& .MuiLinearProgress-bar': { bgcolor: p >= 80 ? '#22c55e' : p >= 60 ? '#f59e0b' : '#ef4444' } }} />
                                <Typography variant="caption" fontWeight={600}>{p}%</Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card sx={{ borderTop: '4px solid #e74c3c' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Absents aujourd'hui ({absentToday.length})</Typography>
                {!absentToday.length ? <NoData label="Aucun absent" /> : (
                  <Box sx={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    {absentToday.map((a: any, i: number) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.8, bgcolor: '#fff5f5', borderRadius: 1 }}>
                        <Avatar sx={{ width: 26, height: 26, fontSize: '0.65rem', bgcolor: '#fee2e2', color: '#e74c3c' }}>
                          {a.student_name?.[0]}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" fontWeight={500} noWrap>{a.student_name}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>{a.class_name}</Typography>
                        </Box>
                        {a.justified && <Chip label="Just." size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: '#dcfce7', color: '#16a34a' }} />}
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card sx={{ borderTop: `4px solid ${ECOLIO_BLUE}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Tendance (7 jours)</Typography>
                <ResponsiveContainer width="100%" height={130}>
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-p" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <ChartTooltip />
                    <Area type="monotone" dataKey="Présents" stroke="#22c55e" fill="url(#grad-p)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Absents" stroke="#e74c3c" fill="none" strokeWidth={1.5} strokeDasharray="3 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </>
  )
}

function SecretaryDashboard({ data }: { data: any }) {
  return (
    <>
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={6} sm={3}><StatCard title="Élèves inscrits" value={data.counters.students} icon={faUsers} color={ECOLIO_NAVY} subtitle="Année en cours" to="/students" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Messages non lus" value={data.counters.unread_messages} icon={faEnvelope} color="#e74c3c" trend={data.counters.unread_messages > 0 ? 'Non lus' : 'À jour'} to="/messages" /></Grid>
      </Grid>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Inscriptions récentes</Typography>
          {!data.recentStudents?.length ? <NoData label="Aucune inscription récente" /> : (
            <List disablePadding>
              {data.recentStudents.map((s: any) => (
                <ListItem key={s.id} disablePadding sx={{ py: 1 }}>
                  <ListItemAvatar><Avatar sx={{ bgcolor: ECOLIO_BLUE }}>{s.first_name?.[0]}{s.last_name?.[0]}</Avatar></ListItemAvatar>
                  <ListItemText primary={`${s.first_name} ${s.last_name}`} secondary={s.matricule} />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </>
  )
}

// ── DEFAULT (librarian, nurse, maintenance, student) ──────────────────────────
function DefaultDashboard({ role }: { role: string }) {
  const ROLE_INFO: Record<string, { label: string; color: string; message: string }> = {
    librarian:   { label: 'Bibliothécaire',       color: '#ec4899', message: 'Gérez les ressources documentaires de l\'établissement.' },
    nurse:       { label: 'Infirmier(e)',          color: '#ef4444', message: 'Consultez les dossiers médicaux et suivez la santé des élèves.' },
    maintenance: { label: 'Agent de maintenance',  color: '#78716c', message: 'Gérez les demandes d\'entretien et de maintenance.' },
    student:     { label: 'Élève',                color: '#f59e0b', message: 'Consultez vos notes et votre emploi du temps.' },
  }
  const info = ROLE_INFO[role] || { label: role, color: ECOLIO_NAVY, message: 'Bienvenue sur Écolio.' }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, textAlign: 'center' }}>
      <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: `${info.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <FontAwesomeIcon icon={faBook} style={{ fontSize: '2rem', color: info.color }} />
      </Box>
      <Typography variant="h5" fontWeight={700} mb={1}>{info.label}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340 }}>{info.message}</Typography>
    </Box>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>

  if (!stats?.data) return (
    <Box sx={{ textAlign: 'center', mt: 8, color: 'text.secondary' }}>
      <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '3rem', opacity: 0.3, marginBottom: 16 }} />
      <Typography variant="h6" gutterBottom>Tableau de bord indisponible</Typography>
      <Typography variant="body2">Vérifiez que le serveur backend est démarré.</Typography>
    </Box>
  )

  const role = user?.role || ''
  const data = stats.data

  return (
    <Box>
      <Greeting name={user?.first_name} />
      {(['super_admin', 'director'] as string[]).includes(role) && <DirectorDashboard data={data} />}
      {role === 'teacher'    && <TeacherDashboard    data={data} />}
      {role === 'parent'     && <ParentDashboard     data={data} />}
      {role === 'accountant' && <AccountantDashboard data={data} />}
      {role === 'counselor'  && <CounselorDashboard  data={data} />}
      {role === 'secretary'  && <SecretaryDashboard  data={data} />}
      {!['super_admin','director','teacher','parent','accountant','counselor','secretary'].includes(role) && <DefaultDashboard role={role} />}
    </Box>
  )
}
