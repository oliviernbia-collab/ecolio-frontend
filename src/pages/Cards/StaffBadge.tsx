import { printHtml, imageToBase64 } from '../../lib/print'

interface StaffData {
  first_name:  string
  last_name:   string
  email?:      string
  phone?:      string
  position?:   string
  role:        string
  avatar_url?: string
  id:          number
}

interface SchoolData {
  name:          string
  address?:      string
  phone?:        string
  logo_url?:     string
  primary_color?: string
}

const ROLE_LABELS: Record<string, string> = {
  director:   'Directeur',
  teacher:    'Enseignant(e)',
  accountant: 'Comptable',
  staff:      'Personnel',
  super_admin:'Administrateur',
  secretary:  'Secrétaire',
}

function badgeHtml(staff: StaffData, school: SchoolData, logoB64: string, photoB64: string): string {
  const color    = school.primary_color || '#1A3C5E'
  const roleLabel = staff.position || ROLE_LABELS[staff.role] || staff.role
  const initials  = `${staff.first_name[0]}${staff.last_name[0]}`.toUpperCase()
  const badgeId   = `ECO-STAFF-${String(staff.id).padStart(4, '0')}`

  const logoImg = logoB64
    ? `<img src="${logoB64}" style="width:36px;height:36px;object-fit:contain;border-radius:4px;" />`
    : `<div style="width:36px;height:36px;background:white;border-radius:4px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:${color};">${school.name[0]}</div>`

  const photoEl = photoB64
    ? `<img src="${photoB64}" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:3px solid white;" />`
    : `<div style="width:80px;height:80px;border-radius:50%;border:3px solid white;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:white;">${initials}</div>`

  return `
<div style="
  width:260px; border-radius:12px; overflow:hidden;
  box-shadow:0 4px 20px rgba(0,0,0,0.18);
  font-family:'Segoe UI',Arial,sans-serif;
  page-break-inside:avoid; margin:8px;
">
  <!-- Header coloré avec photo -->
  <div style="background:linear-gradient(135deg,${color},${color}cc);padding:20px 16px;text-align:center;">
    ${logoImg ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">${logoImg}<span style="color:white;font-size:10px;font-weight:700;">${school.name.toUpperCase()}</span></div>` : ''}
    ${photoEl}
    <div style="margin-top:10px;background:rgba(255,255,255,0.15);border-radius:6px;padding:3px 10px;display:inline-block;">
      <span style="color:white;font-size:9px;font-weight:700;letter-spacing:1px;">${roleLabel.toUpperCase()}</span>
    </div>
  </div>

  <!-- Body -->
  <div style="background:white;padding:14px;text-align:center;">
    <div style="font-size:11px;color:#888;margin-bottom:2px;">${staff.first_name}</div>
    <div style="font-size:16px;font-weight:800;color:${color};margin-bottom:12px;">${staff.last_name.toUpperCase()}</div>

    <div style="background:#f8fafc;border-radius:8px;padding:10px;text-align:left;font-size:10px;">
      ${staff.email  ? `<div style="margin-bottom:4px;color:#666;">✉ ${staff.email}</div>`  : ''}
      ${staff.phone  ? `<div style="color:#666;">📞 ${staff.phone}</div>`  : ''}
    </div>

    <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:8px;color:#aaa;font-family:monospace;">${badgeId}</div>
      <div style="border:1px solid ${color};border-radius:4px;padding:2px 8px;">
        <span style="font-size:8px;color:${color};font-weight:600;">Signature</span>
      </div>
    </div>
  </div>

  <!-- Bande de couleur en bas -->
  <div style="background:${color};height:6px;"></div>
</div>`
}

export async function printStaffBadge(staff: StaffData, school: SchoolData) {
  const [logoB64, photoB64] = await Promise.all([
    school.logo_url   ? imageToBase64(school.logo_url)    : Promise.resolve(''),
    staff.avatar_url  ? imageToBase64(staff.avatar_url)   : Promise.resolve(''),
  ])

  const html = `
<style>
  @page { size: A4; margin: 15mm; }
  .badges-grid { display:flex;flex-wrap:wrap;gap:16px;justify-content:center;max-width:960px; }
</style>
<div class="badges-grid">
  ${badgeHtml(staff, school, logoB64, photoB64)}
</div>`

  printHtml(html, `Badge — ${staff.first_name} ${staff.last_name}`)
}

export async function printBulkStaffBadges(staffList: StaffData[], school: SchoolData) {
  const logoB64 = school.logo_url ? await imageToBase64(school.logo_url) : ''
  const badges  = await Promise.all(
    staffList.map(async s => {
      const photoB64 = s.avatar_url ? await imageToBase64(s.avatar_url) : ''
      return badgeHtml(s, school, logoB64, photoB64)
    })
  )

  const html = `
<style>
  @page { size: A4; margin: 10mm; }
  .badges-grid { display:flex;flex-wrap:wrap;gap:16px;justify-content:center;max-width:960px; }
</style>
<div class="badges-grid">${badges.join('')}</div>`

  printHtml(html, `Badges personnel — ${school.name}`)
}
