import { printHtml, imageToBase64 } from '../../lib/print'

interface StudentCardData {
  first_name: string
  last_name:  string
  matricule:  string
  class_name?: string
  birth_date?: string
  gender:     string
  photo_url?: string
  blood_type?: string
}

interface SchoolData {
  name:          string
  address?:      string
  phone?:        string
  logo_url?:     string
  primary_color?: string
}

function cardHtml(s: StudentCardData, school: SchoolData, logoB64: string, photoB64: string, year: string): string {
  const color   = school.primary_color || '#1A3C5E'
  const gender  = s.gender === 'F' ? 'Fille' : 'Garçon'
  const dob     = s.birth_date ? new Date(s.birth_date).toLocaleDateString('fr-FR') : '—'
  const initials = `${s.first_name[0]}${s.last_name[0]}`.toUpperCase()

  const logoImg = logoB64
    ? `<img src="${logoB64}" style="width:42px;height:42px;object-fit:contain;border-radius:4px;" />`
    : `<div style="width:42px;height:42px;background:white;border-radius:4px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:${color};">${school.name[0]}</div>`

  const photoEl = photoB64
    ? `<img src="${photoB64}" style="width:90px;height:110px;object-fit:cover;border-radius:6px;border:2px solid ${color};" />`
    : `<div style="width:90px;height:110px;border-radius:6px;border:2px solid ${color};background:#f0f4ff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:${color};">${initials}</div>`

  return `
<div style="
  width:320px; border-radius:12px; overflow:hidden;
  box-shadow:0 4px 20px rgba(0,0,0,0.18);
  font-family:'Segoe UI',Arial,sans-serif;
  page-break-inside:avoid; margin:8px;
">
  <!-- Header -->
  <div style="background:${color};padding:12px 14px;display:flex;align-items:center;gap:10px;">
    ${logoImg}
    <div>
      <div style="color:white;font-size:11px;font-weight:700;letter-spacing:0.5px;">${school.name.toUpperCase()}</div>
      <div style="color:rgba(255,255,255,0.75);font-size:9px;margin-top:1px;">
        ${school.address || ''}
      </div>
    </div>
  </div>

  <!-- Badge title -->
  <div style="background:${color}dd;padding:5px;text-align:center;">
    <span style="color:white;font-size:10px;font-weight:700;letter-spacing:2px;">CARTE SCOLAIRE ${year}</span>
  </div>

  <!-- Body -->
  <div style="background:white;padding:14px;display:flex;gap:14px;align-items:flex-start;">
    ${photoEl}
    <div style="flex:1;">
      <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:2px;">${s.first_name}</div>
      <div style="font-size:15px;font-weight:800;color:${color};margin-bottom:10px;line-height:1.1;">${s.last_name.toUpperCase()}</div>

      <table style="font-size:10px;border-collapse:collapse;width:100%;">
        <tr>
          <td style="color:#888;padding-bottom:4px;width:40%;">Matricule</td>
          <td style="color:#1a1a1a;font-weight:600;font-family:monospace;">${s.matricule}</td>
        </tr>
        <tr>
          <td style="color:#888;padding-bottom:4px;">Classe</td>
          <td style="color:#1a1a1a;font-weight:600;">${s.class_name || '—'}</td>
        </tr>
        <tr>
          <td style="color:#888;padding-bottom:4px;">Né(e) le</td>
          <td style="color:#1a1a1a;">${dob}</td>
        </tr>
        <tr>
          <td style="color:#888;padding-bottom:4px;">Genre</td>
          <td style="color:#1a1a1a;">${gender}</td>
        </tr>
        ${s.blood_type ? `<tr><td style="color:#888;">Groupe sg.</td><td style="color:#dc2626;font-weight:700;">${s.blood_type}</td></tr>` : ''}
      </table>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;padding:8px 14px;border-top:1px solid #e8e8e8;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:8px;color:#aaa;">${school.phone || ''}</div>
    <div style="border:1px solid ${color};border-radius:4px;padding:2px 8px;">
      <span style="font-size:9px;color:${color};font-weight:600;">Signature direction</span>
    </div>
  </div>
</div>`
}

export async function printStudentCard(student: StudentCardData, school: SchoolData, year: string) {
  const [logoB64, photoB64] = await Promise.all([
    school.logo_url  ? imageToBase64(school.logo_url)   : Promise.resolve(''),
    student.photo_url ? imageToBase64(student.photo_url) : Promise.resolve(''),
  ])

  const html = `
<style>
  @page { size: A4; margin: 15mm; }
  @media print { body { background: white !important; } }
  .cards-grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; max-width: 960px; }
</style>
<div class="cards-grid">
  ${cardHtml(student, school, logoB64, photoB64, year)}
</div>`

  printHtml(html, `Carte scolaire — ${student.first_name} ${student.last_name}`)
}

export async function printBulkStudentCards(students: StudentCardData[], school: SchoolData, year: string) {
  const logoB64 = school.logo_url ? await imageToBase64(school.logo_url) : ''

  const cards = await Promise.all(
    students.map(async s => {
      const photoB64 = s.photo_url ? await imageToBase64(s.photo_url) : ''
      return cardHtml(s, school, logoB64, photoB64, year)
    })
  )

  const html = `
<style>
  @page { size: A4; margin: 10mm; }
  @media print { body { background: white !important; } }
  .cards-grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; max-width: 960px; }
</style>
<div class="cards-grid">${cards.join('')}</div>`

  printHtml(html, `Cartes scolaires — ${school.name}`)
}
