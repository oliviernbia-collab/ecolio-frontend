import { printHtml, imageToBase64 } from '../../lib/print'

interface BulletinSubject {
  name:         string
  coefficient:  number
  periods:      Record<string, number>
  average:      number
  teacher_name?: string
  rank?:        number | null
  rankTotal?:   number
}

interface ClassStats {
  effectif:     number
  rank:         number | null
  rankTotal:    number
  highest:      number | null
  lowest:       number | null
  classAverage: number | null
}

interface BulletinData {
  student: {
    first_name:  string
    last_name:   string
    matricule:   string
    class_name?: string
    gender:      string
    birth_date?: string
    birth_place?: string
  }
  subjects:       BulletinSubject[]
  generalAverage: number
  classStats:     ClassStats
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

function ordinal(rank: number | null | undefined): string {
  if (!rank) return '—'
  return rank === 1 ? '1er' : `${rank}ème`
}

const PERIOD_LABELS: Record<string, string> = {
  trimestre1: 'T1', trimestre2: 'T2', trimestre3: 'T3',
  semestre1: 'S1',  semestre2: 'S2',
}

export async function printBulletin(data: BulletinData, school: SchoolData, periodLabel: string, isAnnual = false) {
  const logoB64 = school.logo_url ? await imageToBase64(school.logo_url) : ''
  const color   = school.primary_color || '#1A3C5E'
  const appre   = appreciation(data.generalAverage)
  const dob     = data.student.birth_date ? new Date(data.student.birth_date).toLocaleDateString('fr-FR') : '—'
  const { classStats } = data

  const allPeriods = [...new Set(data.subjects.flatMap(s => Object.keys(s.periods)))]
    .sort()
    .map(p => ({ key: p, label: PERIOD_LABELS[p] || p }))

  const logoEl = logoB64
    ? `<img src="${logoB64}" style="width:44px;height:44px;object-fit:contain;border-radius:50%;" />`
    : `<div style="width:44px;height:44px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:white;">${school.name[0]}</div>`

  const subjectRows = data.subjects.map(subj => {
    const periodCells = allPeriods.map(p => {
      const v = subj.periods[p.key]
      const col = v !== undefined ? (v >= 10 ? '#16a34a' : '#dc2626') : '#aaa'
      return `<td style="text-align:center;padding:6px 4px;font-weight:600;color:${col};">${v !== undefined ? v.toFixed(2) : '—'}</td>`
    }).join('')

    const avgCol = subj.average >= 10 ? '#16a34a' : '#dc2626'
    const appEl  = appreciation(subj.average)
    const mxCoef = (subj.average * subj.coefficient).toFixed(2)

    return `
<tr style="border-bottom:1px solid #f0f0f0;">
  <td style="padding:6px 10px;font-size:11px;">${subj.name}</td>
  <td style="text-align:center;padding:6px 4px;font-size:11px;">${subj.coefficient}</td>
  ${periodCells}
  <td style="text-align:center;padding:6px 4px;font-size:11px;color:#666;">${mxCoef}</td>
  <td style="text-align:center;padding:6px 6px;font-weight:700;color:${avgCol};font-size:12px;">${subj.average.toFixed(2)}</td>
  <td style="text-align:center;padding:6px 4px;font-size:10px;color:#666;">${ordinal(subj.rank)}${subj.rankTotal ? `/${subj.rankTotal}` : ''}</td>
  <td style="padding:6px 8px;font-size:9.5px;color:#666;">${subj.teacher_name || '—'}</td>
  <td style="padding:6px 8px;font-size:9.5px;color:${appEl.color};">${appEl.label}</td>
</tr>`
  }).join('')

  const totalCoeff = data.subjects.reduce((sum, s) => sum + Number(s.coefficient), 0)

  const html = `
<style>
  @page { size: A4 landscape; margin: 10mm; }
  @media print { body { background: white !important; } }
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  .bulletin { width: 100%; max-width: 1000px; margin: 0 auto; background: white; }
  table { border-collapse: collapse; width: 100%; }
  th { background: ${color}; color: white; padding: 7px 5px; font-size: 10px; text-align: center; }
  th:first-child { text-align: left; padding-left: 10px; }
  tr:nth-child(even) { background: #fafafa; }
  .stat-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; text-align: center; flex: 1; }
  .stat-label { font-size: 8.5px; color: #888; text-transform: uppercase; letter-spacing: 0.3px; }
  .stat-value { font-size: 15px; font-weight: 800; color: #1a1a1a; margin-top: 2px; }
</style>

<div class="bulletin">

  <!-- En-tête institutionnel -->
  <div style="text-align:center;margin-bottom:4px;">
    <div style="font-size:10px;font-weight:700;color:#1a1a1a;">RÉPUBLIQUE DE CÔTE D'IVOIRE</div>
    <div style="font-size:8.5px;color:#666;font-style:italic;">Union – Discipline – Travail</div>
  </div>

  <!-- Bandeau école -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:10px 14px;background:${color}0d;border-radius:8px;">
    <div style="display:flex;align-items:center;gap:12px;">
      ${logoEl}
      <div>
        <div style="font-size:15px;font-weight:800;color:${color};">${school.name}</div>
        ${school.address ? `<div style="font-size:10px;color:#666;margin-top:1px;">${school.address}</div>` : ''}
      </div>
    </div>
    <div style="text-align:right;font-size:10px;color:#666;">
      ${school.phone ? `<div>Tél : ${school.phone}</div>` : ''}
      ${school.email ? `<div>${school.email}</div>` : ''}
    </div>
  </div>

  <!-- Titre -->
  <div style="background:${color};color:white;padding:9px 16px;border-radius:6px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
    <div style="font-size:15px;font-weight:800;letter-spacing:0.5px;">BULLETIN DE NOTES — ${periodLabel}</div>
    <div style="font-size:11px;">Matricule : <strong>${data.student.matricule}</strong></div>
  </div>

  <!-- Infos élève -->
  <div style="display:flex;gap:24px;margin-bottom:14px;background:#f8fafc;border-radius:8px;padding:10px 16px;flex-wrap:wrap;">
    <div>
      <span style="font-size:9px;color:#888;">Nom & Prénom</span>
      <div style="font-size:13px;font-weight:700;color:#1a1a1a;">${data.student.last_name.toUpperCase()} ${data.student.first_name}</div>
    </div>
    <div>
      <span style="font-size:9px;color:#888;">Classe</span>
      <div style="font-size:12px;font-weight:600;color:#1a1a1a;">${data.student.class_name || '—'}</div>
    </div>
    <div>
      <span style="font-size:9px;color:#888;">Effectif</span>
      <div style="font-size:12px;font-weight:600;color:#1a1a1a;">${classStats.effectif}</div>
    </div>
    <div>
      <span style="font-size:9px;color:#888;">Sexe</span>
      <div style="font-size:12px;font-weight:600;color:#1a1a1a;">${data.student.gender === 'F' ? 'Féminin' : 'Masculin'}</div>
    </div>
    <div>
      <span style="font-size:9px;color:#888;">Né(e) le</span>
      <div style="font-size:12px;font-weight:600;color:#1a1a1a;">${dob}${data.student.birth_place ? ` à ${data.student.birth_place}` : ''}</div>
    </div>
  </div>

  <!-- Tableau des notes -->
  <table>
    <thead>
      <tr>
        <th style="width:22%;text-align:left;padding-left:10px;">Matière</th>
        <th style="width:6%;">Coef.</th>
        ${allPeriods.map(p => `<th style="width:8%;">${p.label}</th>`).join('')}
        <th style="width:8%;">MxCoef</th>
        <th style="width:8%;">Moy.</th>
        <th style="width:9%;">Rang</th>
        <th style="width:14%;text-align:left;">Professeur</th>
        <th style="width:15%;text-align:left;">Appréciation</th>
      </tr>
    </thead>
    <tbody>
      ${subjectRows}
      <tr style="border-top:2px solid ${color};background:${color}0d;font-weight:700;">
        <td style="padding:7px 10px;font-size:11px;">TOTAUX</td>
        <td style="text-align:center;padding:7px 4px;font-size:11px;">${totalCoeff}</td>
        <td colspan="${allPeriods.length}"></td>
        <td></td>
        <td style="text-align:center;padding:7px 4px;color:${color};font-size:13px;">${data.generalAverage.toFixed(2)}</td>
        <td style="text-align:center;padding:7px 4px;font-size:10px;color:#666;">${ordinal(classStats.rank)}${classStats.rankTotal ? `/${classStats.rankTotal}` : ''}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>

  <!-- Résultat + statistiques de classe -->
  <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:stretch;gap:16px;">
    <div style="background:${color}11;border:2px solid ${color};border-radius:10px;padding:12px 22px;text-align:center;">
      <div style="font-size:10px;color:#888;margin-bottom:3px;">MOYENNE ${isAnnual ? 'ANNUELLE' : 'TRIMESTRIELLE'}</div>
      <div style="font-size:28px;font-weight:800;color:${color};">${data.generalAverage.toFixed(2)}</div>
      <div style="font-size:10px;color:#888;">/20 — Rang ${ordinal(classStats.rank)}${classStats.rankTotal ? `/${classStats.rankTotal}` : ''}</div>
      <div style="margin-top:4px;font-size:12px;font-weight:700;color:${appre.color};">${appre.label}</div>
    </div>

    <div style="display:flex;gap:10px;flex:1;">
      <div class="stat-box">
        <div class="stat-label">Plus forte moyenne</div>
        <div class="stat-value" style="color:#16a34a;">${classStats.highest ?? '—'}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Plus faible moyenne</div>
        <div class="stat-value" style="color:#dc2626;">${classStats.lowest ?? '—'}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Moyenne de classe</div>
        <div class="stat-value">${classStats.classAverage ?? '—'}</div>
      </div>
    </div>
  </div>

  <!-- Signatures -->
  <div style="margin-top:28px;display:flex;justify-content:flex-end;gap:50px;">
    <div style="text-align:center;">
      <div style="font-size:10px;color:#888;margin-bottom:30px;">Le Chef d'Établissement</div>
      <div style="border-top:1px solid #999;width:130px;padding-top:4px;font-size:9px;color:#aaa;">Signature et cachet</div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:10px;color:#888;margin-bottom:30px;">Le Parent / Tuteur</div>
      <div style="border-top:1px solid #999;width:130px;padding-top:4px;font-size:9px;color:#aaa;">Lu et approuvé</div>
    </div>
  </div>

</div>`

  printHtml(html, `Bulletin — ${data.student.first_name} ${data.student.last_name}`)
}
