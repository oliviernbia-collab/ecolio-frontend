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
