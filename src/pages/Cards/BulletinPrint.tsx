import { printHtml, imageToBase64 } from '../../lib/print'

interface BulletinSubject {
  name:        string
  coefficient: number
  periods:     Record<string, number>
  average:     number
}

interface BulletinData {
  student: {
    first_name:  string
    last_name:   string
    matricule:   string
    class_name?: string
    gender:      string
    birth_date?: string
  }
  subjects:       BulletinSubject[]
  generalAverage: number
}

interface SchoolData {
  name:          string
  address?:      string
  phone?:        string
  email?:        string
  logo_url?:     string
  primary_color?: string
}

function appreciation(avg: number): { label: string; color: string } {
  if (avg >= 16) return { label: 'Très Bien',      color: '#16a34a' }
  if (avg >= 14) return { label: 'Bien',            color: '#2E86AB' }
  if (avg >= 12) return { label: 'Assez Bien',      color: '#0369a1' }
  if (avg >= 10) return { label: 'Passable',        color: '#d97706' }
  if (avg >= 8)  return { label: 'Insuffisant',     color: '#ea580c' }
  return               { label: 'Très Insuffisant', color: '#dc2626' }
}

const PERIOD_LABELS: Record<string, string> = {
  trimestre1: 'T1', trimestre2: 'T2', trimestre3: 'T3',
  semestre1: 'S1',  semestre2: 'S2',
}

export async function printBulletin(data: BulletinData, school: SchoolData, periodLabel: string) {
  const logoB64 = school.logo_url ? await imageToBase64(school.logo_url) : ''
  const color   = school.primary_color || '#1A3C5E'
  const appre   = appreciation(data.generalAverage)
  const dob     = data.student.birth_date ? new Date(data.student.birth_date).toLocaleDateString('fr-FR') : '—'

  // Collecter toutes les périodes présentes
  const allPeriods = [...new Set(data.subjects.flatMap(s => Object.keys(s.periods)))]
    .sort()
    .map(p => ({ key: p, label: PERIOD_LABELS[p] || p }))

  const logoEl = logoB64
    ? `<img src="${logoB64}" style="width:60px;height:60px;object-fit:contain;" />`
    : `<div style="width:60px;height:60px;background:${color};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:white;">${school.name[0]}</div>`

  const subjectRows = data.subjects.map(subj => {
    const periodCells = allPeriods.map(p => {
      const v = subj.periods[p.key]
      const col = v !== undefined ? (v >= 10 ? '#16a34a' : '#dc2626') : '#aaa'
      return `<td style="text-align:center;padding:7px 4px;font-weight:600;color:${col};">${v !== undefined ? v.toFixed(2) : '—'}</td>`
    }).join('')

    const avgCol = subj.average >= 10 ? '#16a34a' : '#dc2626'
    const appEl  = appreciation(subj.average)

    return `
<tr style="border-bottom:1px solid #f0f0f0;">
  <td style="padding:7px 10px;font-size:12px;">${subj.name}</td>
  <td style="text-align:center;padding:7px 4px;font-size:12px;">×${subj.coefficient}</td>
  ${periodCells}
  <td style="text-align:center;padding:7px 6px;font-weight:700;color:${avgCol};font-size:13px;">${subj.average.toFixed(2)}</td>
  <td style="padding:7px 10px;font-size:10px;color:${appEl.color};">${appEl.label}</td>
</tr>`
  }).join('')

  const html = `
<style>
  @page { size: A4 landscape; margin: 12mm; }
  @media print { body { background: white !important; } }
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  .bulletin { width: 100%; max-width: 960px; margin: 0 auto; background: white; }
  table { border-collapse: collapse; width: 100%; }
  th { background: ${color}; color: white; padding: 8px 6px; font-size: 11px; text-align: center; }
  th:first-child { text-align: left; padding-left: 10px; }
  tr:nth-child(even) { background: #fafafa; }
</style>

<div class="bulletin">

  <!-- En-tête -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:14px;border-bottom:3px solid ${color};">
    <div style="display:flex;align-items:center;gap:14px;">
      ${logoEl}
      <div>
        <div style="font-size:16px;font-weight:800;color:${color};">${school.name}</div>
        ${school.address ? `<div style="font-size:11px;color:#666;margin-top:2px;">${school.address}</div>` : ''}
        ${school.phone   ? `<div style="font-size:11px;color:#666;">Tél : ${school.phone}</div>`            : ''}
      </div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:18px;font-weight:800;color:${color};letter-spacing:1px;">BULLETIN DE NOTES</div>
      <div style="font-size:12px;color:#888;margin-top:4px;">${periodLabel}</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#666;">
      <div>Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
    </div>
  </div>

  <!-- Infos élève -->
  <div style="display:flex;gap:20px;margin-bottom:16px;background:#f8fafc;border-radius:8px;padding:12px 16px;">
    <div>
      <span style="font-size:10px;color:#888;">Nom & Prénom</span>
      <div style="font-size:14px;font-weight:700;color:#1a1a1a;">${data.student.last_name.toUpperCase()} ${data.student.first_name}</div>
    </div>
    <div>
      <span style="font-size:10px;color:#888;">Matricule</span>
      <div style="font-size:13px;font-weight:600;font-family:monospace;color:${color};">${data.student.matricule}</div>
    </div>
    <div>
      <span style="font-size:10px;color:#888;">Classe</span>
      <div style="font-size:13px;font-weight:600;color:#1a1a1a;">${data.student.class_name || '—'}</div>
    </div>
    <div>
      <span style="font-size:10px;color:#888;">Date de naissance</span>
      <div style="font-size:13px;font-weight:600;color:#1a1a1a;">${dob}</div>
    </div>
  </div>

  <!-- Tableau des notes -->
  <table>
    <thead>
      <tr>
        <th style="width:30%;text-align:left;padding-left:10px;">Matière</th>
        <th style="width:7%;">Coeff.</th>
        ${allPeriods.map(p => `<th style="width:10%;">${p.label}</th>`).join('')}
        <th style="width:10%;">Moy.</th>
        <th style="width:18%;text-align:left;">Appréciation</th>
      </tr>
    </thead>
    <tbody>
      ${subjectRows}
    </tbody>
  </table>

  <!-- Résumé -->
  <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end;">
    <div style="background:${color}11;border:2px solid ${color};border-radius:10px;padding:14px 24px;text-align:center;">
      <div style="font-size:11px;color:#888;margin-bottom:4px;">MOYENNE GÉNÉRALE</div>
      <div style="font-size:32px;font-weight:800;color:${color};">${data.generalAverage.toFixed(2)}</div>
      <div style="font-size:11px;color:#888;">/20</div>
      <div style="margin-top:6px;font-size:13px;font-weight:700;color:${appre.color};">${appre.label}</div>
    </div>

    <div style="display:flex;gap:40px;">
      <div style="text-align:center;">
        <div style="font-size:10px;color:#888;margin-bottom:30px;">Signature du directeur</div>
        <div style="border-top:1px solid #999;width:120px;padding-top:4px;font-size:9px;color:#aaa;">Signature et cachet</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:10px;color:#888;margin-bottom:30px;">Signature du parent</div>
        <div style="border-top:1px solid #999;width:120px;padding-top:4px;font-size:9px;color:#aaa;">Lu et approuvé</div>
      </div>
    </div>
  </div>

</div>`

  printHtml(html, `Bulletin — ${data.student.first_name} ${data.student.last_name}`)
}
