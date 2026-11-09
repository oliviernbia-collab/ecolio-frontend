import api from './axios'

// Télécharge un fichier depuis une route API protégée (le navigateur ne peut pas
// naviguer directement vers l'URL car elle exige l'en-tête Authorization).
export async function downloadFile(url: string, fallbackFilename: string) {
  const res = await api.get(url, { responseType: 'blob' })
  const disposition = res.headers['content-disposition'] as string | undefined
  const match = disposition?.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] || fallbackFilename

  const blobUrl = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}

// Imprime un PDF servi par une route API protégée : il est chargé dans un cadre invisible
// puis la boîte d'impression du navigateur s'ouvre (choix de l'imprimante ou « Enregistrer en PDF »).
export async function printPdf(url: string) {
  const res = await api.get(url, { responseType: 'blob' })
  const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  frame.src = blobUrl
  frame.onload = () => {
    try {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    } catch {
      // Navigateurs qui n'impriment pas un PDF dans un cadre (certains mobiles) : on l'ouvre.
      window.open(blobUrl, '_blank')
    }
    // Le cadre reste le temps que la boîte d'impression lise le document.
    setTimeout(() => { frame.remove(); window.URL.revokeObjectURL(blobUrl) }, 60_000)
  }
  document.body.appendChild(frame)
}
