import QRCode from 'qrcode'
import { printHtml, imageToBase64 } from '../../lib/print'

interface StudentCardData {
  first_name: string
  last_name:  string
  matricule:  string
  class_name?: string
  birth_date?: string
  birth_place?: string
  gender:     string
  photo_url?: string
  blood_type?: string
  emergency_contact_phone?: string
}

interface SchoolData {
  name:          string
  address?:      string
  phone?:        string
  logo_url?:     string
  primary_color?: string
}

function cardHtml(s: StudentCardData, school: SchoolData, logoB64: string, photoB64: string, qrB64: string, year: string): string {
  const color   = school.primary_color || '#1A3C5E'
  const gender  = s.gender === 'F' ? 'F' : 'M'
  const dob     = s.birth_date ? new Date(s.birth_date).toLocaleDateString('fr-FR') : '—'
  const initials = `${s.first_name[0]}${s.last_name[0]}`.toUpperCase()

  const logoImg = logoB64
    ? `<img src="${logoB64}" style="width:30px;height:30px;object-fit:contain;border-radius:50%;" />`
    : `<div style="width:30px;height:30px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:white;">${school.name[0]}</div>`

  const photoEl = photoB64
    ? `<img src="${photoB64}" style="width:72px;height:92px;object-fit:cover;border-radius:5px;border:2px solid ${color};" />`
    : `<div style="width:72px;height:92px;border-radius:5px;border:2px solid ${color};background:#f0f4ff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:${color};">${initials}</div>`

  const field = (value: string, label: string, valueColor = '#1a1a1a') => `
    <div>
      <div style="font-size:11px;font-weight:800;color:${valueColor};line-height:1.2;">${value || '—'}</div>
      <div style="font-size:6.5px;color:#888;text-transform:uppercase;letter-spacing:0.3px;">${label}</div>
    </div>`

  return `
<div style="
  width:340px; height:214px; border-radius:12px; overflow:hidden; position:relative;
  box-shadow:0 4px 20px rgba(0,0,0,0.2);
  font-family:'Segoe UI',Arial,sans-serif;
  page-break-inside:avoid; margin:8px;
  background:white;
">
  <!-- Watermark tricolore -->
  <div style="position:absolute;inset:0;
    background:linear-gradient(120deg, #F77F0014 0%, #F77F0014 30%, #ffffff00 30%, #ffffff00 65%, #00993914 65%, #00993914 100%);
    z-index:0;"></div>

  <!-- En-tête institutionnel -->
  <div style="position:relative;z-index:1;padding:6px 10px 4px;display:flex;align-items:center;gap:8px;border-bottom:2px solid ${color};">
    ${logoImg}
    <div style="text-align:center;flex:1;">
      <div style="font-size:8px;font-weight:800;color:#1a1a1a;letter-spacing:0.3px;">RÉPUBLIQUE DE CÔTE D'IVOIRE</div>
      <div style="font-size:6px;color:#666;font-style:italic;">Union – Discipline – Travail</div>
    </div>
    <div style="width:30px;"></div>
  </div>

  <!-- Bandeau titre -->
  <div style="position:relative;z-index:1;background:${color};padding:3px;text-align:center;">
    <span style="color:white;font-size:10px;font-weight:800;letter-spacing:1.5px;">CARTE D'IDENTITÉ SCOLAIRE</span>
  </div>

  <!-- Corps -->
  <div style="position:relative;z-index:1;padding:8px 10px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
      <span style="font-size:9px;font-weight:700;color:${color};">Année scolaire : ${year}</span>
      <span style="font-size:9px;font-weight:700;color:${color};">Matricule : ${s.matricule}</span>
    </div>

    <div style="display:flex;gap:10px;">
      ${photoEl}
      <div style="flex:1;display:flex;flex-direction:column;gap:5px;">
        ${field(s.last_name.toUpperCase(), 'Nom', color)}
        ${field(s.first_name, 'Prénom(s)')}
        <div style="display:flex;gap:12px;">
          ${field(dob, 'Date naiss.')}
          ${field(s.birth_place || '—', 'Lieu naiss.')}
        </div>
      </div>
      <div style="width:74px;display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        ${field(s.class_name || '—', 'Classe')}
        ${field(gender, 'Sexe')}
        ${qrB64 ? `<img src="${qrB64}" style="width:44px;height:44px;margin-top:2px;" />` : ''}
      </div>
    </div>

    ${s.emergency_contact_phone ? `
    <div style="margin-top:6px;padding-top:5px;border-top:1px dashed #ddd;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:6.5px;color:#888;text-transform:uppercase;">En cas d'urgence</span>
      <span style="font-size:10px;font-weight:800;color:#dc2626;">${s.emergency_contact_phone}</span>
    </div>` : ''}
  </div>
</div>`
}

export async function printStudentCard(student: StudentCardData, school: SchoolData, year: string) {
  const [logoB64, photoB64, qrB64] = await Promise.all([
    school.logo_url  ? imageToBase64(school.logo_url)   : Promise.resolve(''),
    student.photo_url ? imageToBase64(student.photo_url) : Promise.resolve(''),
    QRCode.toDataURL(`ECOLIO|${school.name}|${student.matricule}|${student.last_name} ${student.first_name}`, { margin: 0, width: 120 }),
  ])

  const html = `
<style>
  @page { size: A4; margin: 15mm; }
  @media print { body { background: white !important; } }
  .cards-grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; max-width: 960px; }
</style>
<div class="cards-grid">
  ${cardHtml(student, school, logoB64, photoB64, qrB64, year)}
</div>`

  printHtml(html, `Carte scolaire — ${student.first_name} ${student.last_name}`)
}

export async function printBulkStudentCards(students: StudentCardData[], school: SchoolData, year: string) {
  const logoB64 = school.logo_url ? await imageToBase64(school.logo_url) : ''

  const cards = await Promise.all(
    students.map(async s => {
      const [photoB64, qrB64] = await Promise.all([
        s.photo_url ? imageToBase64(s.photo_url) : Promise.resolve(''),
        QRCode.toDataURL(`ECOLIO|${school.name}|${s.matricule}|${s.last_name} ${s.first_name}`, { margin: 0, width: 120 }),
      ])
      return cardHtml(s, school, logoB64, photoB64, qrB64, year)
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
