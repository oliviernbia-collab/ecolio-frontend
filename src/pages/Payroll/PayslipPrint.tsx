import { printHtml, imageToBase64 } from '../../lib/print'

interface PayslipData {
  reference: string
  first_name: string
  last_name: string
  position?: string
  period_month: string
  base_salary: number
  bonuses: number
  bonuses_detail?: string
  deductions: number
  deductions_detail?: string
  net_amount: number
  status: string
  paid_at?: string
}

interface SchoolData {
  name: string
  address?: string
  phone?: string
  logo_url?: string
  primary_color?: string
}

function monthLabel(period: string) {
  const [y, m] = period.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export async function printPayslip(data: PayslipData, school: SchoolData) {
  const logoB64 = school.logo_url ? await imageToBase64(school.logo_url) : ''
  const color   = school.primary_color || '#1A3C5E'
  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' FCFA'

  const logoEl = logoB64
    ? `<img src="${logoB64}" style="width:56px;height:56px;object-fit:contain;" />`
    : `<div style="width:56px;height:56px;background:${color};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:white;">${school.name[0]}</div>`

  const html = `
<style>
  @page { size: A4 portrait; margin: 15mm; }
  @media print { body { background: white !important; } }
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  .payslip { width: 100%; max-width: 700px; margin: 0 auto; background: white; }
  table { border-collapse: collapse; width: 100%; }
  td { padding: 8px 10px; font-size: 13px; }
</style>
<div class="payslip">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding-bottom:14px;border-bottom:3px solid ${color};">
    <div style="display:flex;align-items:center;gap:14px;">
      ${logoEl}
      <div>
        <div style="font-size:16px;font-weight:800;color:${color};">${school.name}</div>
        ${school.address ? `<div style="font-size:11px;color:#666;">${school.address}</div>` : ''}
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:16px;font-weight:800;color:${color};letter-spacing:1px;">BULLETIN DE PAIE</div>
      <div style="font-size:12px;color:#888;margin-top:2px;text-transform:capitalize;">${monthLabel(data.period_month)}</div>
      <div style="font-size:10px;color:#aaa;font-family:monospace;">${data.reference}</div>
    </div>
  </div>

  <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:18px;">
    <div style="font-size:10px;color:#888;">Employé</div>
    <div style="font-size:14px;font-weight:700;">${data.last_name.toUpperCase()} ${data.first_name}</div>
    ${data.position ? `<div style="font-size:12px;color:#666;">${data.position}</div>` : ''}
  </div>

  <table>
    <tr style="border-bottom:1px solid #eee;"><td>Salaire de base</td><td style="text-align:right;font-weight:600;">${fmt(data.base_salary)}</td></tr>
    <tr style="border-bottom:1px solid #eee;">
      <td>Primes${data.bonuses_detail ? ` <span style="color:#888;font-size:11px;">(${data.bonuses_detail})</span>` : ''}</td>
      <td style="text-align:right;font-weight:600;color:#16a34a;">+ ${fmt(data.bonuses)}</td>
    </tr>
    <tr style="border-bottom:1px solid #eee;">
      <td>Retenues${data.deductions_detail ? ` <span style="color:#888;font-size:11px;">(${data.deductions_detail})</span>` : ''}</td>
      <td style="text-align:right;font-weight:600;color:#dc2626;">− ${fmt(data.deductions)}</td>
    </tr>
  </table>

  <div style="margin-top:16px;background:${color}11;border:2px solid ${color};border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:13px;font-weight:700;color:${color};">NET À PAYER</div>
    <div style="font-size:24px;font-weight:800;color:${color};">${fmt(data.net_amount)}</div>
  </div>

  <div style="margin-top:10px;font-size:11px;color:#888;">
    Statut : <strong style="color:${data.status === 'paid' ? '#16a34a' : '#d97706'};">${data.status === 'paid' ? 'Payé' : 'En attente'}</strong>
    ${data.paid_at ? ` · le ${new Date(data.paid_at).toLocaleDateString('fr-FR')}` : ''}
  </div>

  <div style="margin-top:36px;display:flex;justify-content:space-between;">
    <div style="text-align:center;">
      <div style="font-size:10px;color:#888;margin-bottom:30px;">Signature de l'employeur</div>
      <div style="border-top:1px solid #999;width:140px;padding-top:4px;font-size:9px;color:#aaa;">Signature et cachet</div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:10px;color:#888;margin-bottom:30px;">Signature de l'employé</div>
      <div style="border-top:1px solid #999;width:140px;padding-top:4px;font-size:9px;color:#aaa;">Reçu pour solde</div>
    </div>
  </div>
</div>`

  printHtml(html, `Bulletin de paie — ${data.first_name} ${data.last_name}`)
}
