/**
 * Formatea un número como Guaraní Paraguayo (₲)
 * Sin decimales (el guaraní no usa centavos).
 */
export function formatPYG(amount: number): string {
  return (
    '₲ ' +
    Math.round(amount).toLocaleString('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}
