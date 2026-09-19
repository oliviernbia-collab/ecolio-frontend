import { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, Typography, Button, TextField, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Tooltip, Tabs, Tab
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faMagnifyingGlass, faPlus, faPenToSquare, faTrash, faBook, faRotateLeft, faPhone } from '@fortawesome/free-solid-svg-icons'
import api from '../../lib/axios'
import { Book, BookLoan, Student, StaffMember } from '../../types'
import { ECOLIO_NAVY } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SkeletonTable from '../../components/ui/SkeletonTable'
import EmptyState from '../../components/ui/EmptyState'

function BookForm({ open, onClose, book, onSaved }: { open: boolean; onClose: () => void; book: Book | null; onSaved: () => void }) {
  const { showToast } = useToast()
  const empty = { title: '', author: '', isbn: '', category: '', total_copies: 1 }
  const [form, setForm] = useState<any>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(book ? { title: book.title, author: book.author || '', isbn: book.isbn || '', category: book.category || '', total_copies: book.total_copies } : empty)
    setError('')
  }, [book, open])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Le titre est requis'); return }
    setSaving(true); setError('')
    try {
      if (book) await api.put(`/library/books/${book.id}`, form)
      else      await api.post('/library/books', form)
      showToast(book ? 'Livre modifié' : 'Livre ajouté', 'success')
      onSaved(); onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erreur lors de la sauvegarde'
      setError(msg); showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={window.innerWidth < 600}>
      <DialogTitle>{book ? 'Modifier le livre' : 'Ajouter un livre'}</DialogTitle>
      <DialogContent>
        {error && <Box sx={{ color: 'error.main', mb: 2, p: 1.5, bgcolor: '#fff5f5', borderRadius: 1, border: '1px solid #fecaca', fontSize: '0.85rem' }}>{error}</Box>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}><TextField fullWidth label="Titre *" value={form.title} onChange={e => set('title', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Auteur" value={form.author} onChange={e => set('author', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Catégorie" value={form.category} onChange={e => set('category', e.target.value)} placeholder="Roman, Manuel, BD…" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="ISBN" value={form.isbn} onChange={e => set('isbn', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Nombre d'exemplaires" type="number" value={form.total_copies}
            onChange={e => set('total_copies', Math.max(1, parseInt(e.target.value) || 1))} inputProps={{ min: 1 }} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : book ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function LoanForm({ open, onClose, books, students, staff, onSaved }: {
  open: boolean; onClose: () => void; books: Book[]; students: Student[]; staff: StaffMember[]; onSaved: () => void
}) {
  const { showToast } = useToast()
  const empty = { book_id: '', borrower_type: 'student', student_id: '', staff_id: '', due_date: '' }
  const [form, setForm] = useState<any>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (open) { setForm(empty); setError('') } }, [open])
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const selectedStudent = form.borrower_type === 'student' ? students.find(s => String(s.id) === String(form.student_id)) : null
  const selectedStaff = form.borrower_type === 'staff' ? staff.find(s => String(s.id) === String(form.staff_id)) : null
  const borrowerPhone = selectedStudent
    ? (selectedStudent.parent_phone || selectedStudent.emergency_contact_phone)
    : selectedStaff?.phone

  const handleSave = async () => {
    if (!form.book_id || !form.due_date || (form.borrower_type === 'student' ? !form.student_id : !form.staff_id)) {
      setError('Tous les champs sont requis'); return
    }
    setSaving(true); setError('')
    try {
      await api.post('/library/loans', {
        book_id: form.book_id, due_date: form.due_date,
        student_id: form.borrower_type === 'student' ? form.student_id : undefined,
        staff_id: form.borrower_type === 'staff' ? form.staff_id : undefined,
      })
      showToast('Emprunt enregistré', 'success')
      onSaved(); onClose()
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erreur lors de la sauvegarde'
      setError(msg); showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={window.innerWidth < 600}>
      <DialogTitle>Nouvel emprunt</DialogTitle>
      <DialogContent>
        {error && <Box sx={{ color: 'error.main', mb: 2, p: 1.5, bgcolor: '#fff5f5', borderRadius: 1, border: '1px solid #fecaca', fontSize: '0.85rem' }}>{error}</Box>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Livre</InputLabel>
              <Select value={form.book_id} onChange={e => set('book_id', e.target.value)} label="Livre">
                {books.filter(b => b.available_copies > 0).map(b => (
                  <MenuItem key={b.id} value={b.id}>{b.title} ({b.available_copies} dispo.)</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Emprunteur</InputLabel>
              <Select value={form.borrower_type} onChange={e => set('borrower_type', e.target.value)} label="Emprunteur">
                <MenuItem value="student">Élève</MenuItem>
                <MenuItem value="staff">Personnel</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            {form.borrower_type === 'student' ? (
              <FormControl fullWidth size="small">
                <InputLabel>Élève</InputLabel>
                <Select value={form.student_id} onChange={e => set('student_id', e.target.value)} label="Élève">
                  {students.map(s => <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.matricule})</MenuItem>)}
                </Select>
              </FormControl>
            ) : (
              <FormControl fullWidth size="small">
                <InputLabel>Personnel</InputLabel>
                <Select value={form.staff_id} onChange={e => set('staff_id', e.target.value)} label="Personnel">
                  {staff.map(s => <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.2, bgcolor: '#f8f9fc', borderRadius: 1, border: '1px solid #eef0f4' }}>
              <FontAwesomeIcon icon={faPhone} style={{ fontSize: '0.8rem', color: (selectedStudent || selectedStaff) ? ECOLIO_NAVY : '#9ca3af' }} />
              {selectedStudent || selectedStaff ? (
                <Typography variant="body2">
                  {selectedStudent ? 'Téléphone du parent : ' : 'Téléphone : '}
                  <strong>{borrowerPhone || 'non renseigné'}</strong>
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Sélectionnez {form.borrower_type === 'student' ? 'un élève' : 'un membre du personnel'} pour voir son numéro de téléphone
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Date de retour prévue" type="date" value={form.due_date}
              onChange={e => set('due_date', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const LOAN_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  emprunte: { label: 'Emprunté', bg: '#fef9c3', color: '#854d0e' },
  rendu:    { label: 'Rendu',    bg: '#dcfce7', color: '#16a34a' },
  perdu:    { label: 'Perdu',    bg: '#fee2e2', color: '#dc2626' },
}

export default function Library() {
  const { showToast } = useToast()
  const [tab, setTab] = useState(0)
  const [books, setBooks] = useState<Book[]>([])
  const [loans, setLoans] = useState<BookLoan[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [bookFormOpen, setBookFormOpen] = useState(false)
  const [loanFormOpen, setLoanFormOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [toDelete, setToDelete] = useState<Book | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [b, l, s, st] = await Promise.all([
        api.get('/library/books'), api.get('/library/loans'), api.get('/students'), api.get('/staff'),
      ])
      setBooks(b.data.data); setLoans(l.data.data); setStudents(s.data.data); setStaff(st.data.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleDeleteBook = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/library/books/${toDelete.id}`)
      showToast('Livre supprimé', 'success'); load()
    } catch { showToast('Erreur lors de la suppression', 'error') }
    finally { setDeleting(false); setToDelete(null) }
  }

  const handleReturn = async (loan: BookLoan, lost = false) => {
    try {
      await api.put(`/library/loans/${loan.id}/return`, { lost })
      showToast(lost ? 'Livre marqué perdu' : 'Livre rendu', 'success'); load()
    } catch { showToast('Erreur', 'error') }
  }

  const filteredBooks = useMemo(() => {
    const q = search.toLowerCase()
    return books.filter(b => !search || b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q))
  }, [books, search])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Bibliothèque</Typography>
          <Typography variant="body2" color="text.secondary">{books.length} livre{books.length > 1 ? 's' : ''} · {loans.filter(l => l.status === 'emprunte').length} emprunt(s) en cours</Typography>
        </Box>
        {tab === 0 ? (
          <Button variant="contained" startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
            onClick={() => { setSelectedBook(null); setBookFormOpen(true) }}>Ajouter un livre</Button>
        ) : (
          <Button variant="contained" startIcon={<FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.85rem' }} />}
            onClick={() => setLoanFormOpen(true)}>Nouvel emprunt</Button>
        )}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Catalogue" />
        <Tab label="Emprunts" />
      </Tabs>

      {tab === 0 ? (
        <>
          <Card sx={{ mb: 2 }}>
            <Box sx={{ p: 2 }}>
              <TextField placeholder="Rechercher un titre, un auteur…" value={search} onChange={e => setSearch(e.target.value)}
                size="small" sx={{ minWidth: { xs: '100%', sm: 320 } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '0.85rem', color: '#9ca3af' }} /></InputAdornment> }} />
            </Box>
          </Card>
          <Card>
            {loading ? <SkeletonTable columns={5} rows={6} /> : filteredBooks.length === 0 ? (
              <EmptyState icon={faBook} title="Aucun livre" subtitle="Ajoutez votre premier livre au catalogue."
                actionLabel="Ajouter un livre" onAction={() => { setSelectedBook(null); setBookFormOpen(true) }} />
            ) : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 500 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Titre</TableCell>
                      <TableCell className="hide-xs">Auteur</TableCell>
                      <TableCell className="hide-xs">Catégorie</TableCell>
                      <TableCell align="center">Disponibles</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBooks.map(b => (
                      <TableRow key={b.id}>
                        <TableCell><Typography variant="body2" fontWeight={500}>{b.title}</Typography></TableCell>
                        <TableCell className="hide-xs">{b.author || '—'}</TableCell>
                        <TableCell className="hide-xs">{b.category ? <Chip label={b.category} size="small" /> : '—'}</TableCell>
                        <TableCell align="center">
                          <Chip label={`${b.available_copies}/${b.total_copies}`} size="small"
                            sx={{ bgcolor: b.available_copies > 0 ? '#dcfce7' : '#fee2e2', color: b.available_copies > 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Modifier"><IconButton size="small" onClick={() => { setSelectedBook(b); setBookFormOpen(true) }}>
                            <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '0.8rem' }} /></IconButton></Tooltip>
                          <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => setToDelete(b)}>
                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.8rem' }} /></IconButton></Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </>
      ) : (
        <Card>
          {loading ? <SkeletonTable columns={5} rows={6} /> : loans.length === 0 ? (
            <EmptyState icon={faBook} title="Aucun emprunt" subtitle="Enregistrez un emprunt depuis le bouton ci-dessus." />
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Livre</TableCell>
                    <TableCell>Emprunteur</TableCell>
                    <TableCell className="hide-xs">Emprunté le</TableCell>
                    <TableCell className="hide-xs">Retour prévu</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loans.map(l => {
                    const st = LOAN_STATUS[l.status]
                    return (
                      <TableRow key={l.id}>
                        <TableCell>{l.book_title}</TableCell>
                        <TableCell>{l.student_name || l.staff_name}</TableCell>
                        <TableCell className="hide-xs">{l.borrowed_at?.split('T')[0]}</TableCell>
                        <TableCell className="hide-xs">{l.due_date?.split('T')[0]}</TableCell>
                        <TableCell><Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 600 }} /></TableCell>
                        <TableCell align="right">
                          {l.status === 'emprunte' && (
                            <Tooltip title="Marquer rendu">
                              <IconButton size="small" color="success" onClick={() => handleReturn(l)}>
                                <FontAwesomeIcon icon={faRotateLeft} style={{ fontSize: '0.8rem' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      <BookForm open={bookFormOpen} onClose={() => setBookFormOpen(false)} book={selectedBook} onSaved={load} />
      <LoanForm open={loanFormOpen} onClose={() => setLoanFormOpen(false)} books={books} students={students} staff={staff} onSaved={load} />
      <ConfirmDialog open={!!toDelete} title="Supprimer le livre"
        message={`Supprimer "${toDelete?.title}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer" variant="danger" loading={deleting}
        onConfirm={handleDeleteBook} onCancel={() => setToDelete(null)} />
    </Box>
  )
}
