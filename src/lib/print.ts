/**
 * Ouvre une fenêtre popup, injecte du HTML stylisé, et lance l'impression.
 * L'utilisateur peut choisir "Enregistrer en PDF" depuis la boîte d'impression.
 */
export function printHtml(html: string, title = 'Écolio — Document') {
  const win = window.open('', '_blank', 'width=900,height=650')
  if (!win) {
    alert('Veuillez autoriser les popups pour générer le document.')
    return
  }
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      gap: 16px;
      min-height: 100vh;
    }
    .print-toolbar {
      display: flex;
      gap: 10px;
      width: 100%;
      max-width: 960px;
      justify-content: flex-end;
    }
    .print-btn {
      padding: 8px 20px;
      background: #1A3C5E;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 600;
    }
    .print-btn:hover { background: #2E86AB; }
    .close-btn {
      padding: 8px 20px;
      background: white;
      color: #666;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
    }
    @media print {
      body { background: white; padding: 0; }
      .print-toolbar { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <button class="close-btn" onclick="window.close()">Fermer</button>
    <button class="print-btn" onclick="window.print()">🖨️ Imprimer / PDF</button>
  </div>
  ${html}
</body>
</html>`)
  win.document.close()
}

/** Convertit une URL en base64 pour l'embarquer dans le HTML imprimé */
export async function imageToBase64(url: string): Promise<string> {
  try {
    const r = await fetch(url)
    const blob = await r.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
}
