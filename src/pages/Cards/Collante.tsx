import QRCode from 'qrcode'
import { printHtml, imageToBase64 } from '../../lib/print'

interface CollanteSubject {
  name:        string
  coefficient: number
  average:     number
}

interface CollanteStudent {
  first_name:  string
  last_name:   string
  matricule:   string
  class_name?: string
  birth_date?: string
  birth_place?: string
}

interface SchoolData {
  name:          string
  address?:      string
  city?:         string
  logo_url?:     string
  primary_color?: string
}

export interface ExamInfo {
  type:    'bepc' | 'bac' | 'generique'
  session: string
  serie?:  string
  centre?: string
  jury?:   string
  table?:  string
}

function appreciation(avg: number): { label: string; color: string } {
  if (avg >= 16) return { label: 'Très Bien',      color: '#16a34a' }
  if (avg >= 14) return { label: 'Bien',            color: '#2E86AB' }
  if (avg >= 12) return { label: 'Assez Bien',      color: '#0369a1' }
  if (avg >= 10) return { label: 'Passable',        color: '#d97706' }
  if (avg >= 8)  return { label: 'Insuffisant',     color: '#ea580c' }
  return               { label: 'Très Insuffisant', color: '#dc2626' }
}

const EXAM_TITLES: Record<ExamInfo['type'], (info: ExamInfo) => string> = {
  bepc:      info => `BREVET D'ÉTUDES DU PREMIER CYCLE — SESSION ${info.session}`,
  bac:       info => `BACCALAURÉAT DE L'ENSEIGNEMENT SECONDAIRE — SESSION ${info.session}${info.serie ? ` — SÉRIE ${info.serie.toUpperCase()}` : ''}`,
  generique: info => `ANNÉE SCOLAIRE ${info.session}`,
}

