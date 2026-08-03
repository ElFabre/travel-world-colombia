/**
 * Serializa un objeto para inyectarlo en un <script type="application/ld+json">.
 *
 * `JSON.stringify` NO escapa `<`, así que un texto guardado en el panel que
 * contenga `</script>` cierra la etiqueta antes de tiempo y lo que siga se
 * ejecuta como HTML/JS en el dominio público (XSS almacenado). Escapamos `<`
 * como `<`: sigue siendo JSON válido y el navegador ya no ve la etiqueta.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
