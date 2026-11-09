// Calcul des moyennes affichées dans les portails parent et élève. Une seule règle partout,
// celle du bulletin : moyenne de chaque matière sur 20, puis moyenne générale pondérée par
// les coefficients. Les colonnes DECIMAL arrivent en texte depuis l'API, d'où les Number().

export interface GradeLike {
  subject_name?: string | null
  value: number | string
  max_value: number | string
  coefficient?: number | string | null
}

export interface SubjectAverage<G> {
  name: string
  grades: G[]
  coeff: number
  avg: number
}

const onTwenty = (g: GradeLike) => (Number(g.value) / (Number(g.max_value) || 20)) * 20

// Moyenne sur 20 de chaque matière, triée par nom de matière.
export function subjectAverages<G extends GradeLike>(grades: G[]): SubjectAverage<G>[] {
  const bySubject: Record<string, { grades: G[]; coeff: number }> = {}
  for (const g of grades) {
    const key = g.subject_name ?? 'Inconnue'
    if (!bySubject[key]) bySubject[key] = { grades: [], coeff: Number(g.coefficient ?? 1) || 1 }
    bySubject[key].grades.push(g)
  }
  return Object.entries(bySubject)
    .map(([name, s]) => ({ name, grades: s.grades, coeff: s.coeff, avg: s.grades.reduce((t, g) => t + onTwenty(g), 0) / s.grades.length }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// Moyenne générale pondérée par les coefficients ; null s'il n'y a aucune note.
export function generalAverage(subjects: { avg: number; coeff: number }[]): number | null {
  const totalCoeff = subjects.reduce((t, s) => t + s.coeff, 0)
  return totalCoeff > 0 ? subjects.reduce((t, s) => t + s.avg * s.coeff, 0) / totalCoeff : null
}