export async function printCollante(
  student: CollanteStudent,
  subjects: CollanteSubject[],
  generalAverage: number,
  school: SchoolData,
  info: ExamInfo,
) {
  const logoB64 = school.logo_url ? await imageToBase64(school.logo_url) : ''
  const color   = school.primary_color || '#1A3C5E'
  const appre   = appreciation(generalAverage)
  const dob     = student.birth_date ? new Date(student.birth_date).toLocaleDateString('fr-FR') : '—'
  const isExam  = info.type !== 'generique'

  const qrB64 = await QRCode.toDataURL(
    `ECOLIO|RELEVE|${school.name}|${student.matricule}|${student.last_name} ${student.first_name}|${info.session}`,
    { margin: 0, width: 100 }
  )

  const logoEl = logoB64
    ? `<img src="${logoB64}" style="width:46px;height:46px;object-fit:contain;border-radius:50%;" />`
    : `<div style="width:46px;height:46px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:white;">${school.name[0]}</div>`

  const subjectRows = subjects.map(s => `
<tr style="border-bottom:1px solid #eee;">
  <td style="padding:7px 10px;font-size:11.5px;">${s.name}</td>
  <td style="text-align:center;padding:7px;font-size:11.5px;">${s.coefficient}</td>
  <td style="text-align:center;padding:7px;font-size:12px;font-weight:700;color:${s.average >= 10 ? '#16a34a' : '#dc2626'};">${s.average.toFixed(2)}/20</td>
</tr>`).join('')

  const referenceFields = [
    info.centre ? `<div><span style="color:#888;">Centre de composition :</span> <strong>${info.centre}</strong></div>` : '',
    info.jury   ? `<div><span style="color:#888;">Jury n° :</span> <strong>${info.jury}</strong></div>` : '',
    info.table  ? `<div><span style="color:#888;">N° de table :</span> <strong>${info.table}</strong></div>` : '',
  ].filter(Boolean).join('')

  const html = `
<style>
  @page { size: A4; margin: 14mm; }
  @media print { body { background: white !important; } }
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  .doc { width: 100%; max-width: 720px; margin: 0 auto; background: white; }
  table { border-collapse: collapse; width: 100%; }
  th { background: ${color}; color: white; padding: 8px 6px; font-size: 10.5px; text-align: center; }
  th:first-child { text-align: left; padding-left: 10px; }
</style>

<div class="doc">

  <!-- En-tête institutionnel -->
  <div style="text-align:center;margin-bottom:10px;">
    <div style="font-size:10px;font-weight:700;color:#1a1a1a;">RÉPUBLIQUE DE CÔTE D'IVOIRE</div>
    <div style="font-size:8.5px;color:#666;font-style:italic;">Union – Discipline – Travail</div>
  </div>

  <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:${color}0d;border-radius:8px;margin-bottom:14px;">
    ${logoEl}
    <div>
      <div style="font-size:14px;font-weight:800;color:${color};">${school.name}</div>
      ${school.address ? `<div style="font-size:9.5px;color:#666;">${school.address}</div>` : ''}
    </div>
  </div>

  <!-- Titre -->
  <div style="text-align:center;border:2px solid ${color};border-radius:8px;padding:12px;margin-bottom:6px;">
    <div style="font-size:15px;font-weight:800;color:${color};letter-spacing:0.5px;">${EXAM_TITLES[info.type](info)}</div>
    <div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-top:4px;">RELEVÉ DE NOTES ${isExam ? "— PARCOURS SCOLAIRE" : "ANNUEL"}</div>
  </div>

  <!-- Avertissement : document interne -->
  <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:7px 12px;margin-bottom:16px;">
    <div style="font-size:9px;color:#92400e;">
      Document interne établi par l'établissement à partir des notes scolaires enregistrées.
      ${isExam ? "Ne remplace pas l'attestation officielle délivrée par la Direction des Examens et Concours (DECO)." : ''}
    </div>
  </div>

  <!-- Déclaration -->
  <div style="font-size:11.5px;color:#1a1a1a;line-height:1.8;margin-bottom:14px;">
    Il est attesté que
    <strong>M./Mlle ${student.last_name.toUpperCase()} ${student.first_name}</strong>,
    né(e) le <strong>${dob}</strong>${student.birth_place ? ` à <strong>${student.birth_place}</strong>` : ''},
    Matricule <strong>${student.matricule}</strong>,
    ${student.class_name ? `inscrit(e) en classe de <strong>${student.class_name}</strong>,` : ''}
    a obtenu les résultats suivants au titre de l'année scolaire ${info.session}.
    ${referenceFields ? `<div style="margin-top:8px;font-size:10.5px;">${referenceFields}</div>` : ''}
  </div>

  <!-- Tableau des notes -->
  <table>
    <thead>
      <tr>
        <th style="width:60%;">Matière</th>
        <th style="width:20%;">Coefficient</th>
        <th style="width:20%;">Moyenne</th>
      </tr>
    </thead>
    <tbody>${subjectRows}</tbody>
  </table>

  <!-- Résultat global -->
  <div style="margin-top:16px;display:flex;justify-content:center;">
    <div style="background:${color}11;border:2px solid ${color};border-radius:10px;padding:14px 30px;text-align:center;">
      <div style="font-size:10px;color:#888;margin-bottom:4px;">MOYENNE GÉNÉRALE ANNUELLE</div>
      <div style="font-size:30px;font-weight:800;color:${color};">${generalAverage.toFixed(2)}<span style="font-size:14px;color:#888;">/20</span></div>
      <div style="margin-top:4px;font-size:12px;font-weight:700;color:${appre.color};">${appre.label}</div>
    </div>
  </div>

  <!-- Pied de page : signature + QR -->
  <div style="margin-top:28px;display:flex;justify-content:space-between;align-items:flex-end;">
    <div style="font-size:9px;color:#aaa;">
      Fait à ${school.city || school.address || '—'}, le ${new Date().toLocaleDateString('fr-FR')}
      ${qrB64 ? `<br/><img src="${qrB64}" style="width:56px;height:56px;margin-top:6px;" />` : ''}
    </div>
    <div style="text-align:center;">
      <div style="font-size:10px;color:#888;margin-bottom:30px;">Le Chef d'Établissement</div>
      <div style="border-top:1px solid #999;width:150px;padding-top:4px;font-size:9px;color:#aaa;">Signature et cachet</div>
    </div>
  </div>

</div>`

  printHtml(html, `Relevé — ${student.first_name} ${student.last_name}`)
}
